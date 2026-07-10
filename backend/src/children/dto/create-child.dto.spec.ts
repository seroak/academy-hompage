import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateChildDto } from './create-child.dto.js';

describe('CreateChildDto', () => {
  it('이름이 비어 있으면 실패한다', async () => {
    const dto = plainToInstance(CreateChildDto, { name: '', age: 5 });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it.each([3, 11])('서비스 나이 범위를 벗어난 %i세는 실패한다', async (age) => {
    const dto = plainToInstance(CreateChildDto, { name: '민준', age });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'age')).toBe(true);
  });
});
