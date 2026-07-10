import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PARENT_AUTH_COOKIE } from './auth-cookies.js';

describe('AuthController', () => {
  let controller: AuthController;
  let service: { login: jest.Mock; loginParent: jest.Mock; signupParent: jest.Mock };

  function mockResponse() {
    return { cookie: jest.fn(), clearCookie: jest.fn() };
  }

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

  it('delegates parent login to the service and sets an httpOnly parent cookie', async () => {
    service.loginParent.mockResolvedValue({ accessToken: 'parent-token', parent: { id: '1' } });
    const response = mockResponse();

    const result = await controller.loginParent(
      { email: 'parent@example.com', password: 'password123' },
      response as never,
    );

    expect(result).toEqual({ accessToken: 'parent-token', parent: { id: '1' } });
    expect(service.loginParent).toHaveBeenCalledWith('parent@example.com', 'password123');
    expect(response.cookie).toHaveBeenCalledWith(
      PARENT_AUTH_COOKIE,
      'parent-token',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('delegates parent signup to the service and sets an httpOnly parent cookie', async () => {
    service.signupParent.mockResolvedValue({ accessToken: 'parent-token', parent: { id: '1' } });
    const response = mockResponse();

    const dto = {
      name: '김엄마',
      email: 'parent@example.com',
      password: 'password123',
    };
    const result = await controller.signupParent(dto, response as never);

    expect(result).toEqual({ accessToken: 'parent-token', parent: { id: '1' } });
    expect(service.signupParent).toHaveBeenCalledWith(dto);
    expect(response.cookie).toHaveBeenCalledWith(
      PARENT_AUTH_COOKIE,
      'parent-token',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('clears the parent cookie on logout', () => {
    const response = mockResponse();

    controller.logoutParent(response as never);

    expect(response.clearCookie).toHaveBeenCalledWith(
      PARENT_AUTH_COOKIE,
      expect.objectContaining({ path: '/' }),
    );
  });
});
