import { LevelTestImageStorageService } from './level-test-image-storage.service';

describe('LevelTestImageStorageService', () => {
  let unlink: jest.Mock;
  let service: LevelTestImageStorageService;

  beforeEach(() => {
    unlink = jest.fn().mockResolvedValue(undefined);
    service = new LevelTestImageStorageService(unlink);
  });

  it('업로드 경로(/uploads/...)면 실제 파일 경로로 변환해 삭제한다', async () => {
    await service.deleteUploadedImage('/uploads/level-test-questions/abc.png');

    expect(unlink).toHaveBeenCalledTimes(1);
    const [calledPath] = unlink.mock.calls[0];
    expect(calledPath).toContain('uploads/level-test-questions/abc.png');
  });

  it('url이 null/undefined이면 아무 작업도 하지 않는다', async () => {
    await service.deleteUploadedImage(null);
    await service.deleteUploadedImage(undefined);

    expect(unlink).not.toHaveBeenCalled();
  });

  it('업로드 경로가 아닌 외부 URL이면 삭제를 시도하지 않는다', async () => {
    await service.deleteUploadedImage('https://example.com/some-image.png');

    expect(unlink).not.toHaveBeenCalled();
  });

  it('파일이 이미 없어도(ENOENT) 에러를 던지지 않는다', async () => {
    unlink.mockRejectedValue(Object.assign(new Error('not found'), { code: 'ENOENT' }));

    await expect(
      service.deleteUploadedImage('/uploads/level-test-questions/missing.png'),
    ).resolves.toBeUndefined();
  });

  it('그 외 삭제 실패는 조용히 무시한다(요청 자체는 실패시키지 않음)', async () => {
    unlink.mockRejectedValue(new Error('disk error'));

    await expect(
      service.deleteUploadedImage('/uploads/level-test-questions/broken.png'),
    ).resolves.toBeUndefined();
  });
});
