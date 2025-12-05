import { HttpException, HttpStatus } from '@nestjs/common';

// Custom exception for RapidAPI service failures
export class RapidApiException extends HttpException {
  constructor(message: string, statusCode?: number) {
    super(
      {
        error: 'RapidAPI Service Error',
        message,
        statusCode: statusCode || HttpStatus.SERVICE_UNAVAILABLE,
      },
      statusCode || HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

// Exception for rate limit exceeded
export class RateLimitExceededException extends HttpException {
  constructor(resetTime?: string) {
    const message = resetTime 
      ? `Rate limit exceeded. Try again after ${resetTime}` 
      : 'Rate limit exceeded. Please try again later';
    
    super(
      {
        error: 'Rate Limit Exceeded',
        message,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

// Exception for invalid LinkedIn URLs
export class InvalidLinkedInUrlException extends HttpException {
  constructor(url: string) {
    super(
      {
        error: 'Invalid LinkedIn URL',
        message: `The provided URL is not a valid LinkedIn profile: ${url}`,
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

// Exception for profile not found
export class ProfileNotFoundException extends HttpException {
  constructor(url: string) {
    super(
      {
        error: 'Profile Not Found',
        message: `LinkedIn profile not found or not accessible: ${url}`,
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}