import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetaSyncScheduler } from './meta-sync.scheduler.js';
import { MetaSyncService } from './meta-sync.service.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('MetaSyncScheduler', () => {
  it('META_SYNC_ENABLED가 아니면 동기화를 실행하지 않는다', () => {
    const syncService = { sync: jest.fn() };
    const config = {
      get: jest.fn((_key: string, fallback: unknown) => fallback),
    } as unknown as ConfigService;
    const scheduler = new MetaSyncScheduler(
      syncService as never,
      config as never,
    );
    scheduler.onModuleInit();
    expect(syncService.sync).not.toHaveBeenCalled();
    scheduler.onModuleDestroy();
  });

  it('동기화 실패 시 원인을 로그로 남긴다', async () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const syncService = {
      sync: jest.fn().mockRejectedValue(new Error('Meta API 권한이 없습니다.')),
    };
    const config = {
      get: jest.fn(() => 'true'),
    } as unknown as ConfigService;
    const scheduler = new MetaSyncScheduler(
      syncService as never,
      config as never,
    );

    scheduler.onModuleInit();
    await flush();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Meta API 권한이 없습니다.'),
    );
    scheduler.onModuleDestroy();
    errorSpy.mockRestore();
  });
});
