"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import {
	Search,
	Download,
	Filter,
	Eye,
	Trash2,
	ChevronDown,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	X,
	UserPlus,
} from "lucide-react";
import toast from "@/lib/toast";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useCandidates } from "@/hooks/useCandidates";
import CandidatesTableSkeleton from "@/components/candidates/CandidatesTableSkeleton";
import EmptyState from "@/components/candidates/EmptyState";
import DeleteCandidateModal from "@/components/modals/DeleteCandidateModal";
import SearchableMultiSelect from "@/components/ui/SearchableMultiSelect";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import Avatar from '@/components/ui/Avatar';
import RecommendationBadge from '@/components/ui/RecommendationBadge';
import BulkActionBar from '@/components/candidates/BulkActionBar';
import { getHiringStatusBadge, getHiringStatusLabel } from '@/utils/candidateUtils';
import Link from 'next/link';
import api, { candidatesApi } from "@/lib/api";

function CandidatesContent() {
	const searchParams = useSearchParams();
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [experienceRange, setExperienceRange] = useState([0, 10]);
	const [debouncedExperienceRange, setDebouncedExperienceRange] = useState([
		0, 10,
	]);
	const [minRole, setMinRole] = useState(0);
	const [debouncedMinRole, setDebouncedMinRole] = useState(0);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedCandidate, setSelectedCandidate] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [showShortlistedOnly, setShowShortlistedOnly] = useState(
		searchParams?.get("shortlisted") === "true",
	);
	const ITEMS_PER_PAGE = 6;
	const [sortBy, setSortBy] = useState("");
	const [sortOrder, setSortOrder] = useState("desc");
	const [statusFilter, setStatusFilter] = useState("");
	const [confidenceRange, setConfidenceRange] = useState([0, 100]);
	const [debouncedConfidenceRange, setDebouncedConfidenceRange] = useState([
		0, 100,
	]);
	const [dateRange, setDateRange] = useState({ start: "", end: "" });
	const [educationFilter, setEducationFilter] = useState("");
	const [certificationFilters, setCertificationFilters] = useState<string[]>([]);
	const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
	const [skillInput, setSkillInput] = useState("");
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [companyFilters, setCompanyFilters] = useState<string[]>([]);
	const [filterOptions, setFilterOptions] = useState<{
		certifications: string[];
		companies: string[];
		skills: string[];
	}>({ certifications: [], companies: [], skills: [] });
	const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(true);
	const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
	const [selectAll, setSelectAll] = useState(false);

	// Debounce searchQuery changes
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery);
			setCurrentPage(1);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Debounce minRole changes
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedMinRole(minRole);
			setCurrentPage(1);
		}, 500);

		return () => clearTimeout(timer);
	}, [minRole]);

	// Debounce experienceRange changes
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedExperienceRange(experienceRange);
			setCurrentPage(1);
		}, 500);

		return () => clearTimeout(timer);
	}, [experienceRange]);

	// Load filter options on mount
	useEffect(() => {
		const loadFilterOptions = async () => {
			try {
				setIsLoadingFilterOptions(true);
				const options = await candidatesApi.getFilterOptions();
				setFilterOptions(options);
			} catch (error) {
				console.error('Failed to load filter options:', error);
				toast.error('Failed to load filter options');
			} finally {
				setIsLoadingFilterOptions(false);
			}
		};
		loadFilterOptions();
	}, []);

	// Add debounce effect:
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedConfidenceRange(confidenceRange);
			setCurrentPage(1);
		}, 500);
		return () => clearTimeout(timer);
	}, [confidenceRange]);

	// Build filters object with useMemo to prevent infinite re-renders
	const filters = useMemo(() => {
		const filterObj: any = {};
		if (debouncedSearchQuery) filterObj.search = debouncedSearchQuery;
		if (debouncedMinRole > 0) filterObj.score_min = debouncedMinRole;
		if (debouncedExperienceRange[0] > 0)
			filterObj.experience_min = debouncedExperienceRange[0];
		if (debouncedExperienceRange[1] < 10)
			filterObj.experience_max = debouncedExperienceRange[1];
		if (sortBy) filterObj.sortBy = sortBy;
		if (sortOrder) filterObj.sortOrder = sortOrder;
		if (statusFilter) filterObj.status = statusFilter;
		// Update filters:
		if (debouncedConfidenceRange[0] > 0)
			filterObj.confidenceMin = debouncedConfidenceRange[0];
		if (debouncedConfidenceRange[1] < 100)
			filterObj.confidenceMax = debouncedConfidenceRange[1];
		if (dateRange.start) filterObj.createdAfter = dateRange.start;
		if (dateRange.end) filterObj.createdBefore = dateRange.end;
		if (educationFilter) filterObj.educationLevel = educationFilter;
		if (certificationFilters.length > 0) filterObj.certifications = certificationFilters;
		if (skillsFilter.length > 0) filterObj.requiredSkills = skillsFilter;
		if (companyFilters.length > 0) filterObj.companies = companyFilters;

		return filterObj;
	}, [
		debouncedSearchQuery,
		debouncedMinRole,
		debouncedExperienceRange,
		sortBy,
		sortOrder,
		statusFilter,
		debouncedConfidenceRange,
		dateRange,
		educationFilter,
		certificationFilters,
		skillsFilter,
		companyFilters,
	]);

	// Get ALL candidates without pagination for filtering
	const {
		candidates: allCandidates,
		isLoading,
		error,
		refetch,
	} = useCandidates(filters, 1, 1000);

	// Filter candidates based on shortlist toggle
	const filteredCandidates = useMemo(() => {
		if (showShortlistedOnly) {
			return allCandidates.filter((c) => c.isShortlisted);
		}
		return allCandidates;
	}, [allCandidates, showShortlistedOnly]);

	// Client-side pagination
	const totalFiltered = filteredCandidates.length;
	const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE);
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const candidates = filteredCandidates.slice(
		startIndex,
		startIndex + ITEMS_PER_PAGE,
	);

	const pagination = {
		total: totalFiltered,
		page: currentPage,
		totalPages,
	};

	// Count shortlisted candidates
	const shortlistedCount = useMemo(() => {
		return allCandidates.filter((c) => c.isShortlisted).length;
	}, [allCandidates]);

	// Check if any filters are active
	const hasActiveFilters = useMemo(() => {
		return (
			searchQuery ||
			minRole > 0 ||
			experienceRange[0] > 0 || experienceRange[1] < 10 ||
			sortBy ||
			statusFilter ||
			confidenceRange[0] > 0 || confidenceRange[1] < 100 ||
			dateRange.start || dateRange.end ||
			educationFilter ||
			certificationFilters.length > 0 ||
			skillsFilter.length > 0 ||
			companyFilters.length > 0 ||
			showShortlistedOnly
		);
	}, [
		searchQuery, minRole, experienceRange, sortBy, statusFilter,
		confidenceRange, dateRange, educationFilter, certificationFilters,
		skillsFilter, companyFilters, showShortlistedOnly
	]);

	// Detect if any candidates are still processing
	const hasProcessingCandidates = useMemo(() => {
		return candidates.some(
			(c) => c.status === "pending" || c.status === "processing",
		);
	}, [candidates]);

	// Auto-refetch when candidates are processing
	useEffect(() => {
		if (hasProcessingCandidates) {
			const interval = setInterval(() => {
				refetch();
			}, 5000); // Poll every 5 seconds

			return () => clearInterval(interval);
		}
	}, [hasProcessingCandidates, refetch]);

	const handleDeleteClick = (id: string, name: string) => {
		setSelectedCandidate({ id, name });
		setIsModalOpen(true);
	};

	const handleSelectAll = () => {
		if (selectAll) {
			setSelectedCandidates([]);
		} else {
			setSelectedCandidates(candidates.map(c => c._id || c.id));
		}
		setSelectAll(!selectAll);
	};

	const handleSelectCandidate = (id: string) => {
		setSelectedCandidates(prev => {
			if (prev.includes(id)) {
				return prev.filter(cid => cid !== id);
			}
			return [...prev, id];
		});
	};

	const handleBulkShortlist = async () => {
		try {
			// TODO: Implement bulk shortlist API call
			toast.success(`${selectedCandidates.length} candidates shortlisted`);
			setSelectedCandidates([]);
			setSelectAll(false);
			refetch();
		} catch (error: any) {
			toast.error('Failed to shortlist candidates');
		}
	};

	const handleBulkReject = async () => {
		try {
			// TODO: Implement bulk reject API call
			toast.success(`${selectedCandidates.length} candidates rejected`);
			setSelectedCandidates([]);
			setSelectAll(false);
			refetch();
		} catch (error: any) {
			toast.error('Failed to reject candidates');
		}
	};

	const handleBulkExport = async () => {
		try {
			// Use existing export functionality
			await handleExport('csv');
			setSelectedCandidates([]);
			setSelectAll(false);
		} catch (error: any) {
			toast.error('Failed to export candidates');
		}
	};

	const handleDeleteConfirm = async () => {
		if (!selectedCandidate) return;
		try {
			await candidatesApi.delete(selectedCandidate.id);
			toast.success("Candidate deleted successfully");
			refetch();
		} catch (error: any) {
			toast.error(
				error.response?.data?.message || "Failed to delete candidate",
			);
			throw error;
		}
	};

	const handleClearFilters = () => {
		setSearchQuery("");
		setExperienceRange([0, 10]);
		setMinRole(0);
		setShowShortlistedOnly(false);
		setSortBy("");
		setSortOrder("desc");
		setStatusFilter("");
		setConfidenceRange([0, 100]);
		setDateRange({ start: "", end: "" });
		setEducationFilter("");
		setCertificationFilters([]);
		setSkillsFilter([]);
		setSkillInput("");
		setCompanyFilters([]);
		toast.success("Filters cleared");
	};

	const handleExport = async (format: "csv" | "xlsx") => {
		try {
			setIsExporting(true);
			setIsExportMenuOpen(false);

			// Use api client which automatically sends cookies
			const response = await api.get('/api/export/candidates', {
				params: { format },
				responseType: 'blob',
			});

			// Create blob from response
			const blob = new Blob([response.data], {
				type: format === 'csv' 
					? 'text/csv' 
					: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			});
			
			// Trigger download
			const downloadUrl = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = downloadUrl;
			link.download = `candidates-${new Date().toISOString().split("T")[0]}.${format}`;
			link.click();
			window.URL.revokeObjectURL(downloadUrl);

			toast.success(`Exported as ${format.toUpperCase()} successfully`);
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Export failed. Please try again.");
		} finally {
			setIsExporting(false);
		}
	};
	const getStatusBadge = (status: string) => {
		const styles: Record<string, string> = {
			Shortlisted: "bg-blue-500/20 text-blue-600 border-blue-500/30",
			New: "bg-gray-500/20 text-gray-600 border-gray-500/30",
			Rejected: "bg-red-500/20 text-red-600 border-red-500/30",
			pending:
				"bg-yellow-500/20 text-yellow-600 border-yellow-500/30 animate-pulse",
			processing:
				"bg-blue-500/20 text-blue-600 border-blue-500/30 animate-pulse",
			completed: "bg-green-500/20 text-green-600 border-green-500/30",
			failed: "bg-red-500/20 text-red-600 border-red-500/30",
		};
		return styles[status] || styles["New"];
	};

	const getRoleFitBadge = (score: number) => {
		return score > 75
			? "bg-green-100 text-green-700 border border-green-300"
			: "bg-orange-100 text-orange-700 border border-orange-300";
	};

	return (
		<ProtectedRoute>
			<Layout>
				<div className="p-4 md:p-6 lg:p-8 w-full overflow-x-hidden">
					<div className="max-w-7xl mx-auto w-full">
						{/* Header */}
						<div className="mb-6 md:mb-8 flex items-start justify-between">
							<div>
								<h1 className="text-2xl md:text-3xl font-bold text-black mb-2">
									Candidate Pipeline
								</h1>
								<p className="text-gray-400 text-sm md:text-base">
									Filter and manage your candidate pool
								</p>
							</div>
							<div className="hidden md:block">
								<NotificationDropdown />
							</div>
						</div>

						{/* Search and Filters Section */}
						<div className="bg-[#fff] rounded-xl border border-gray-800 p-4 md:p-6 mb-4 md:mb-6">
							{/* Search Bar */}
							<div className="relative mb-6">
								<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input
									type="text"
									placeholder="Search Candidates..."
									value={searchQuery}
									onChange={(e) =>
										setSearchQuery(e.target.value)
									}
									className="w-full bg-[#f6f6f6] border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
								/>
							</div>

							{/* Basic Filters Row */}
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
								<div className="flex flex-wrap gap-3">
									<button
										onClick={() => {
											setShowShortlistedOnly(
												!showShortlistedOnly,
											);
											setCurrentPage(1);
										}}
										className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
											showShortlistedOnly
												? "bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white border-transparent"
												: "bg-f6f6f6 border-gray-300 text-black hover:border-gray-600"
										}`}
									>
										<span className="text-sm font-bold">
											Shortlisted{" "}
											{shortlistedCount > 0 &&
												`(${shortlistedCount})`}
										</span>
									</button>
									<button
										onClick={handleClearFilters}
										disabled={!hasActiveFilters}
										className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
											hasActiveFilters
												? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300"
												: "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
										}`}
									>
										<X className="w-4 h-4" />
										<span className="text-sm font-bold">
											Clear All Filters
										</span>
									</button>
									<button
										onClick={() =>
											setShowAdvanced(!showAdvanced)
										}
										className="flex items-center justify-center gap-2 px-4 py-2 bg-f6f6f6 border border-gray-300 rounded-lg text-black hover:border-gray-600 transition-colors"
									>
										<Filter className="w-4 h-4" />
										<span className="text-sm font-bold">
											{showAdvanced ? "Hide" : "Show"}{" "}
											Advanced Filters
										</span>
									</button>
								</div>
								<div className="flex flex-wrap gap-3">
									<select
										value={sortBy}
										onChange={(e) =>
											setSortBy(e.target.value)
										}
										className="px-4 py-2 bg-f6f6f6 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-gray-500"
									>
										<option value="">Sort By</option>
										<option value="score">
											Role Fit Score
										</option>
										<option value="experience">
											Experience
										</option>
										<option value="name">Name</option>
										<option value="createdAt">
											Date Added
										</option>
										<option value="confidenceScore">
											Confidence Score
										</option>
									</select>
									{sortBy && (
										<button
											onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
											className="flex items-center justify-center px-3 py-2 bg-f6f6f6 border border-gray-300 rounded-lg text-black hover:border-gray-600 transition-colors"
											title={sortOrder === 'asc' ? 'Low to High' : 'High to Low'}
										>
											{sortOrder === 'asc' ? (
												<ArrowUp className="w-4 h-4" />
											) : (
												<ArrowDown className="w-4 h-4" />
											)}
										</button>
									)}
									<div className="relative">
										<button
											onClick={() =>
												setIsExportMenuOpen(
													!isExportMenuOpen,
												)
											}
											disabled={isExporting}
											className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500/10 border border-gray-500/30 rounded-lg text-black hover:bg-cyan-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<Download className="w-4 h-4" />
											<span className="text-sm">
												{isExporting
													? "Exporting..."
													: "Export Data"}
											</span>
											<ChevronDown className="w-4 h-4" />
										</button>
										{isExportMenuOpen && (
											<div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
												<button
													onClick={() =>
														handleExport("csv")
													}
													className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
												>
													Export as CSV
												</button>
												<button
													onClick={() =>
														handleExport("xlsx")
													}
													className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
												>
													Export as XLSX
												</button>
											</div>
										)}
									</div>
								</div>
							</div>






							{/* Advanced Filters Section */}
							{showAdvanced && (
								<div className="border-t border-gray-200 pt-6 mb-6">
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
										{/* Status Filter */}
										<select
											value={statusFilter}
											onChange={(e) =>
												setStatusFilter(
													e.target.value,
												)
											}
											className="w-full min-w-0 px-4 py-2 bg-f6f6f6 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-gray-500"
										>
											<option value="">
												All Status
											</option>
											<option value="pending">
												Pending
											</option>
											<option value="processing">
												Processing
											</option>
											<option value="completed">
												Completed
											</option>
											<option value="failed">
												Failed
											</option>
										</select>

										{/* Education Filter */}
										<select
											value={educationFilter}
											onChange={(e) =>
												setEducationFilter(
													e.target.value,
												)
											}
											className="w-full min-w-0 px-4 py-2 bg-f6f6f6 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-gray-500"
										>
											<option value="">
												All Education
											</option>
											<option value="phd">PhD</option>
											<option value="master">
												Master's
											</option>
											<option value="bachelor">
												Bachelor's
											</option>
											<option value="associate">
												Associate
											</option>
											<option value="diploma">
												Diploma
											</option>
										</select>
										{/* Certification Filter */}
										<SearchableMultiSelect
											options={filterOptions.certifications}
											selectedValues={certificationFilters}
											onChange={setCertificationFilters}
											placeholder="Filter by certifications..."
											disabled={isLoadingFilterOptions}
										/>
										{/* Company Filter */}
										<SearchableMultiSelect
											options={filterOptions.companies}
											selectedValues={companyFilters}
											onChange={setCompanyFilters}
											placeholder="Filter by companies..."
											disabled={isLoadingFilterOptions}
										/>
									</div>
									
									{/* Skills Filter */}
									<div className="mt-4">
										<SearchableMultiSelect
											options={filterOptions.skills}
											selectedValues={skillsFilter}
											onChange={setSkillsFilter}
											placeholder="Filter by skills..."
											disabled={isLoadingFilterOptions}
										/>
									</div>

									{/* Date Range and Confidence Range */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
										<div>
											<label className="text-sm text-gray-400 mb-3 block">
												Confidence Range:{" "}
												{confidenceRange[0]} -{" "}
												{confidenceRange[1]}%
											</label>
											<div className="pt-1">
												<Slider
													range
													min={0}
													max={100}
													value={confidenceRange}
													onChange={(value) =>
														setConfidenceRange(
															value as number[],
														)
													}
													className="custom-slider"
												/>
											</div>
										</div>
										<div>
											<label className="text-sm text-gray-400 mb-3 block">
												Date Range
											</label>
											<div className="flex gap-2">
												<input
													type="date"
													value={dateRange.start}
													onChange={(e) =>
														setDateRange(
															(prev) => ({
																...prev,
																start: e.target
																	.value,
															}),
														)
													}
													className="flex-1 px-3 py-2 bg-f6f6f6 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-gray-500"
												/>
												<input
													type="date"
													value={dateRange.end}
													onChange={(e) =>
														setDateRange(
															(prev) => ({
																...prev,
																end: e.target
																	.value,
															}),
														)
													}
													className="flex-1 px-3 py-2 bg-f6f6f6 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-gray-500"
												/>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Range Sliders */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
								{/* Experience Range */}
								<div>
									<label className="text-sm text-gray-400 mb-3 block">
										Experience Range: {experienceRange[0]} -{" "}
										{experienceRange[1]} years
									</label>
									<div className="pt-1">
										<Slider
											range
											min={0}
											max={10}
											value={experienceRange}
											onChange={(value) =>
												setExperienceRange(
													value as number[],
												)
											}
											className="custom-slider"
										/>
									</div>
								</div>

								{/* Minimum Role Fit Score */}
								<div>
									<label className="text-sm text-gray-400 mb-3 block">
										Minimum Role Fit Score:{" "}
										<span className="inline-block w-12 text-left">
											{minRole}%
										</span>
									</label>
									<input
										type="range"
										min="0"
										max="100"
										value={minRole}
										onChange={(e) =>
											setMinRole(parseInt(e.target.value))
										}
										className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-500"
									/>
								</div>
							</div>
						</div>

						{/* Results Count */}
						{!isLoading && !error && candidates.length > 0 && (
							<div className="mb-4 text-sm text-gray-600">
								Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}
								-
								{Math.min(
									currentPage * ITEMS_PER_PAGE,
									pagination.total,
								)}{" "}
								of {pagination.total} candidates
							</div>
						)}

						{/* Candidates Table */}
						{isLoading ? (
							<CandidatesTableSkeleton />
						) : error ? (
							<div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
								<h3 className="text-lg font-semibold text-red-600 mb-2">
									Error Loading Candidates
								</h3>
								<p className="text-gray-500">{error}</p>
							</div>
						) : candidates.length === 0 ? (
							<EmptyState />
						) : (
							<>
								{/* Mobile & Tablet Card View */}
								<div className="lg:hidden space-y-4">
									{candidates.map((candidate) => (
										<div
											key={candidate._id || candidate.id}
											className="bg-white rounded-lg border border-gray-200 p-4"
										>
											<div className="flex items-start justify-between mb-3">
												<div className="flex-1">
													<h3 className="font-semibold text-gray-900 mb-1">
														{candidate.name}
													</h3>
													<p className="text-sm text-gray-500">
														{candidate.jobRole ||
															"N/A"}
													</p>
												</div>
												<span
													className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(candidate.status || "New")}`}
												>
													{candidate.status || "New"}
												</span>
											</div>

											<div className="grid grid-cols-2 gap-3 mb-3">
												<div>
													<p className="text-xs text-gray-500 mb-1">
														Role Fit
													</p>
													<span
														className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getRoleFitBadge(candidate.roleFitScore || 0)}`}
													>
														{candidate.roleFitScore ||
															0}
													</span>
												</div>
												<div>
													<p className="text-xs text-gray-500 mb-1">
														Experience
													</p>
													<p className="text-sm font-medium text-gray-700">
														{(candidate.experienceYears || 0).toFixed(2)}{" "}
														yrs
													</p>
												</div>
											</div>

											<div className="flex items-center justify-between pt-3 border-t border-gray-200">
												<span className="text-sm text-gray-600">
													Confidence:{" "}
													{candidate.confidenceScore ||
														0}
													%
												</span>
												<div className="flex items-center gap-2">
													<button
														onClick={() =>
															(window.location.href = `/candidates/${candidate._id || candidate.id}`)
														}
														className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
													>
														<Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
													</button>
													<button
														onClick={() =>
															handleDeleteClick(
																candidate._id ||
																	candidate.id,
																candidate.name,
															)
														}
														className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
													>
														<Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
													</button>
												</div>
											</div>
										</div>
									))}
								</div>

								{/* Desktop Table View */}
								<div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
									<div className="overflow-x-auto">
										<table className="w-full">
											<thead>
												<tr className="border-b border-gray-200 bg-gray-50">
													<th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
														Candidate Name
													</th>
													<th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
														Target Role
													</th>
													<th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
														Experience
													</th>
													<th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
														Top Skills
													</th>
													<th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
														Role Fit
													</th>
													<th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
														Confidence
													</th>
													<th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
														Status
													</th>
													<th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
														Actions
													</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-gray-200">
												{candidates.map((candidate) => (
													<tr
														key={
															candidate._id ||
															candidate.id
														}
														className="hover:bg-gray-50 transition-colors"
													>
														<td className="py-3 px-3 lg:px-4 xl:px-6">
															<div>
																<p className="text-sm xl:text-base text-gray-900 font-medium">
																	{
																		candidate.name
																	}
																</p>
																<p className="text-xs xl:text-sm text-gray-500">
																	{candidate.jobRole ||
																		"N/A"}
																</p>
															</div>
														</td>
														<td className="py-3 px-3 lg:px-4 xl:px-6">
															<p className="text-sm xl:text-base text-gray-700">
																{candidate.jobRole ||
																	"N/A"}
															</p>
														</td>
														<td className="py-3 px-3 lg:px-4 xl:px-6">
															<p className="text-sm xl:text-base text-gray-700">
																{(candidate.experienceYears || 0).toFixed(2)}{" "}
																yrs
															</p>
														</td>
														<td className="py-3 px-3 lg:px-4 xl:px-6">
															<div className="flex flex-wrap gap-1">
																{(
																	candidate.skills ||
																	[]
																)
																	.slice(0, 3)
																	.map(
																		(
																			skill: string,
																			idx: string,
																		) => (
																			<span
																				key={
																					idx
																				}
																				className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
																			>
																				{
																					skill
																				}
																			</span>
																		),
																	)}
															</div>
														</td>
														<td className="py-3 px-3 lg:px-4 xl:px-6">
															<span
																className={`inline-flex items-center px-2 xl:px-3 py-1 rounded-full text-xs font-semibold ${getRoleFitBadge(candidate.roleFitScore || 0)}`}
															>
																{candidate.roleFitScore ||
																	0}
															</span>
														</td>
														<td className="py-3 px-3 lg:px-4 xl:px-6">
															<span className="text-sm xl:text-base text-gray-700">
																{candidate.confidenceScore ||
																	0}
																%
															</span>
														</td>
														<td className="py-3 px-3 lg:px-4 xl:px-6">
															<span
																className={`inline-flex items-center px-2 xl:px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(candidate.status || "New")}`}
															>
																{candidate.status ||
																	"New"}
															</span>
														</td>
														<td className="py-3 px-3 lg:px-4 xl:px-6">
															<div className="flex items-center gap-2">
																<button
																	onClick={() =>
																		(window.location.href = `/candidates/${candidate._id || candidate.id}`)
																	}
																	className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
																>
																	<Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
																</button>
																<button
																	onClick={() =>
																		handleDeleteClick(
																			candidate._id ||
																				candidate.id,
																			candidate.name,
																		)
																	}
																	className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
																>
																	<Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
																</button>
															</div>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>

								{/* Pagination */}
								{pagination.totalPages > 1 && (
									<div className="mt-6 flex justify-end">
										<div className="flex items-center gap-2">
											<button
												onClick={() =>
													setCurrentPage((p) =>
														Math.max(1, p - 1),
													)
												}
												disabled={currentPage === 1}
												className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												Previous
											</button>

											{currentPage > 2 && (
												<button
													onClick={() =>
														setCurrentPage(1)
													}
													className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
												>
													1
												</button>
											)}

											{currentPage > 3 && (
												<span className="px-2">
													...
												</span>
											)}

											{[
												currentPage - 1,
												currentPage,
												currentPage + 1,
											]
												.filter(
													(p) =>
														p > 0 &&
														p <=
															pagination.totalPages,
												)
												.map((p) => (
													<button
														key={p}
														onClick={() =>
															setCurrentPage(p)
														}
														className={`px-3 py-2 text-sm border rounded-lg ${
															p === currentPage
																? "bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white border-transparent"
																: "border-gray-300 hover:bg-gray-50"
														}`}
													>
														{p}
													</button>
												))}

											{currentPage <
												pagination.totalPages - 2 && (
												<span className="px-2">
													...
												</span>
											)}

											{currentPage <
												pagination.totalPages - 1 && (
												<button
													onClick={() =>
														setCurrentPage(
															pagination.totalPages,
														)
													}
													className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
												>
													{pagination.totalPages}
												</button>
											)}

											<button
												onClick={() =>
													setCurrentPage((p) =>
														Math.min(
															pagination.totalPages,
															p + 1,
														),
													)
												}
												disabled={
													currentPage ===
													pagination.totalPages
												}
												className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												Next
											</button>
										</div>
									</div>
								)}
							</>
						)}

						<DeleteCandidateModal
							isOpen={isModalOpen}
							onClose={() => setIsModalOpen(false)}
							onConfirm={handleDeleteConfirm}
							candidateName={selectedCandidate?.name || ""}
						/>
					</div>
				</div>
			</Layout>
		</ProtectedRoute>
	);
}

const CandidatesPage = () => {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<CandidatesContent />
		</Suspense>
	);
};

export default CandidatesPage;
