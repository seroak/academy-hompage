import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

describe('ReservationsController', () => {
  let controller: ReservationsController;
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
      controllers: [ReservationsController],
      providers: [{ provide: ReservationsService, useValue: service }],
    }).compile();

    controller = module.get<ReservationsController>(ReservationsController);
  });

  it('delegates findAll to the service with query filters', async () => {
    service.findAll.mockResolvedValue(['reservation']);

    await expect(controller.findAll({ status: 'WAITING' })).resolves.toEqual(['reservation']);
    expect(service.findAll).toHaveBeenCalledWith({ status: 'WAITING' });
  });

  it('delegates findOne to the service', async () => {
    service.findOne.mockResolvedValue('reservation');

    await expect(controller.findOne('1')).resolves.toBe('reservation');
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('delegates create to the service (public endpoint)', async () => {
    const dto = {
      childName: '민준',
      childAge: 5,
      parentName: '김엄마',
      parentEmail: 'parent@example.com',
      preferredDayOfWeek: 'MON',
      preferredHour: 12,
    };
    service.create.mockResolvedValue('created');

    await expect(controller.create(dto)).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates update to the service', async () => {
    service.update.mockResolvedValue('updated');

    await expect(controller.update('1', { status: 'CANCELLED' })).resolves.toBe('updated');
    expect(service.update).toHaveBeenCalledWith('1', { status: 'CANCELLED' });
  });

  it('delegates remove to the service', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
