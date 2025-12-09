import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY = 'throttle';

export const Throttle = (limit: number, ttl: number) =>
  SetMetadata(THROTTLE_KEY, { limit, ttl });
