import { IsNumber, IsString, Min, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, Validate, registerDecorator, ValidationOptions, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CURRENCY_ENUM } from '../entities/job-posting.entity';

@ValidatorConstraint({ name: 'MinLessThanOrEqualMax', async: false })
export class MinLessThanOrEqualMaxConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as SalaryDto;
    return object.min <= object.max;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Minimum salary must be less than or equal to maximum salary';
  }
}

function MinLessThanOrEqualMax(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: MinLessThanOrEqualMaxConstraint,
    });
  };
}

export class SalaryDto {
  @ApiProperty({
    description: 'Minimum salary amount',
    example: 120000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  min: number;

  @ApiProperty({
    description: 'Maximum salary amount (must be >= min)',
    example: 180000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @MinLessThanOrEqualMax()
  max: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'USD',
    enum: CURRENCY_ENUM,
  })
  @IsString()
  @IsIn(CURRENCY_ENUM)
  currency: string;
}
