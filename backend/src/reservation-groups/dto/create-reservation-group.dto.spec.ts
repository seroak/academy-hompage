import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateReservationGroupDto } from './create-reservation-group.dto.js';

describe('CreateReservationGroupDto', () => {
  function makeDto(overrides: Record<string, unknown> = {}) {
    return plainToInstance(CreateReservationGroupDto, {
      label: '빈 수업',
      capacity: 4,
      slots: [],
      ...overrides,
    });
  }

  it('일정 없이 생성하는 기존 그룹은 유효하다', async () => {
    expect(await validate(makeDto())).toHaveLength(0);
  });

  it('요일·시작·종료 시각이 모두 있는 일정은 유효하다', async () => {
    expect(
      await validate(
        makeDto({
          scheduleDayOfWeek: 'MON',
          scheduleStartMinute: 780,
          scheduleEndMinute: 840,
        }),
      ),
    ).toHaveLength(0);
  });

  it('일정 필드 일부만 있으면 실패한다', async () => {
    const errors = await validate(makeDto({ scheduleDayOfWeek: 'MON' }));
    expect(
      errors.some((error) => error.property === 'scheduleStartMinute'),
    ).toBe(true);
  });

  it('10분 단위가 아닌 일정 시각은 실패한다', async () => {
    const errors = await validate(
      makeDto({
        scheduleDayOfWeek: 'MON',
        scheduleStartMinute: 785,
        scheduleEndMinute: 840,
      }),
    );
    expect(
      errors.some((error) => error.property === 'scheduleStartMinute'),
    ).toBe(true);
  });

  it('종료 시각이 시작 시각 이하인 일정은 실패한다', async () => {
    const errors = await validate(
      makeDto({
        scheduleDayOfWeek: 'MON',
        scheduleStartMinute: 840,
        scheduleEndMinute: 840,
      }),
    );
    expect(errors.some((error) => error.property === 'scheduleEndMinute')).toBe(
      true,
    );
  });
});
