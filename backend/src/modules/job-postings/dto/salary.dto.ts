import { IsNumber, IsString, Min, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, Validate } from 'class-validator';

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

const MinLessThanOrEqualMax = () => Validate(MinLessThanOrEqualMaxConstraint);

@MinLessThanOrEqualMax()
export class SalaryDto {
  @IsNumber()
  @Min(0)
  min: number;

  @IsNumber()
  @Min(0)
  max: number;

  @IsString()
  currency: string;
}
