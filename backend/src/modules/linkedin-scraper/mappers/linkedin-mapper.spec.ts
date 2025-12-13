import { Test, TestingModule } from '@nestjs/testing';
import { LinkedInMapper } from './linkedin-mapper';

describe('LinkedInMapper', () => {
  let mapper: LinkedInMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LinkedInMapper],
    }).compile();

    mapper = module.get<LinkedInMapper>(LinkedInMapper);
  });

  describe('transformToPublicData', () => {
    it('should transform complete profile data', async () => {
      const profileData = {
        fullName: 'John Doe',
        headline: 'Software Engineer',
        location: 'San Francisco, CA',
        experiences: [
          {
            title: 'Senior Developer',
            company: 'Tech Corp',
            startDate: '2020-01',
            endDate: '2023-12',
          },
        ],
        educations: [
          {
            schoolName: 'University of Tech',
            degree: 'Computer Science',
          },
        ],
        skills: [{ name: 'JavaScript' }],
      };

      const result = await mapper.transformToPublicData(profileData);

      expect(result).toMatchObject({
        fullName: 'John Doe',
        headline: 'Software Engineer',
        location: 'San Francisco, CA',
        experiences: [
          {
            title: 'Senior Developer',
            company: 'Tech Corp',
          },
        ],
        educations: [
          {
            schoolName: 'University of Tech',
            degree: 'Computer Science',
          },
        ],
        skills: [{ name: 'JavaScript' }],
      });
    });

    it('should return null for profile without fullName', async () => {
      const profileData = {
        headline: 'Software Engineer',
      };

      const result = await mapper.transformToPublicData(profileData);

      expect(result).toBeNull();
    });

    it('should handle empty arrays', async () => {
      const profileData = {
        fullName: 'Jane Doe',
        experiences: [],
        educations: [],
        skills: [],
      };

      const result = await mapper.transformToPublicData(profileData);

      expect(result.experiences).toEqual([]);
      expect(result.educations).toEqual([]);
      expect(result.skills).toEqual([]);
    });
  });

  describe('transformMultipleProfiles', () => {
    it('should transform multiple valid profiles', async () => {
      const profiles = [{ fullName: 'John Doe' }, { fullName: 'Jane Smith' }];

      const result = await mapper.transformMultipleProfiles(profiles);

      expect(result).toHaveLength(2);
      expect(result[0].fullName).toBe('John Doe');
      expect(result[1].fullName).toBe('Jane Smith');
    });

    it('should filter out invalid profiles', async () => {
      const profiles = [{ fullName: 'John Doe' }, { headline: 'No name' }];

      const result = await mapper.transformMultipleProfiles(profiles);

      expect(result).toHaveLength(1);
      expect(result[0].fullName).toBe('John Doe');
    });
  });
});
