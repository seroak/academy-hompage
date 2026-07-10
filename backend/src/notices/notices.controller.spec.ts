import { Test, TestingModule } from '@nestjs/testing';
import { NoticesController } from './notices.controller.js';
import { NoticesService } from './notices.service.js';

describe('NoticesController', () => {
  let controller: NoticesController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoticesController],
      providers: [{ provide: NoticesService, useValue: service }],
    }).compile();

    controller = module.get<NoticesController>(NoticesController);
  });

  it('delegates findAll to the service', async () => {
    service.findAll.mockResolvedValue(['notice']);

    await expect(controller.findAll()).resolves.toEqual(['notice']);
  });

  it('delegates findOne to the service', async () => {
    service.findOne.mockResolvedValue('notice');

    await expect(controller.findOne('1')).resolves.toBe('notice');
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('delegates create to the service', async () => {
    const dto = { title: 't', content: 'c' };
    service.create.mockResolvedValue('created');

    await expect(controller.create(dto)).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates update to the service', async () => {
    service.update.mockResolvedValue('updated');

    await expect(controller.update('1', { title: 'x' })).resolves.toBe('updated');
    expect(service.update).toHaveBeenCalledWith('1', { title: 'x' });
  });

  it('delegates remove to the service', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
