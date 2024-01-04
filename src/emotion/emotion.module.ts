import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmotionEntity } from './emotion.entity';
import { EmotionService } from './emotion.service';
import { EmotionController } from './emotion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmotionEntity])],
  providers: [EmotionService],
  controllers: [EmotionController],
})
export class EmotionModule {}
