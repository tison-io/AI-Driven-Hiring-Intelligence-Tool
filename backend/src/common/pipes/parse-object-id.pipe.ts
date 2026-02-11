import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform {
  transform(value: any): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid ObjectId format');
    }
    return value;
  }
}