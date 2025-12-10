"use client";

import { useParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import CandidateDetail from "@/components/candidates/CandidateDetail";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useCandidateDetail } from "@/hooks/useCandidateDetail";

export default function CandidateDetailPage() {
	const params = useParams();
	const id = params.id as string;
	const { candidate, isLoading, error } = useCandidateDetail(id);

	if (isLoading) {
		return (
			<ProtectedRoute>
				<Layout>
					<div className="min-h-screen bg-[#0a0f1a] p-4 md:p-8 flex items-center justify-center">
						<div className="text-white text-lg md:text-xl">Loading candidate details...</div>
					</div>
				</Layout>
			</ProtectedRoute>
		);
	}

	if (error || !candidate) {
		return (
			<ProtectedRoute>
				<Layout>
					<div className="min-h-screen bg-[#0a0f1a] p-4 md:p-8 flex items-center justify-center">
						<div className="text-center">
							<h2 className="text-red-400 text-xl md:text-2xl mb-4">Error Loading Candidate</h2>
							<p className="text-gray-400 text-sm md:text-base">{error || "Candidate not found"}</p>
							<button
								onClick={() => (window.location.href = "/candidates")}
								className="mt-4 px-4 md:px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 text-sm md:text-base"
							>
								Back to Candidates
							</button>
						</div>
					</div>
				</Layout>
			</ProtectedRoute>
		);
	}

	const transformedCandidate = {
		name: candidate.name,
		title: candidate.jobRole || "Candidate",
		linkedinUrl: candidate.linkedinUrl,
		roleFitScore: candidate.roleFitScore || 0,
		confidenceScore: candidate.confidenceScore || 0,
		biasCheck: candidate.biasCheck || "Pending",
		experience: candidate.workExperience || [],
		education: candidate.education?.[0] || { degree: "N/A", school: "N/A", year: "N/A" },
		keyStrengths: candidate.keyStrengths || [],
		potentialGaps: candidate.potentialWeaknesses || [],
		missingSkills: candidate.missingSkills || [],
		interviewQuestions: candidate.interviewQuestions || [],
		isShortlisted: candidate.isShortlisted || false,
	};

	return (
		<ProtectedRoute>
			<Layout>
				<CandidateDetail candidate={transformedCandidate} candidateId={id} />
			</Layout>
		</ProtectedRoute>
	);
}
