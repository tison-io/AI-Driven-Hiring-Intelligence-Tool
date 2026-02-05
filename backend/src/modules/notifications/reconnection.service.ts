import { Injectable, Logger } from '@nestjs/common';
import { RedisConnectionService } from './redis-connection.service';

export interface ReconnectionConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface ReconnectionState {
  userId: string;
  attempts: number;
  lastAttempt: Date;
  nextRetryAt: Date;
  isReconnecting: boolean;
}

@Injectable()
export class ReconnectionService {
  private readonly logger = new Logger(ReconnectionService.name);
  private readonly defaultConfig: ReconnectionConfig = {
    maxRetries: 5,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
  };

  private reconnectionStates = new Map<string, ReconnectionState>();

  constructor(private readonly redisConnectionService: RedisConnectionService) {}

  // Calculate next retry delay with exponential backoff
  calculateRetryDelay(attempt: number, config: ReconnectionConfig = this.defaultConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  // Start reconnection process for a user
  async startReconnection(userId: string, config: ReconnectionConfig = this.defaultConfig): Promise<void> {
    if (this.reconnectionStates.has(userId)) {
      this.logger.warn(`Reconnection already in progress for user ${userId}`);
      return;
    }

    const state: ReconnectionState = {
      userId,
      attempts: 0,
      lastAttempt: new Date(),
      nextRetryAt: new Date(),
      isReconnecting: true,
    };

    this.reconnectionStates.set(userId, state);
    this.logger.log(`Started reconnection process for user ${userId}`);

    await this.scheduleNextRetry(userId, config);
  }

  // Schedule next retry attempt
  private async scheduleNextRetry(userId: string, config: ReconnectionConfig): Promise<void> {
    const state = this.reconnectionStates.get(userId);
    if (!state || !state.isReconnecting) return;

    state.attempts++;
    
    if (state.attempts > config.maxRetries) {
      this.logger.warn(`Max reconnection attempts reached for user ${userId}`);
      await this.stopReconnection(userId);
      return;
    }

    const delay = this.calculateRetryDelay(state.attempts, config);
    state.nextRetryAt = new Date(Date.now() + delay);
    
    this.logger.debug(`Scheduling retry ${state.attempts}/${config.maxRetries} for user ${userId} in ${delay}ms`);

    setTimeout(async () => {
      await this.attemptReconnection(userId, config);
    }, delay);
  }

  // Attempt reconnection
  private async attemptReconnection(userId: string, config: ReconnectionConfig): Promise<void> {
    const state = this.reconnectionStates.get(userId);
    if (!state || !state.isReconnecting) return;

    state.lastAttempt = new Date();
    
    try {
      // Check if user is already connected
      const isConnected = await this.redisConnectionService.isUserConnected(userId);
      
      if (isConnected) {
        this.logger.log(`User ${userId} reconnected successfully`);
        await this.stopReconnection(userId);
        return;
      }

      // If not connected, schedule next retry
      await this.scheduleNextRetry(userId, config);
      
    } catch (error) {
      this.logger.error(`Reconnection attempt failed for user ${userId}: ${error.message}`);
      await this.scheduleNextRetry(userId, config);
    }
  }

  // Stop reconnection process
  async stopReconnection(userId: string): Promise<void> {
    const state = this.reconnectionStates.get(userId);
    if (state) {
      state.isReconnecting = false;
      this.reconnectionStates.delete(userId);
      this.logger.log(`Stopped reconnection process for user ${userId}`);
    }
  }

  // Get reconnection state
  getReconnectionState(userId: string): ReconnectionState | null {
    return this.reconnectionStates.get(userId) || null;
  }

  // Get all active reconnections
  getActiveReconnections(): ReconnectionState[] {
    return Array.from(this.reconnectionStates.values());
  }

  // Check if user is in reconnection process
  isReconnecting(userId: string): boolean {
    const state = this.reconnectionStates.get(userId);
    return state?.isReconnecting || false;
  }

  // Get reconnection statistics
  getReconnectionStats(): {
    activeReconnections: number;
    totalAttempts: number;
    averageAttempts: number;
  } {
    const states = Array.from(this.reconnectionStates.values());
    const totalAttempts = states.reduce((sum, state) => sum + state.attempts, 0);
    
    return {
      activeReconnections: states.length,
      totalAttempts,
      averageAttempts: states.length > 0 ? totalAttempts / states.length : 0,
    };
  }
}