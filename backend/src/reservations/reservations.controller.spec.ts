import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller.js';
import { ReservationsService } from './reservations.service.js';

describe('ReservationsController', () => {
  let controller: ReservationsController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    findMine: jest.Mock;
    create: jest.Mock;
    createWalkInReservation: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findMine: jest.fn(),
      create: jest.fn(),
      createWalkInReservation: jest.fn(),
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

  it('delegates findMine to the service with parent user principal', async () => {
    service.findMine.mockResolvedValue(['reservation']);

    await expect(
      controller.findMine({ user: { parentUserId: 'parent-1' } }),
    ).resolves.toEqual(['reservation']);
    expect(service.findMine).toHaveBeenCalledWith('parent-1');
  });

  it('delegates create to the service with parent user principal', async () => {
    const dto = {
      childName: '민준',
      childAge: 5,
      parentName: '김엄마',
      parentEmail: 'parent@example.com',
      preferredSlots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 790 }],
    };
    service.create.mockResolvedValue('created');

    await expect(
      controller.create(dto, { user: { parentUserId: 'parent-1' } }),
    ).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto, 'parent-1');
  });

  it('delegates createWalkInReservation to the service', async () => {
    const dto = {
      childName: '지훈',
      childAge: 6,
      parentName: '최엄마',
      preferredSlots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 730 }],
    };
    service.createWalkInReservation.mockResolvedValue('created');

    await expect(controller.createWalkInReservation(dto)).resolves.toBe('created');
    expect(service.createWalkInReservation).toHaveBeenCalledWith(dto);
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
