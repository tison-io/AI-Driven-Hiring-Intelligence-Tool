import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform {
  transform(value: any): string {
    if (!isValidObjectId(value)) {
      throw new BadRequestException('Invalid ObjectId format');
    }
    return value;
  }
}