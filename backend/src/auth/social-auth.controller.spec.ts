import { Test, TestingModule } from '@nestjs/testing';
import { SocialAuthController } from './social-auth.controller';
import { SocialAuthService } from './social-auth.service';
import { PARENT_AUTH_COOKIE } from './auth-cookies';

describe('SocialAuthController', () => {
  let controller: SocialAuthController;
  let service: {
    buildAuthorizationUrl: jest.Mock;
    handleCallback: jest.Mock;
    exchangeSessionCode: jest.Mock;
    getMe: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      buildAuthorizationUrl: jest.fn(),
      handleCallback: jest.fn(),
      exchangeSessionCode: jest.fn(),
      getMe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialAuthController],
      providers: [{ provide: SocialAuthService, useValue: service }],
    }).compile();

    controller = module.get<SocialAuthController>(SocialAuthController);
  });

  it('redirects to the provider authorization URL', () => {
    service.buildAuthorizationUrl.mockReturnValue('https://accounts.example/auth');
    const response = { redirect: jest.fn() };

    controller.start('google', '/courses', response);

    expect(response.redirect).toHaveBeenCalledWith('https://accounts.example/auth');
    expect(service.buildAuthorizationUrl).toHaveBeenCalledWith('google', '/courses');
  });

  it('redirects callback completion to the frontend callback URL', async () => {
    service.handleCallback.mockResolvedValue('http://localhost:3001/auth/social/callback?code=abc');
    const response = { redirect: jest.fn() };

    await controller.callback('google', { code: 'provider-code', state: 'state' }, response);

    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3001/auth/social/callback?code=abc',
    );
  });

  it('exchanges a one-time session code and sets an httpOnly parent cookie', async () => {
    service.exchangeSessionCode.mockResolvedValue({
      accessToken: 'token',
      parent: { id: '1' },
    });
    const response = { cookie: jest.fn() };

    await expect(
      controller.exchange({ code: 'session-code' }, response as never),
    ).resolves.toEqual({
      accessToken: 'token',
      parent: { id: '1' },
    });
    expect(response.cookie).toHaveBeenCalledWith(
      PARENT_AUTH_COOKIE,
      'token',
      expect.objectContaining({ httpOnly: true }),
    );
  });
});
