import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from './members.controller.js';
import { MembersService } from './members.service.js';

describe('MembersController', () => {
  let controller: MembersController;
  let service: { findAll: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    service = { findAll: jest.fn(), remove: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [{ provide: MembersService, useValue: service }],
    }).compile();

    controller = module.get<MembersController>(MembersController);
  });

  it('delegates findAll to the service', async () => {
    service.findAll.mockResolvedValue(['member']);

    await expect(controller.findAll()).resolves.toEqual(['member']);
  });

  it('delegates remove to the service', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('p1');

    expect(service.remove).toHaveBeenCalledWith('p1');
  });
});
