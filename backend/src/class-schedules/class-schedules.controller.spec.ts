import { GUARDS_METADATA, HTTP_CODE_METADATA } from '@nestjs/common/constants.js';
import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClassSchedulesController } from './class-schedules.controller.js';
import { ClassSchedulesService } from './class-schedules.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

describe('ClassSchedulesController', () => {
  let controller: ClassSchedulesController;
  const service = {
    findPublished: jest.fn(),
    findPublishedOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    publish: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [ClassSchedulesController],
      providers: [{ provide: ClassSchedulesService, useValue: service }],
    }).compile();
    controller = module.get(ClassSchedulesController);
  });

  it('keeps published reads public and guards admin operations', () => {
    const publicMethod = 'findPublished' as const;
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        ClassSchedulesController.prototype[publicMethod],
      ),
    ).toBeUndefined();
    for (const method of [
      'findAll',
      'create',
      'update',
      'publish',
      'remove',
    ] as const) {
      expect(
        Reflect.getMetadata(
          GUARDS_METADATA,
          ClassSchedulesController.prototype[method],
        ),
      ).toContain(JwtAuthGuard);
    }
  });

  it('returns 204 for delete', () => {
    const removeMethod = 'remove' as const;
    expect(
      Reflect.getMetadata(
        HTTP_CODE_METADATA,
        ClassSchedulesController.prototype[removeMethod],
      ),
    ).toBe(HttpStatus.NO_CONTENT);
  });

  it('delegates published detail and mutations', async () => {
    service.findPublishedOne.mockResolvedValue('published');
    service.publish.mockResolvedValue('published');
    expect(await controller.findPublishedOne(2026, 3)).toBe('published');
    expect(await controller.publish('id')).toBe('published');
    expect(service.findPublishedOne).toHaveBeenCalledWith(2026, 3);
    expect(service.publish).toHaveBeenCalledWith('id');
  });
});
