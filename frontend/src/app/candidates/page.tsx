"use client";

import { useState } from "react";
import {
	Search,
	Download,
	Filter,
	Eye,
	Trash2,
	ChevronDown,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const CandidatesPage = () => {
	const [experienceRange, setExperienceRange] = useState([0, 10]);
	const [minRole, setMinRole] = useState(0);
	const getStatusBadge = (status: string) => {
		const styles: Record<string, string> = {
			Shortlisted: "bg-blue-500/20 text-blue-600 border-blue-500/30",
			New: "bg-gray-500/20 text-gray-600 border-gray-500/30",
			Rejected: "bg-red-500/20 text-red-600 border-red-500/30",
		};
		return styles[status] || styles["New"];
	};

	const getRoleFitBadge = (score: number) => {
		return score > 75
			? "bg-green-100 text-green-700 border border-green-300"
			: "bg-orange-100 text-orange-700 border border-orange-300";
	};

	const candidates = [
		{
			id: 1,
			name: "Alex Martinez",
			title: "Software Engineer at TechCorp",
			targetRole: "Senior Backend Engineer",
			experience: "7 yrs",
			topSkills: ["Python", "Postgres", "API"],
			rolefit: 85,
			confidence: 92,
			status: "Shortlisted",
		},
		{
			id: 2,
			name: "Emily Chen",
			title: "Product Manager at InnovateCo",
			targetRole: "Product Manager",
			experience: "5 yrs",
			topSkills: ["Product Strategy", "Agile", "User Research"],
			rolefit: 78,
			confidence: 68,
			status: "New",
		},
		{
			id: 3,
			name: "Marcus Johnson",
			title: "Frontend Developer at WebStudio",
			targetRole: "Frontend Developer",
			experience: "4 yrs",
			topSkills: ["React", "TypeScript", "CSS"],
			rolefit: 85,
			confidence: 75,
			status: "New",
		},
		{
			id: 4,
			name: "Sofia Rodriguez",
			title: "Senior Data Scientist at DataOps",
			targetRole: "Data Scientist",
			experience: "8 yrs",
			topSkills: ["Machine Learning", "Python", "SQL"],
			rolefit: 90,
			confidence: 88,
			status: "Shortlisted",
		},
		{
			id: 5,
			name: "David Kim",
			title: "Senior DevOps Engineer at CloudTech",
			targetRole: "DevOps Engineer",
			experience: "8 yrs",
			topSkills: ["AWS", "Kubernetes", "Automation"],
			rolefit: 92,
			confidence: 95,
			status: "Shortlisted",
		},
		{
			id: 6,
			name: "Rachel Adams",
			title: "UX Designer at DesignHub",
			targetRole: "UX Designer",
			experience: "3 yrs",
			topSkills: ["Figma", "User Research", "Prototyping"],
			rolefit: 72,
			confidence: 58,
			status: "Rejected",
		},
	];

	return (
		<ProtectedRoute>
			<Layout>
				<div className="p-8">
					<div className="max-w-7xl mx-auto">
						{/* Header */}
						<div className="mb-8">
							<h1 className="text-3xl font-bold text-black mb-2">
								Candidate Pipeline
							</h1>
							<p className="text-gray-400">
								Filter and manage your candidate pool
							</p>
						</div>

						{/* Search and Filters Section */}
						<div className="bg-[#fff] rounded-xl border border-gray-800 p-6 mb-6">
							{/* Search Bar */}
							<div className="relative mb-6">
								<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input
									type="text"
									placeholder="Search Candidates..."
									className="w-full bg-[#f6f6f6] border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
								/>
							</div>

							{/* Filters Row */}
							<div className="flex items-center justify-between mb-6">
								<button className="flex items-center gap-2 px-4 py-2 bg-f6f6f6 border border-gray-300 rounded-lg text-black hover:border-gray-600 transition-colors">
									<Filter className="w-4 h-4" />
									<span className="text-sm font-bold">
										Clear Filters
									</span>
								</button>
								<button className="flex items-center gap-2 px-4 py-2 bg-gray-500/10 border border-gray-500/30 rounded-lg text-black-400 hover:bg-cyan-500/20 transition-colors">
									<Download className="w-4 h-4" />
									<span className="text-sm">Export CSV</span>
								</button>
							</div>

							{/* Range Sliders */}
							<div className="grid grid-cols-2 gap-8">
								{/* Experience Range */}
								<div>
									<label className="text-sm text-gray-400 mb-3 block">
										Experience Range: 0 - 10 years
									</label>
									<input
										type="range"
										min="0"
										max="10"
										value={experienceRange[0]}
										onChange={(e) =>
											setExperienceRange([
												0,
												parseInt(e.target.value),
											])
										}
										className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-500"
									/>
								</div>

								{/* Minimum Role Fit Score */}
								<div>
									<label className="text-sm text-gray-400 mb-3 block">
										Minimum Role Fit Score: 0 %
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

						{/* Candidates Table */}
						<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b border-gray-200 bg-gray-50">
											<th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
												Candidate Name
											</th>
											<th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
												Target Role
											</th>
											<th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
												Experience
											</th>
											<th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
												Top Skills
											</th>
											<th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
												Role Fit
											</th>
											<th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
												Confidence
											</th>
											<th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
												Status
											</th>
											<th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{candidates.map((candidate) => (
											<tr
												key={candidate.id}
												className="hover:bg-gray-50 transition-colors"
											>
												<td className="py-4 px-6">
													<div>
														<p className="text-gray-900 font-medium">
															{candidate.name}
														</p>
														<p className="text-sm text-gray-500">
															{candidate.title}
														</p>
													</div>
												</td>
												<td className="py-4 px-6">
													<p className="text-gray-700">
														{candidate.targetRole}
													</p>
												</td>
												<td className="py-4 px-6">
													<p className="text-gray-700">
														{candidate.experience}
													</p>
												</td>
												<td className="py-4 px-6">
													<div className="flex flex-wrap gap-1">
														{candidate.topSkills.map(
															(skill, idx) => (
																<span
																	key={idx}
																	className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
																>
																	{skill}
																</span>
															)
														)}
													</div>
												</td>
												<td className="py-4 px-6">
													<span
														className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleFitBadge(candidate.rolefit)}`}
													>
														{candidate.rolefit}
													</span>
												</td>
												<td className="py-4 px-6">
													<span className="text-gray-700">
														{candidate.confidence}%
													</span>
												</td>
												<td className="py-4 px-6">
													<span
														className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(candidate.status)}`}
													>
														{candidate.status}
													</span>
												</td>
												<td className="py-4 px-6">
													<div className="flex items-center gap-2">
														<button
															onClick={() =>
																(window.location.href = `/candidates/${candidate.id}`)
															}
															className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
														>
															<Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
														</button>
														<button className="p-2 hover:bg-gray-100 rounded-lg transition-colors group">
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
					</div>
				</div>
			</Layout>
		</ProtectedRoute>
	);
};

export default CandidatesPage;
