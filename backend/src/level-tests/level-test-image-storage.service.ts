import { Injectable, Optional } from '@nestjs/common';
import { unlink as fsUnlink } from 'fs/promises';
import { join } from 'path';

const UPLOAD_URL_PREFIX = '/uploads/';

export type UnlinkFn = (path: string) => Promise<void>;

@Injectable()
export class LevelTestImageStorageService {
  constructor(@Optional() private readonly unlinkFile: UnlinkFn = fsUnlink) {}

  async deleteUploadedImage(url?: string | null): Promise<void> {
    if (!url || !url.startsWith(UPLOAD_URL_PREFIX)) {
      return;
    }

    const relativePath = url.slice(UPLOAD_URL_PREFIX.length);
    const absolutePath = join(process.cwd(), 'uploads', relativePath);

    try {
      await this.unlinkFile(absolutePath);
    } catch {
      // 파일이 이미 없거나(ENOENT) 삭제에 실패해도 요청 자체는 실패시키지 않는다.
    }
  }
}
