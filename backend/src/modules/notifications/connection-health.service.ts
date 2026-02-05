import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisConnectionService } from './redis-connection.service';
import { ConnectionStateService } from './connection-state.service';

export interface HealthMetrics {
  timestamp: Date;
  totalConnections: number;
  uniqueUsers: number;
  connectionsByRole: Record<string, number>;
  averageConnectionAge: number;
  reconnectionRate: number;
  errorRate: number;
}

export interface ConnectionHealth {
  status: 'healthy' | 'warning' | 'critical';
  metrics: HealthMetrics;
  issues: string[];
  recommendations: string[];
}

@Injectable()
export class ConnectionHealthService {
  private readonly logger = new Logger(ConnectionHealthService.name);
  private healthHistory: HealthMetrics[] = [];
  private readonly maxHistorySize = 100;
  
  // Health thresholds
  private readonly thresholds = {
    maxConnections: 1000,
    maxReconnectionRate: 0.1, // 10%
    maxErrorRate: 0.05, // 5%
    minConnectionAge: 60000, // 1 minute
  };

  constructor(
    private readonly redisConnectionService: RedisConnectionService,
    private readonly connectionStateService: ConnectionStateService,
  ) {}

  // Collect health metrics
  async collectHealthMetrics(): Promise<HealthMetrics> {
    try {
      const connectionStats = await this.redisConnectionService.getConnectionStats();
      const connectionHealth = await this.connectionStateService.getConnectionHealth();
      
      const metrics: HealthMetrics = {
        timestamp: new Date(),
        totalConnections: connectionStats.totalConnections,
        uniqueUsers: connectionStats.uniqueUsers,
        connectionsByRole: connectionStats.connectionsByRole,
        averageConnectionAge: connectionHealth.averageRoomAge,
        reconnectionRate: await this.calculateReconnectionRate(),
        errorRate: await this.calculateErrorRate(),
      };

      // Store in history
      this.healthHistory.push(metrics);
      if (this.healthHistory.length > this.maxHistorySize) {
        this.healthHistory.shift();
      }

      return metrics;
    } catch (error) {
      this.logger.error(`Error collecting health metrics: ${error.message}`);
      throw error;
    }
  }

