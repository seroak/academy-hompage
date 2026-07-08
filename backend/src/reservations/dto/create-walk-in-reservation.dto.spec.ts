import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateWalkInReservationDto } from './create-walk-in-reservation.dto';

describe('CreateWalkInReservationDto', () => {
  function makeDto(overrides: Record<string, unknown> = {}) {
    return plainToInstance(CreateWalkInReservationDto, {
      childName: '민준',
      childAge: 5,
      parentName: '김엄마',
      preferredSlots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 790 }],
      ...overrides,
    });
  }

  it('이메일 없이도 유효하다', async () => {
    const errors = await validate(makeDto());
    expect(errors).toHaveLength(0);
  });

  it('유효한 이메일과 전화번호를 포함해도 통과한다', async () => {
    const errors = await validate(
      makeDto({ parentEmail: 'parent@example.com', parentPhone: '010-0000-0000' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('이메일 형식이 올바르지 않으면 실패한다', async () => {
    const errors = await validate(makeDto({ parentEmail: 'not-an-email' }));
    expect(errors.some((error) => error.property === 'parentEmail')).toBe(true);
  });

  it('아이 이름이 없으면 실패한다', async () => {
    const errors = await validate(makeDto({ childName: undefined }));
    expect(errors.some((error) => error.property === 'childName')).toBe(true);
  });

  it('희망 시간이 비어 있으면 실패한다', async () => {
    const errors = await validate(makeDto({ preferredSlots: [] }));
    expect(errors.some((error) => error.property === 'preferredSlots')).toBe(true);
  });
});
