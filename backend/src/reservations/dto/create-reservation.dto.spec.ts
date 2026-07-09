import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PreferredSlotDto } from './create-reservation.dto';

describe('PreferredSlotDto', () => {
  function makeSlot(overrides: Partial<{ dayOfWeek: string; startMinute: number; endMinute: number }> = {}) {
    return plainToInstance(PreferredSlotDto, {
      dayOfWeek: 'MON',
      startMinute: 780,
      endMinute: 850,
      ...overrides,
    });
  }

  it('유효한 10분 단위 범위는 통과한다', async () => {
    const errors = await validate(makeSlot());
    expect(errors).toHaveLength(0);
  });

  it('시작 시각이 10분 단위가 아니면 실패한다', async () => {
    const errors = await validate(makeSlot({ startMinute: 785 }));
    expect(errors.some((error) => error.property === 'startMinute')).toBe(true);
  });

  it('종료 시각이 시작 시각 이하이면 실패한다', async () => {
    const errors = await validate(makeSlot({ startMinute: 780, endMinute: 780 }));
    expect(errors.some((error) => error.property === 'endMinute')).toBe(true);
  });

  it('10분짜리 짧은 범위도 통과한다', async () => {
    const errors = await validate(makeSlot({ startMinute: 780, endMinute: 790 }));
    expect(errors).toHaveLength(0);
  });

  it('운영 시간(13:00~20:00)보다 이른 시작 시각은 실패한다', async () => {
    const errors = await validate(makeSlot({ startMinute: 760, endMinute: 820 }));
    expect(errors.some((error) => error.property === 'startMinute')).toBe(true);
  });

  it('운영 시간(13:00~20:00)보다 늦은 종료 시각은 실패한다', async () => {
    const errors = await validate(makeSlot({ startMinute: 1100, endMinute: 1210 }));
    expect(errors.some((error) => error.property === 'endMinute')).toBe(true);
  });
});
