export interface ExtractedCandidateData {
  candidate_name?: string;
  skills?: string[];
  total_years_experience?: number;
  work_experience?: WorkExperience[];
  education?: Education[];
  certifications?: string[];
  is_valid_resume?: boolean;
  error?: string;
}

export interface WorkExperience {
  company?: string;
  job_title?: string;
  jobTitle?: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  description?: string;
  technologies_used?: string[];
  technologies?: string[];
}

export interface Education {
  institution?: string;
  degree?: string;
  field_of_study?: string;
  graduation_year?: string;
}

export interface ScoringResult {
  role_fit_score?: number;
  confidence_score?: number;
  key_strengths?: Array<string | { strength: string }>;
  potential_weaknesses?: Array<string | { weakness: string }>;
  missing_skills?: string[];
  recommended_interview_questions?: string[];
  bias_check_flag?: BiasCheckFlag;
  scoring_breakdown?: {
    skill_match?: number;
    experience_relevance?: number;
    education_fit?: number;
    certifications?: number;
  };
}

export interface BiasCheckFlag {
  detected?: boolean;
  flags?: string[];
}
