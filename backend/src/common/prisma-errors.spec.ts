import { hasPrismaErrorCode, isPrismaNotFoundError } from './prisma-errors.js';

describe('hasPrismaErrorCode', () => {
  it('주어진 코드와 일치하면 true를 반환한다', () => {
    expect(hasPrismaErrorCode({ code: 'P2002' }, 'P2002')).toBe(true);
  });

  it('코드가 다르면 false를 반환한다', () => {
    expect(hasPrismaErrorCode({ code: 'P2025' }, 'P2002')).toBe(false);
  });

  it('object가 아니거나 null이면 false를 반환한다', () => {
    expect(hasPrismaErrorCode(null, 'P2025')).toBe(false);
    expect(hasPrismaErrorCode('error', 'P2025')).toBe(false);
    expect(hasPrismaErrorCode(undefined, 'P2025')).toBe(false);
  });
});

describe('isPrismaNotFoundError', () => {
  it('P2025 코드면 true를 반환한다', () => {
    expect(isPrismaNotFoundError({ code: 'P2025' })).toBe(true);
  });

  it('다른 코드면 false를 반환한다', () => {
    expect(isPrismaNotFoundError({ code: 'P2002' })).toBe(false);
  });
});
