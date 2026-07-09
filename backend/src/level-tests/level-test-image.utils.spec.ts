import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  buildUploadFilename,
  isAllowedImageMimeType,
} from './level-test-image.utils';

describe('level-test-image.utils', () => {
  describe('isAllowedImageMimeType', () => {
    it('허용된 이미지 mimetype이면 true를 반환한다', () => {
      expect(isAllowedImageMimeType('image/png')).toBe(true);
      expect(isAllowedImageMimeType('image/jpeg')).toBe(true);
    });

    it('허용되지 않은 mimetype이면 false를 반환한다', () => {
      expect(isAllowedImageMimeType('application/pdf')).toBe(false);
      expect(isAllowedImageMimeType('text/html')).toBe(false);
    });
  });

  describe('buildUploadFilename', () => {
    it('mimetype에 맞는 확장자를 가진 고유 파일명을 생성한다', () => {
      const filename = buildUploadFilename('image/png');
      expect(filename).toMatch(/^[a-f0-9-]+\.png$/);
    });

    it('호출할 때마다 서로 다른 파일명을 생성한다', () => {
      const first = buildUploadFilename('image/jpeg');
      const second = buildUploadFilename('image/jpeg');
      expect(first).not.toBe(second);
    });

    it('허용되지 않은 mimetype이면 에러를 던진다', () => {
      expect(() => buildUploadFilename('application/pdf')).toThrow();
    });
  });

  it('허용 mimetype 목록과 최대 크기가 정의되어 있다', () => {
    expect(ALLOWED_IMAGE_MIME_TYPES).toContain('image/png');
    expect(MAX_IMAGE_SIZE_BYTES).toBeGreaterThan(0);
  });
});
