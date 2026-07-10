import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

describe('LevelTests question-image upload (e2e)', () => {
  let app: NestExpressApplication;
  let adminToken: string;
  let uploadedUrl: string | undefined;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: process.env.ADMIN_SEED_USERNAME ?? 'admin',
        password: process.env.ADMIN_SEED_PASSWORD ?? 'admin1234',
      })
      .expect(200);

    adminToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    if (uploadedUrl) {
      const filePath = join(process.cwd(), 'uploads', uploadedUrl.replace('/uploads/', ''));
      if (existsSync(filePath)) rmSync(filePath);
    }
    await app.close();
  });

  it('이미지를 업로드하면 정적으로 접근 가능한 URL을 반환한다', async () => {
    const response = await request(app.getHttpServer())
      .post('/level-tests/question-images')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', TINY_PNG, { filename: 'tiny.png', contentType: 'image/png' })
      .expect(201);

    const url: string = response.body.url;
    expect(url).toMatch(/^\/uploads\/level-test-questions\/[a-f0-9-]+\.png$/);
    uploadedUrl = url;

    const staticResponse = await request(app.getHttpServer()).get(url).expect(200);
    expect(staticResponse.headers['content-type']).toContain('image/png');
  });

  it('허용되지 않은 파일 형식은 거부한다', async () => {
    await request(app.getHttpServer())
      .post('/level-tests/question-images')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from('not an image'), { filename: 'evil.txt', contentType: 'text/plain' })
      .expect(400);
  });

  it('인증 없이 업로드하면 401을 반환한다', async () => {
    await request(app.getHttpServer())
      .post('/level-tests/question-images')
      .attach('file', TINY_PNG, { filename: 'tiny.png', contentType: 'image/png' })
      .expect(401);
  });
});
