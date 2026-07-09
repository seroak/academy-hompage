import { Module } from '@nestjs/common';
import { LevelTestsController } from './level-tests.controller';
import { LevelTestsService } from './level-tests.service';

@Module({
  controllers: [LevelTestsController],
  providers: [LevelTestsService],
})
export class LevelTestsModule {}
