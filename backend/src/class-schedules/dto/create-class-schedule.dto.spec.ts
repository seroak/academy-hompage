import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateClassScheduleDto } from './create-class-schedule.dto.js';

function dto(value: unknown) {
  return plainToInstance(CreateClassScheduleDto, value);
}

describe('CreateClassScheduleDto', () => {
  it('accepts adjacent-week dates with previous and next month colors', async () => {
    const errors = await validate(
      dto({
        year: 2026,
        quarter: 2,
        days: [
          { date: '2026-03-29', kind: 'CLASS', classMonth: '2026-03' },
          { date: '2026-07-04', kind: 'CLASS', classMonth: '2026-07' },
        ],
      }),
    );

    expect(errors).toHaveLength(0);
  });

  it.each([
    [
      'duplicate dates',
      [
        { date: '2026-07-01', kind: 'CLASS', classMonth: '2026-07' },
        { date: '2026-07-01', kind: 'CLOSED', note: '휴강' },
      ],
    ],
    ['class date without classMonth', [{ date: '2026-07-01', kind: 'CLASS' }]],
    [
      'holiday with classMonth',
      [{ date: '2026-07-17', kind: 'HOLIDAY', classMonth: '2026-07' }],
    ],
    [
      'date outside the visible quarter grid',
      [{ date: '2026-06-27', kind: 'HOLIDAY' }],
    ],
    [
      'classMonth outside the adjacent color months',
      [{ date: '2026-07-01', kind: 'CLASS', classMonth: '2026-11' }],
    ],
  ])('rejects %s', async (_label, invalidDays) => {
    const errors = await validate(
      dto({ year: 2026, quarter: 3, days: invalidDays }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects notes longer than 30 characters', async () => {
    const errors = await validate(
      dto({
        year: 2026,
        quarter: 3,
        days: [{ date: '2026-08-17', kind: 'HOLIDAY', note: '가'.repeat(31) }],
      }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });
});
