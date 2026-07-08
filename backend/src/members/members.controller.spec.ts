import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

describe('MembersController', () => {
  let controller: MembersController;
  let service: { findAll: jest.Mock };

  beforeEach(async () => {
    service = { findAll: jest.fn() };

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
});
