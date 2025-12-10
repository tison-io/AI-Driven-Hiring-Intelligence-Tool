import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ErrorLog, ErrorLogDocument } from './entities/error-log.entity';
import { ErrorLogFilterDto } from './dto/error-log-filter.dto';
import { PaginatedErrorLogsResponseDto } from './dto/error-log-response.dto';

@Injectable()
export class ErrorLogsService {
  constructor(
    @InjectModel(ErrorLog.name) private errorLogModel: Model<ErrorLogDocument>,
  ) {}

  async createLog(logData: {
    userOrSystem: string;
    action: string;
    target: string;
    details: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
  }): Promise<ErrorLog> {
    try {
      const errorLog = new this.errorLogModel(logData);
      return await errorLog.save();
    } catch (error) {
      throw new InternalServerErrorException('Failed to create error log');
    }
  }

  async findAll(filterDto: ErrorLogFilterDto): Promise<PaginatedErrorLogsResponseDto> {
    const { page = 1, limit = 10, startDate, endDate, severity, userOrSystem, action } = filterDto;
    
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    if (severity) filter.severity = severity;
    if (userOrSystem) filter.userOrSystem = { $regex: userOrSystem, $options: 'i' };
    if (action) filter.action = { $regex: action, $options: 'i' };

    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.errorLogModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.errorLogModel.countDocuments(filter).exec(),
    ]);

    return {
      data: data.map(log => ({
        id: log._id.toString(),
        timestamp: log.timestamp,
        userOrSystem: log.userOrSystem,
        action: log.action,
        target: log.target,
        details: log.details,
        severity: log.severity,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ErrorLog> {
    try {
      const errorLog = await this.errorLogModel.findById(id).exec();
      if (!errorLog) {
        throw new NotFoundException(`Error log with ID ${id} not found`);
      }
      return errorLog;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve error log');
    }
  }

  async clearLogs(filterDto?: Partial<ErrorLogFilterDto>): Promise<{ deletedCount: number }> {
    try {
      const filter: any = {};
      
      if (filterDto?.startDate || filterDto?.endDate) {
        filter.timestamp = {};
        if (filterDto.startDate) filter.timestamp.$gte = new Date(filterDto.startDate);
        if (filterDto.endDate) filter.timestamp.$lte = new Date(filterDto.endDate);
      }
      
      if (filterDto?.severity) filter.severity = filterDto.severity;
      if (filterDto?.userOrSystem) filter.userOrSystem = { $regex: filterDto.userOrSystem, $options: 'i' };
      if (filterDto?.action) filter.action = { $regex: filterDto.action, $options: 'i' };

      const result = await this.errorLogModel.deleteMany(filter).exec();
      return { deletedCount: result.deletedCount };
    } catch (error) {
      throw new InternalServerErrorException('Failed to clear error logs');
    }
  }
}