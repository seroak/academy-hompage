import { Module } from '@nestjs/common';
import { LevelTestsController } from './level-tests.controller';
import { LevelTestsService } from './level-tests.service';
import { LevelTestImageStorageService } from './level-test-image-storage.service';

@Module({
  controllers: [LevelTestsController],
  providers: [LevelTestsService, LevelTestImageStorageService],
})
export class LevelTestsModule {}
