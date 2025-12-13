export interface RapidApiResponse {
  success: boolean;
  message?: string;
  data?: RapidApiProfileData;
}

export interface RapidApiProfileData {
  firstName?: string;
  lastName?: string;
  headline?: string;
  summary?: string;
  profilePicture?: string;
  geo?: { full?: string };
  position?: RawExperience[];
  fullPositions?: RawExperience[];
  educations?: RawEducation[];
  skills?: RawSkill[];
  languages?: any[];
  certifications?: any[];
  basic_info?: {
    fullname?: string;
    headline?: string;
    location?: { full?: string };
    top_skills?: RawSkill[];
  };
  fullName?: string;
  location?: string;
  experience?: RawExperience[];
  experiences?: RawExperience[];
  education?: RawEducation[];
}

export interface RawExperience {
  title?: string;
  company?: string;
  location?: string;
  start_date?: { month?: string; year?: string };
  end_date?: { month?: string; year?: string };
  startDate?: string;
  endDate?: string;
  is_current?: boolean;
  description?: string;
}

export interface RawEducation {
  school?: string;
  schoolName?: string;
  degree_name?: string;
  degree?: string;
  field_of_study?: string;
  fieldOfStudy?: string;
  start_date?: { year?: number };
  end_date?: { year?: number };
  startDate?: string;
  endDate?: string;
}

export interface RawSkill {
  name?: string;
}
