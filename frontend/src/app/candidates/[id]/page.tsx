"use client";

import { useParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import CandidateDetail from "@/components/candidates/CandidateDetail";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function CandidateDetailPage() {
	const params = useParams();
	const id = params.id;

	// Mock data - TODO: Replace with API call
	const candidate = {
		name: "Alex Martinez",
		title: "Backend Engineer at TechCorp",
		linkedinUrl: "https://linkedin.com/in/alexmartinez",
		roleFitScore: 87,
		confidenceScore: 92,
		biasCheck: "Pass",
		experience: [
			{
				title: "Senior Backend Engineer",
				company: "TechCorp",
				period: "2021 - Present",
				description:
					"Led backend development for microservices platform serving 10M+ users",
			},
			{
				title: "Backend Engineer",
				company: "StartupX",
				period: "2018 - 2021",
				description:
					"Built RESTful APIs and implemented CI/CD pipelines",
			},
			{
				title: "Junior Developer",
				company: "DevConsulting",
				period: "2016 - 2018",
				description:
					"Full-stack development for various client projects",
			},
		],
		education: {
			degree: "BS Computer Science",
			school: "MIT",
			year: "2016",
		},
		keyStrengths: [
			"Extensive experience with Django and microservices architecture",
			"Strong DevOps background with Kubernetes and Docker",
			"Led team of 5 engineers in previous role",
			"Excellent problem-solving and system design skills",
		],
		potentialGaps: [
			"Limited experience with Go (mentioned in JD)",
			"No direct experience with our tech stack (FastAPI)",
			"Gap in cloud certifications",
		],
		missingSkills: ["Go", "React", "GraphQL"],
		interviewQuestions: [
			"Can you describe your experience designing and implementing microservices architecture at scale?",
			"How would you approach migrating a monolithic application to microservices?",
			"Tell me about a time when you had to optimize database performance for a high-traffic application.",
			"How do you ensure code quality and maintainability in a fast-paced environment?",
			"What strategies do you use for debugging issues in distributed systems?",
		],
	};

	return (
		<ProtectedRoute>
			<Layout>
				<CandidateDetail candidate={candidate} />
			</Layout>
		</ProtectedRoute>
	);
}
