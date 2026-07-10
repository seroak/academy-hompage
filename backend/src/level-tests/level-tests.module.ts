import { Module } from '@nestjs/common';
import { LevelTestsController } from './level-tests.controller.js';
import { LevelTestsService } from './level-tests.service.js';
import { LevelTestImageStorageService } from './level-test-image-storage.service.js';

@Module({
  controllers: [LevelTestsController],
  providers: [LevelTestsService, LevelTestImageStorageService],
})
export class LevelTestsModule {}
