import { Injectable, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { LinkedInProfileData } from '../interfaces/linkedin-response.interface';
import { LinkedInPublicDataDto, PublicExperienceDto, PublicEducationDto, PublicSkillDto } from '../dto/linkedin-public-data.dto';

@Injectable()
export class LinkedInMapper {
  private readonly logger = new Logger(LinkedInMapper.name);

  async transformToPublicData(profileData: LinkedInProfileData): Promise<LinkedInPublicDataDto | null> {
    try {
      if (!profileData.fullName) {
        this.logger.warn('Profile missing required fullName field');
        return null;
      }

      const publicData = {
        fullName: profileData.fullName,
        headline: profileData.headline || '',
        location: profileData.location || '',
        experiences: this.mapExperiences(profileData.experiences || []),
        educations: this.mapEducations(profileData.educations || []),
        skills: this.mapSkills(profileData.skills || [])
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

  async transformMultipleProfiles(profiles: LinkedInProfileData[]): Promise<LinkedInPublicDataDto[]> {
    const results = await Promise.all(
      profiles.map(profile => this.transformToPublicData(profile))
    );
    
    return results.filter(result => result !== null);
  }

  private mapExperiences(experiences: any[]): PublicExperienceDto[] {
    return experiences
      .filter(exp => exp.title && exp.company)
      .map(exp => ({
        title: exp.title,
        company: exp.company,
        location: exp.location || undefined,
        startDate: exp.startDate || undefined,
        endDate: exp.endDate || undefined,
        description: exp.description || undefined
      }));
  }

  private mapEducations(educations: any[]): PublicEducationDto[] {
    return educations
      .filter(edu => edu.schoolName)
      .map(edu => ({
        schoolName: edu.schoolName,
        degree: edu.degree || undefined,
        fieldOfStudy: edu.fieldOfStudy || undefined,
        startDate: edu.startDate || undefined,
        endDate: edu.endDate || undefined
      }));
  }

  private mapSkills(skills: any[]): PublicSkillDto[] {
    return skills
      .filter(skill => skill.name)
      .map(skill => ({
        name: skill.name
      }));
  }
}