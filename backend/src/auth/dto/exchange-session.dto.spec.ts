import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ExchangeSessionDto } from './exchange-session.dto.js';

describe('ExchangeSessionDto', () => {
  it('code가 비어 있으면 실패한다', async () => {
    const dto = plainToInstance(ExchangeSessionDto, { code: '' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'code')).toBe(true);
  });

  it('code가 누락되면 실패한다', async () => {
    const dto = plainToInstance(ExchangeSessionDto, {});

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'code')).toBe(true);
  });

  it('code가 문자열이 아니면 실패한다', async () => {
    const dto = plainToInstance(ExchangeSessionDto, { code: 12345 });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'code')).toBe(true);
  });

  it('유효한 code는 통과한다', async () => {
    const dto = plainToInstance(ExchangeSessionDto, { code: 'valid-code' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
