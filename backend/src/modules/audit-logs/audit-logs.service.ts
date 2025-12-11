import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './entities/audit-log.entity';
import { AuditLogFilterDto } from './dto/audit-log-filter.dto';
import { PaginatedAuditLogsResponseDto } from './dto/audit-log-response.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async createLog(logData: {
    userOrSystem: string;
    action: string;
    target: string;
    details: string;
  }): Promise<AuditLog> {
    try {
      const auditLog = new this.auditLogModel(logData);
      return await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException('Failed to create audit log');
    }
  }

  async findAll(filterDto: AuditLogFilterDto): Promise<PaginatedAuditLogsResponseDto> {
    try {
      const { page = 1, limit = 10, startDate, endDate, userOrSystem, action, target } = filterDto;
      
      const filter: any = {};
      
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }
      
      if (userOrSystem) filter.userOrSystem = { $regex: userOrSystem, $options: 'i' };
      if (action) filter.action = { $regex: action, $options: 'i' };
      if (target) filter.target = { $regex: target, $options: 'i' };

      const skip = (page - 1) * limit;
      
      const [data, total] = await Promise.all([
        this.auditLogModel
          .find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.auditLogModel.countDocuments(filter).exec(),
      ]);

      return {
        data: data.map(log => ({
          id: log._id.toString(),
          timestamp: log.timestamp,
          userOrSystem: log.userOrSystem,
          action: log.action,
          target: log.target,
          details: log.details,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve audit logs');
    }
  }
}