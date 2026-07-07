import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PreferredSlotDto } from './create-reservation.dto';

describe('PreferredSlotDto', () => {
  function makeSlot(overrides: Partial<{ dayOfWeek: string; startMinute: number; endMinute: number }> = {}) {
    return plainToInstance(PreferredSlotDto, {
      dayOfWeek: 'MON',
      startMinute: 720,
      endMinute: 790,
      ...overrides,
    });
  }

  it('유효한 10분 단위 범위는 통과한다', async () => {
    const errors = await validate(makeSlot());
    expect(errors).toHaveLength(0);
  });

  it('시작 시각이 10분 단위가 아니면 실패한다', async () => {
    const errors = await validate(makeSlot({ startMinute: 725 }));
    expect(errors.some((error) => error.property === 'startMinute')).toBe(true);
  });

  it('종료 시각이 시작 시각보다 30분 이상 이후가 아니면 실패한다', async () => {
    const errors = await validate(makeSlot({ startMinute: 720, endMinute: 740 }));
    expect(errors.some((error) => error.property === 'endMinute')).toBe(true);
  });

  it('운영 시간(12:00~18:00)보다 이른 시작 시각은 실패한다', async () => {
    const errors = await validate(makeSlot({ startMinute: 700, endMinute: 760 }));
    expect(errors.some((error) => error.property === 'startMinute')).toBe(true);
  });

  it('운영 시간(12:00~18:00)보다 늦은 종료 시각은 실패한다', async () => {
    const errors = await validate(makeSlot({ startMinute: 1050, endMinute: 1100 }));
    expect(errors.some((error) => error.property === 'endMinute')).toBe(true);
  });
});
