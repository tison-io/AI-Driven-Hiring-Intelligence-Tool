"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { jobPostingsApi } from "@/lib/api";
import { JobLayout } from "@/components/job/JobLayout";
import { JobHeader } from "@/components/job/JobHeader";
import { JobRole } from "@/components/job/JobRole";
import { JobDescription } from "@/components/job/JobDescription";
import { Responsibilities } from "@/components/job/Responsibilities";
import { Requirements } from "@/components/job/Requirements";
import { SkillsPills } from "@/components/job/SkillsPills";
import { ApplyCard } from "@/components/apply/ApplyCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type JobData = {
  _id: string;
  title: string;
  description: string;
  responsibilities?: string[];
  requiredSkills?: string[];
  requirements?: string[];
  location: string;
  experienceLevel?: string;
  employmentType?: string;
  closingDate?: string;
  companyName?: string;
  companyLogo?: string;
  salary?: { min: number; max: number; currency: string };
  isActive: boolean;
};

export default function JobPage() {
  const params = useParams();
  const token = params.token as string;
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await jobPostingsApi.getByToken(token);
        setJob(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Job not found or inactive");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-secondary-700">Job Not Found</h1>
          <p className="mt-2 text-secondary-500">{error || "This job posting is no longer available"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <JobLayout
        left={
          <>
            <JobHeader 
              title={job.title}
              companyName={job.companyName || "Company"}
              companyLogo={job.companyLogo}
              location={job.location}
              employmentType={job.employmentType || "Full-time"}
              closingDate={job.closingDate}
              salary={job.salary}
            />
            <JobRole description={job.description} />
            {job.responsibilities && job.responsibilities.length > 0 && (
              <Responsibilities responsibilities={job.responsibilities} />
            )}
            {job.requirements && job.requirements.length > 0 && (
              <Requirements requirements={job.requirements} />
            )}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <SkillsPills skills={job.requiredSkills} />
            )}
          </>
        }
        right={<ApplyCard token={token} jobTitle={job.title} />}
      />
    </div>
  );
}
