export interface LinkedInProfileData {
  url: string;
  fullName: string;
  firstName: string;
  lastName: string;
  headline: string;
  location: string;
  photoUrl: string;
  description: string;
  followerCount: number;
  connectionCount: number;
  mutualConnectionsCount: number;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
  languages: Language[];
  certifications: Certification[];
}

export interface Experience {
  title: string;
  company: string;
  companyUrl: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  duration: string;
}

export interface Education {
  schoolName: string;
  schoolUrl: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Skill {
  name: string;
  endorsementCount: number;
}

export interface Language {
  name: string;
  proficiency: string;
}

export interface Certification {
  name: string;
  authority: string;
  url: string;
  startDate: string;
  endDate: string;
}

export interface ApifyLinkedInRequest {
  profileUrls: string[];
  proxyConfiguration?: {
    useApifyProxy: boolean;
  };
}

export interface ApifyLinkedInResponse {
  data: LinkedInProfileData[];
  success: boolean;
  error?: string;
}