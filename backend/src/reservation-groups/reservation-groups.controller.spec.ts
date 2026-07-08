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
    findConfirmedSlots: jest.Mock;
    findJoinable: jest.Mock;
    addMember: jest.Mock;
    removeMember: jest.Mock;
    replaceMemberSlots: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findConfirmedSlots: jest.fn(),
      findJoinable: jest.fn(),
      addMember: jest.fn(),
      removeMember: jest.fn(),
      replaceMemberSlots: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationGroupsController],
      providers: [{ provide: ReservationGroupsService, useValue: service }],
    }).compile();

    controller = module.get<ReservationGroupsController>(
      ReservationGroupsController,
    );
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
      capacity: 4,
      slots: [
        {
          reservationId: 'r1',
          dayOfWeek: 'MON',
          startMinute: 720,
          endMinute: 730,
        },
        {
          reservationId: 'r2',
          dayOfWeek: 'MON',
          startMinute: 720,
          endMinute: 730,
        },
      ],
    };
    service.create.mockResolvedValue('created');

    await expect(controller.create(dto)).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates update to the service', async () => {
    service.update.mockResolvedValue('updated');

    await expect(controller.update('1', { label: 'x' })).resolves.toBe(
      'updated',
    );
    expect(service.update).toHaveBeenCalledWith('1', { label: 'x' });
  });

  it('delegates remove to the service', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith('1');
  });

  it('delegates findConfirmedSlots to the service', async () => {
    const slots = [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 790 }];
    service.findConfirmedSlots.mockResolvedValue(slots);

    await expect(controller.findConfirmedSlots()).resolves.toBe(slots);
  });

  it('delegates findJoinable to the service', async () => {
    const groups = [
      {
        id: 'g1',
        label: '월요일반',
        capacity: 4,
        filledCount: 2,
        minAge: 5,
        maxAge: 6,
        slots: [],
      },
    ];
    service.findJoinable.mockResolvedValue(groups);

    await expect(controller.findJoinable()).resolves.toBe(groups);
  });

  it('delegates addMember to the service', async () => {
    const dto = {
      reservationId: 'r3',
      slots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 730 }],
    };
    service.addMember.mockResolvedValue('updated');

    await expect(controller.addMember('g1', dto)).resolves.toBe('updated');
    expect(service.addMember).toHaveBeenCalledWith('g1', dto);
  });

  it('delegates removeMember to the service', async () => {
    service.removeMember.mockResolvedValue(undefined);

    await controller.removeMember('g1', 'r1');
    expect(service.removeMember).toHaveBeenCalledWith('g1', 'r1');
  });

  it('delegates replaceMemberSlots to the service', async () => {
    const dto = {
      slots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 730 }],
    };
    service.replaceMemberSlots.mockResolvedValue('updated');

    await expect(
      controller.replaceMemberSlots('g1', 'r1', dto),
    ).resolves.toBe('updated');
    expect(service.replaceMemberSlots).toHaveBeenCalledWith('g1', 'r1', dto);
  });
});
