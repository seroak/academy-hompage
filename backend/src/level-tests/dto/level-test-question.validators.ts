import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidCorrectChoiceIndex', async: false })
class IsValidCorrectChoiceIndexConstraint implements ValidatorConstraintInterface {
  validate(correctChoiceIndex: unknown, args: ValidationArguments): boolean {
    const object = args.object as { choices?: unknown };
    const choices = Array.isArray(object.choices) ? object.choices : [];
    return typeof correctChoiceIndex === 'number' && correctChoiceIndex < choices.length;
  }

  defaultMessage(): string {
    return '정답 인덱스는 보기 범위 안에 있어야 합니다';
  }
}

export function IsValidCorrectChoiceIndex(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsValidCorrectChoiceIndexConstraint,
    });
  };
}
