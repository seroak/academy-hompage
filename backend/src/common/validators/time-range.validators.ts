import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export const OPERATING_START_MINUTE = 780; // 13:00
export const OPERATING_END_MINUTE = 1200; // 20:00
export const SLOT_STEP_MINUTES = 10;

@ValidatorConstraint({ name: 'isMultipleOfSlotStep', async: false })
class IsMultipleOfSlotStepConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'number' && value % SLOT_STEP_MINUTES === 0;
  }

  defaultMessage(): string {
    return `시간은 ${SLOT_STEP_MINUTES}분 단위로 입력해 주세요`;
  }
}

export function IsMultipleOfSlotStep(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsMultipleOfSlotStepConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isValidSlotEndMinute', async: false })
class IsValidSlotEndMinuteConstraint implements ValidatorConstraintInterface {
  validate(endMinute: unknown, args: ValidationArguments): boolean {
    const object = args.object as {
      startMinute?: unknown;
      scheduleStartMinute?: unknown;
    };
    const startMinute = object.startMinute ?? object.scheduleStartMinute;
    if (typeof endMinute !== 'number' || typeof startMinute !== 'number') {
      return false;
    }
    return endMinute > startMinute;
  }

  defaultMessage(): string {
    return `종료 시각은 시작 시각보다 이후여야 합니다`;
  }
}

export function IsValidSlotEndMinute(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsValidSlotEndMinuteConstraint,
    });
  };
}
