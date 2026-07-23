import { ConflictException } from '@nestjs/common';
import { ReservationGroupsValidator } from './reservation-groups.validator.js';

describe('ReservationGroupsValidator.validateScheduleOverlap', () => {
  const validator = new ReservationGroupsValidator();

  it('다른 그룹의 슬롯과 겹치면 거부한다', () => {
    const otherGroups = [
      {
        id: 'g1',
        label: '기존 반',
        scheduleDayOfWeek: null,
        scheduleStartMinute: null,
        scheduleEndMinute: null,
        slots: [{ dayOfWeek: 'TUE', startMinute: 1010, endMinute: 1060 }],
      },
    ];

    expect(() =>
      validator.validateScheduleOverlap('TUE', 1050, 1120, otherGroups),
    ).toThrow(ConflictException);
    expect(() =>
      validator.validateScheduleOverlap('TUE', 1050, 1120, otherGroups),
    ).toThrow('기존 반');
  });

  it('다른 그룹의 schedule 필드(슬롯 없는 빈 그룹)와 겹치면 거부한다', () => {
    const otherGroups = [
      {
        id: 'g1',
        label: '빈 반',
        scheduleDayOfWeek: 'TUE',
        scheduleStartMinute: 1080,
        scheduleEndMinute: 1140,
        slots: [],
      },
    ];

    expect(() =>
      validator.validateScheduleOverlap('TUE', 1100, 1150, otherGroups),
    ).toThrow(ConflictException);
  });

  it('겹치지 않으면 통과한다', () => {
    const otherGroups = [
      {
        id: 'g1',
        label: '기존 반',
        scheduleDayOfWeek: null,
        scheduleStartMinute: null,
        scheduleEndMinute: null,
        slots: [{ dayOfWeek: 'TUE', startMinute: 900, endMinute: 950 }],
      },
    ];

    expect(() =>
      validator.validateScheduleOverlap('TUE', 950, 1000, otherGroups),
    ).not.toThrow();
  });

  it('다른 요일이면 겹치지 않는다', () => {
    const otherGroups = [
      {
        id: 'g1',
        label: '기존 반',
        scheduleDayOfWeek: null,
        scheduleStartMinute: null,
        scheduleEndMinute: null,
        slots: [{ dayOfWeek: 'MON', startMinute: 900, endMinute: 960 }],
      },
    ];

    expect(() =>
      validator.validateScheduleOverlap('TUE', 900, 960, otherGroups),
    ).not.toThrow();
  });
});
