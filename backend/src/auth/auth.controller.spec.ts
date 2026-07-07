import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: { login: jest.Mock; loginParent: jest.Mock; signupParent: jest.Mock };

  beforeEach(async () => {
    service = { login: jest.fn(), loginParent: jest.fn(), signupParent: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates login to the service with username and password', async () => {
    service.login.mockResolvedValue({ accessToken: 'token' });

    const result = await controller.login({ username: 'admin', password: 'pw' });

    expect(result).toEqual({ accessToken: 'token' });
    expect(service.login).toHaveBeenCalledWith('admin', 'pw');
  });

  it('delegates parent login to the service with email and password', async () => {
    service.loginParent.mockResolvedValue({ accessToken: 'parent-token' });

    const result = await controller.loginParent({
      email: 'parent@example.com',
      password: 'password123',
    });

    expect(result).toEqual({ accessToken: 'parent-token' });
    expect(service.loginParent).toHaveBeenCalledWith('parent@example.com', 'password123');
  });

  it('delegates parent signup to the service', async () => {
    service.signupParent.mockResolvedValue({ accessToken: 'parent-token' });

    const dto = {
      name: '김엄마',
      email: 'parent@example.com',
      password: 'password123',
    };
    const result = await controller.signupParent(dto);

    expect(result).toEqual({ accessToken: 'parent-token' });
    expect(service.signupParent).toHaveBeenCalledWith(dto);
  });
});
