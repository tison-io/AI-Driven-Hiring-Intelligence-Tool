import { Injectable, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { LinkedInProfileData } from '../interfaces/linkedin-response.interface';
import { LinkedInPublicDataDto, PublicExperienceDto, PublicEducationDto, PublicSkillDto } from '../dto/linkedin-public-data.dto';
import { RapidApiProfileData, RawExperience, RawEducation, RawSkill } from '../interfaces/linkedin-raw-api.interface';

@Injectable()
export class LinkedInMapper {
  private readonly logger = new Logger(LinkedInMapper.name);

  async transformToPublicData(profileData: RapidApiProfileData): Promise<LinkedInPublicDataDto | null> {
    try {
      const fullName = profileData.basic_info?.fullname || profileData.fullName;
      if (!fullName) {
        this.logger.warn('Profile missing required fullName field');
        return null;
      }

      const publicData = {
        fullName,
        headline: profileData.basic_info?.headline || profileData.headline || '',
        location: profileData.basic_info?.location?.full || profileData.location || '',
        experiences: this.mapExperiences(profileData.experience || profileData.experiences || []),
        educations: this.mapEducations(profileData.education || profileData.educations || []),
        skills: this.mapSkills(profileData.basic_info?.top_skills || profileData.skills || [])
      };

      const dto = plainToClass(LinkedInPublicDataDto, publicData);
      const errors = await validate(dto);

      if (errors.length > 0) {
        this.logger.error('Validation failed for LinkedIn data', errors);
        return null;
      }

      return dto;
    } catch (error) {
      this.logger.error('Failed to transform LinkedIn data', error.stack);
      return null;
    }
  }

  async transformMultipleProfiles(profiles: RapidApiProfileData[]): Promise<LinkedInPublicDataDto[]> {
    const results = await Promise.all(
      profiles.map(profile => this.transformToPublicData(profile))
    );
    
    return results.filter(result => result !== null);
  }

  private mapExperiences(experiences: RawExperience[]): PublicExperienceDto[] {
    return experiences
      .filter(exp => exp.title && exp.company)
      .map(exp => ({
        title: exp.title,
        company: exp.company,
        location: exp.location || undefined,
        startDate: exp.start_date ? `${exp.start_date.month} ${exp.start_date.year}` : exp.startDate || undefined,
        endDate: exp.end_date ? `${exp.end_date.month} ${exp.end_date.year}` : (exp.is_current ? 'Present' : exp.endDate || undefined),
        description: exp.description || undefined
      }));
  }

  private mapEducations(educations: RawEducation[]): PublicEducationDto[] {
    return educations
      .filter(edu => edu.school || edu.schoolName)
      .map(edu => ({
        schoolName: edu.school || edu.schoolName,
        degree: edu.degree_name || edu.degree || undefined,
        fieldOfStudy: edu.field_of_study || edu.fieldOfStudy || undefined,
        startDate: edu.start_date?.year ? edu.start_date.year.toString() : edu.startDate || undefined,
        endDate: edu.end_date?.year ? edu.end_date.year.toString() : edu.endDate || undefined
      }));
  }

  private mapSkills(skills: (RawSkill | string)[]): PublicSkillDto[] {
    if (!Array.isArray(skills)) return [];
    return skills
      .filter(skill => typeof skill === 'string' || skill.name)
      .map(skill => ({
        name: typeof skill === 'string' ? skill : skill.name
      }));
  }
}