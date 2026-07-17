import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isMetaUtmId', async: false })
class IsMetaUtmIdConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const object = args.object as { utmSource?: unknown };
    if (object.utmSource !== 'meta') return true;
    return typeof value === 'string' && /^\d+$/.test(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `utm_source가 meta일 때 ${args.property}는 캠페인/광고의 숫자 ID여야 합니다 ({{campaign.id}}/{{ad.id}} 형식)`;
  }
}

export function IsMetaUtmId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsMetaUtmIdConstraint,
    });
  };
}
