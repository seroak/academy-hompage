import { Test, TestingModule } from '@nestjs/testing';
import { AdminNotificationsController } from './admin-notifications.controller.js';
import { AdminNotificationsService } from './admin-notifications.service.js';

describe('AdminNotificationsController', () => {
  let controller: AdminNotificationsController;
  let service: {
    findAll: jest.Mock;
    unreadCount: jest.Mock;
    markRead: jest.Mock;
    markAllRead: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      unreadCount: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminNotificationsController],
      providers: [{ provide: AdminNotificationsService, useValue: service }],
    }).compile();

    controller = module.get<AdminNotificationsController>(AdminNotificationsController);
  });

  it('delegates findAll to the service', async () => {
    service.findAll.mockResolvedValue(['notification']);

    await expect(controller.findAll()).resolves.toEqual(['notification']);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('delegates unreadCount to the service', async () => {
    service.unreadCount.mockResolvedValue({ count: 2 });

    await expect(controller.unreadCount()).resolves.toEqual({ count: 2 });
    expect(service.unreadCount).toHaveBeenCalled();
  });

  it('delegates markRead to the service', async () => {
    service.markRead.mockResolvedValue({ id: 'n1', readAt: new Date() });

    await controller.markRead('n1');
    expect(service.markRead).toHaveBeenCalledWith('n1');
  });

  it('delegates markAllRead to the service', async () => {
    service.markAllRead.mockResolvedValue(undefined);

    await controller.markAllRead();
    expect(service.markAllRead).toHaveBeenCalled();
  });
});