  // Get current connection health status
  async getConnectionHealth(): Promise<ConnectionHealth> {
    const metrics = await this.collectHealthMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check connection count
    if (metrics.totalConnections > this.thresholds.maxConnections) {
      status = 'critical';
      issues.push(`High connection count: ${metrics.totalConnections}`);
      recommendations.push('Consider scaling WebSocket servers');
    } else if (metrics.totalConnections > this.thresholds.maxConnections * 0.8) {
      status = 'warning';
      issues.push(`Connection count approaching limit: ${metrics.totalConnections}`);
      recommendations.push('Monitor connection growth and prepare for scaling');
    }

    // Check reconnection rate
    if (metrics.reconnectionRate > this.thresholds.maxReconnectionRate) {
      if (status !== 'critical') status = 'warning';
      issues.push(`High reconnection rate: ${(metrics.reconnectionRate * 100).toFixed(2)}%`);
      recommendations.push('Investigate connection stability issues');
    }

    // Check error rate
    if (metrics.errorRate > this.thresholds.maxErrorRate) {
      status = 'critical';
      issues.push(`High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
      recommendations.push('Review error logs and fix connection issues');
    }

    // Check average connection age
    if (metrics.averageConnectionAge < this.thresholds.minConnectionAge) {
      if (status !== 'critical') status = 'warning';
      issues.push(`Low average connection age: ${Math.round(metrics.averageConnectionAge / 1000)}s`);
      recommendations.push('Investigate frequent disconnections');
    }

    return {
      status,
      metrics,
      issues,
      recommendations,
    };
  }

  // Get health history
  getHealthHistory(limit?: number): HealthMetrics[] {
    const history = [...this.healthHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  // Get health trends
  getHealthTrends(): {
    connectionTrend: 'increasing' | 'decreasing' | 'stable';
    errorTrend: 'increasing' | 'decreasing' | 'stable';
    reconnectionTrend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (this.healthHistory.length < 2) {
      return {
        connectionTrend: 'stable',
        errorTrend: 'stable',
        reconnectionTrend: 'stable',
      };
    }

    const recent = this.healthHistory.slice(-10);
    const older = this.healthHistory.slice(-20, -10);

    const avgRecentConnections = recent.reduce((sum, m) => sum + m.totalConnections, 0) / recent.length;
    const avgOlderConnections = older.length > 0 ? older.reduce((sum, m) => sum + m.totalConnections, 0) / older.length : avgRecentConnections;

    const avgRecentErrors = recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length;
    const avgOlderErrors = older.length > 0 ? older.reduce((sum, m) => sum + m.errorRate, 0) / older.length : avgRecentErrors;

    const avgRecentReconnections = recent.reduce((sum, m) => sum + m.reconnectionRate, 0) / recent.length;
    const avgOlderReconnections = older.length > 0 ? older.reduce((sum, m) => sum + m.reconnectionRate, 0) / older.length : avgRecentReconnections;

    return {
      connectionTrend: this.getTrend(avgRecentConnections, avgOlderConnections),
      errorTrend: this.getTrend(avgRecentErrors, avgOlderErrors),
      reconnectionTrend: this.getTrend(avgRecentReconnections, avgOlderReconnections),
    };
  }

  // Scheduled health check (every 5 minutes)
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledHealthCheck(): Promise<void> {
    try {
      const health = await this.getConnectionHealth();
      
      if (health.status === 'critical') {
        this.logger.error(`Critical connection health issues detected: ${health.issues.join(', ')}`);
      } else if (health.status === 'warning') {
        this.logger.warn(`Connection health warnings: ${health.issues.join(', ')}`);
      } else {
        this.logger.debug('Connection health check passed');
      }

      // Log metrics for monitoring
      this.logger.log(`Health metrics - Connections: ${health.metrics.totalConnections}, Users: ${health.metrics.uniqueUsers}, Error rate: ${(health.metrics.errorRate * 100).toFixed(2)}%`);
      
    } catch (error) {
      this.logger.error(`Scheduled health check failed: ${error.message}`);
    }
  }

  // Calculate reconnection rate (placeholder - would need actual reconnection tracking)
  private async calculateReconnectionRate(): Promise<number> {
    // This would typically track reconnection events over time
    // For now, return a mock value based on connection patterns
    try {
      const stats = await this.redisConnectionService.getConnectionStats();
      // Simple heuristic: if we have fewer unique users than total connections,
      // it might indicate reconnections
      if (stats.totalConnections === 0) return 0;
      const ratio = stats.uniqueUsers / stats.totalConnections;
      return Math.max(0, 1 - ratio) * 0.1; // Scale down for realistic values
    } catch {
      return 0;
    }
  }

  // Calculate error rate (placeholder - would need actual error tracking)
  private async calculateErrorRate(): Promise<number> {
    // This would typically track connection errors over time
    // For now, return a mock value
    return 0.01; // 1% error rate
  }

  // Helper to determine trend
  private getTrend(recent: number, older: number): 'increasing' | 'decreasing' | 'stable' {
    const threshold = 0.1; // 10% change threshold
    const change = (recent - older) / older;
    
    if (change > threshold) return 'increasing';
    if (change < -threshold) return 'decreasing';
    return 'stable';
  }

  // Get connection performance metrics
  async getPerformanceMetrics(): Promise<{
    averageLatency: number;
    messagesThroughput: number;
    connectionUptime: number;
    memoryUsage: number;
  }> {
    // These would be collected from actual performance monitoring
    // For now, return mock values
    return {
      averageLatency: 50, // ms
      messagesThroughput: 100, // messages/second
      connectionUptime: 0.99, // 99% uptime
      memoryUsage: 0.75, // 75% memory usage
    };
  }
}