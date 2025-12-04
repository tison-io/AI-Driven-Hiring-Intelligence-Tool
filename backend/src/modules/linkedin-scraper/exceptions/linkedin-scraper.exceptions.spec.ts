import { HttpStatus } from '@nestjs/common';
import {
  RapidApiException,
  RateLimitExceededException,
  InvalidLinkedInUrlException,
  ProfileNotFoundException,
} from './linkedin-scraper.exceptions';

describe('LinkedIn Scraper Exceptions', () => {
  describe('RapidApiException', () => {
    it('should create exception with default status code', () => {
      const exception = new RapidApiException('API error');

      expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(exception.getResponse()).toMatchObject({
        error: 'RapidAPI Service Error',
        message: 'API error',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      });
    });

    it('should create exception with custom status code', () => {
      const exception = new RapidApiException('Custom error', HttpStatus.BAD_GATEWAY);

      expect(exception.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('RateLimitExceededException', () => {
    it('should create exception without reset time', () => {
      const exception = new RateLimitExceededException();

      expect(exception.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(exception.getResponse()).toMatchObject({
        error: 'Rate Limit Exceeded',
        message: 'Rate limit exceeded. Please try again later',
      });
    });

    it('should create exception with reset time', () => {
      const exception = new RateLimitExceededException('60 seconds');

      expect(exception.getResponse()).toMatchObject({
        message: 'Rate limit exceeded. Try again after 60 seconds',
      });
    });
  });

  describe('InvalidLinkedInUrlException', () => {
    it('should create exception with URL', () => {
      const url = 'https://facebook.com/user';
      const exception = new InvalidLinkedInUrlException(url);

      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.getResponse()).toMatchObject({
        error: 'Invalid LinkedIn URL',
        message: `The provided URL is not a valid LinkedIn profile: ${url}`,
      });
    });
  });

  describe('ProfileNotFoundException', () => {
    it('should create exception with URL', () => {
      const url = 'https://linkedin.com/in/notfound';
      const exception = new ProfileNotFoundException(url);

      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.getResponse()).toMatchObject({
        error: 'Profile Not Found',
        message: `LinkedIn profile not found or not accessible: ${url}`,
      });
    });
  });
});