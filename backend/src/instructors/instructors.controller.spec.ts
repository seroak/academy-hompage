import { Test, TestingModule } from '@nestjs/testing';
import { InstructorsController } from './instructors.controller';
import { InstructorsService } from './instructors.service';

describe('InstructorsController', () => {
  let controller: InstructorsController;
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
      controllers: [InstructorsController],
      providers: [{ provide: InstructorsService, useValue: service }],
    }).compile();

    controller = module.get<InstructorsController>(InstructorsController);
  });

  it('delegates findAll to the service', async () => {
    service.findAll.mockResolvedValue(['instructor']);

    await expect(controller.findAll()).resolves.toEqual(['instructor']);
  });

  it('delegates findOne to the service', async () => {
    service.findOne.mockResolvedValue('instructor');

    await expect(controller.findOne('1')).resolves.toBe('instructor');
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('delegates create to the service', async () => {
    const dto = { name: 'n', subject: 's', bio: 'b' };
    service.create.mockResolvedValue('created');

    await expect(controller.create(dto)).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates update to the service', async () => {
    service.update.mockResolvedValue('updated');

    await expect(controller.update('1', { name: 'x' })).resolves.toBe('updated');
    expect(service.update).toHaveBeenCalledWith('1', { name: 'x' });
  });

  it('delegates remove to the service', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
