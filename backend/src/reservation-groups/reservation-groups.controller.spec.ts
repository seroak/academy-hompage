import { Test, TestingModule } from '@nestjs/testing';
import { ReservationGroupsController } from './reservation-groups.controller';
import { ReservationGroupsService } from './reservation-groups.service';

describe('ReservationGroupsController', () => {
  let controller: ReservationGroupsController;
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
      controllers: [ReservationGroupsController],
      providers: [{ provide: ReservationGroupsService, useValue: service }],
    }).compile();

    controller = module.get<ReservationGroupsController>(ReservationGroupsController);
  });

  it('delegates findAll to the service', async () => {
    service.findAll.mockResolvedValue(['group']);

    await expect(controller.findAll()).resolves.toEqual(['group']);
  });

  it('delegates findOne to the service', async () => {
    service.findOne.mockResolvedValue('group');

    await expect(controller.findOne('1')).resolves.toBe('group');
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('delegates create to the service', async () => {
    const dto = {
      label: '월수금 12시반',
      dayOfWeek: 'MON',
      startMinute: 720,
      endMinute: 790,
      reservationIds: ['r1', 'r2'],
    };
    service.create.mockResolvedValue('created');

    await expect(controller.create(dto)).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates update to the service', async () => {
    service.update.mockResolvedValue('updated');

    await expect(controller.update('1', { label: 'x' })).resolves.toBe('updated');
    expect(service.update).toHaveBeenCalledWith('1', { label: 'x' });
  });

  it('delegates remove to the service', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
