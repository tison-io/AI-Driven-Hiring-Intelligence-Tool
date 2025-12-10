import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ErrorLogsService } from './error-logs.service';
import { ErrorLogFilterDto } from './dto/error-log-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('admin/error-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ErrorLogsController {
  constructor(private readonly errorLogsService: ErrorLogsService) {}

  @Get()
  async findAll(@Query() filterDto: ErrorLogFilterDto) {
    return this.errorLogsService.findAll(filterDto);
  }


}