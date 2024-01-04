import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DeleteResult } from 'typeorm';
import { ValidationPipe } from '../shared/pipes/validation.pipe';
import { CreateEmotionDto } from './dto';
import { EmotionEntity } from './emotion.entity';
import { EmotionService } from './emotion.service';

@Controller('emotions')
export class EmotionController {
  constructor(private readonly emotionService: EmotionService) {}

  @Get()
  async getAll(): Promise<EmotionEntity[]> {
    return await this.emotionService.findAll();
  }

  @Post()
  async create(
    @Body(new ValidationPipe()) emotionData: CreateEmotionDto,
  ): Promise<EmotionEntity> {
    return await this.emotionService.create(emotionData);
  }

  @Put(':id')
  async update(
    @Param('id') emotionId: number,
    @Body(new ValidationPipe()) emotionData: CreateEmotionDto,
  ): Promise<EmotionEntity> {
    return await this.emotionService.update(emotionId, emotionData);
  }

  @Delete(':id')
  async delete(@Param('id') emotionId: number): Promise<DeleteResult> {
    return await this.emotionService.delete(emotionId);
  }
}
