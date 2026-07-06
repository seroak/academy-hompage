import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: { login: jest.Mock };

  beforeEach(async () => {
    service = { login: jest.fn() };

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
});
