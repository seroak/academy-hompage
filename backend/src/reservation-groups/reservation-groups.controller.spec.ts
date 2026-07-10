import { Test, TestingModule } from '@nestjs/testing';
import { ReservationGroupsController } from './reservation-groups.controller.js';
import { ReservationGroupQueryService } from './reservation-group-query.service.js';
import { ReservationGroupLifecycleService } from './reservation-group-lifecycle.service.js';
import { ReservationGroupMembershipService } from './reservation-group-membership.service.js';

describe('ReservationGroupsController', () => {
  let controller: ReservationGroupsController;
  let queryService: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    findConfirmedSlots: jest.Mock;
    findJoinable: jest.Mock;
  };
  let lifecycleService: {
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let membershipService: {
    addMember: jest.Mock;
    removeMember: jest.Mock;
    replaceMemberSlots: jest.Mock;
    moveMember: jest.Mock;
  };

  beforeEach(async () => {
    queryService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findConfirmedSlots: jest.fn(),
      findJoinable: jest.fn(),
    };
    lifecycleService = {
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    membershipService = {
      addMember: jest.fn(),
      removeMember: jest.fn(),
      replaceMemberSlots: jest.fn(),
      moveMember: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationGroupsController],
      providers: [
        { provide: ReservationGroupQueryService, useValue: queryService },
        {
          provide: ReservationGroupLifecycleService,
          useValue: lifecycleService,
        },
        {
          provide: ReservationGroupMembershipService,
          useValue: membershipService,
        },
      ],
    }).compile();

    controller = module.get<ReservationGroupsController>(
      ReservationGroupsController,
    );
  });

  it('delegates findAll to the service', async () => {
    queryService.findAll.mockResolvedValue(['group']);

    await expect(controller.findAll()).resolves.toEqual(['group']);
  });

  it('delegates findOne to the service', async () => {
    queryService.findOne.mockResolvedValue('group');

    await expect(controller.findOne('1')).resolves.toBe('group');
    expect(queryService.findOne).toHaveBeenCalledWith('1');
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
    lifecycleService.create.mockResolvedValue('created');

    await expect(controller.create(dto)).resolves.toBe('created');
    expect(lifecycleService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates update to the service', async () => {
    lifecycleService.update.mockResolvedValue('updated');

    await expect(controller.update('1', { label: 'x' })).resolves.toBe(
      'updated',
    );
    expect(lifecycleService.update).toHaveBeenCalledWith('1', { label: 'x' });
  });

  it('delegates remove to the service', async () => {
    lifecycleService.remove.mockResolvedValue(undefined);

    await controller.remove('1');
    expect(lifecycleService.remove).toHaveBeenCalledWith('1');
  });

  it('delegates findConfirmedSlots to the service', async () => {
    const slots = [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 790 }];
    queryService.findConfirmedSlots.mockResolvedValue(slots);

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
    queryService.findJoinable.mockResolvedValue(groups);

    await expect(controller.findJoinable()).resolves.toBe(groups);
  });

  it('delegates addMember to the service', async () => {
    const dto = {
      reservationId: 'r3',
      slots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 730 }],
    };
    membershipService.addMember.mockResolvedValue('updated');

    await expect(controller.addMember('g1', dto)).resolves.toBe('updated');
    expect(membershipService.addMember).toHaveBeenCalledWith('g1', dto);
  });

  it('delegates removeMember to the service', async () => {
    membershipService.removeMember.mockResolvedValue(undefined);

    await controller.removeMember('g1', 'r1');
    expect(membershipService.removeMember).toHaveBeenCalledWith('g1', 'r1');
  });

  it('delegates replaceMemberSlots to the service', async () => {
    const dto = {
      slots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 730 }],
    };
    membershipService.replaceMemberSlots.mockResolvedValue('updated');

    await expect(controller.replaceMemberSlots('g1', 'r1', dto)).resolves.toBe(
      'updated',
    );
    expect(membershipService.replaceMemberSlots).toHaveBeenCalledWith(
      'g1',
      'r1',
      dto,
    );
  });

  it('delegates moveMember to the service', async () => {
    const dto = {
      targetGroupId: 'g2',
      slots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 730 }],
    };
    membershipService.moveMember.mockResolvedValue('moved');

    await expect(controller.moveMember('g1', 'r1', dto)).resolves.toBe('moved');
    expect(membershipService.moveMember).toHaveBeenCalledWith('g1', 'r1', dto);
  });
});
