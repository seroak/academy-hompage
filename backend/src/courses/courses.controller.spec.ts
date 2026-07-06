import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

describe('CoursesController', () => {
  let controller: CoursesController;
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
      controllers: [CoursesController],
      providers: [{ provide: CoursesService, useValue: service }],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  it('delegates findAll to the service', async () => {
    service.findAll.mockResolvedValue(['course']);

    await expect(controller.findAll()).resolves.toEqual(['course']);
  });

  it('delegates findOne to the service', async () => {
    service.findOne.mockResolvedValue('course');

    await expect(controller.findOne('1')).resolves.toBe('course');
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('delegates create to the service', async () => {
    const dto = {
      title: 't',
      description: 'd',
      category: 'c',
      level: 'l',
      tuition: 1,
      schedule: 's',
      instructorId: 'i',
    };
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
