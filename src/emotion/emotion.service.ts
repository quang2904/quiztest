import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { CreateEmotionDto } from './dto';
import { EmotionEntity } from './emotion.entity';

@Injectable()
export class EmotionService {
  constructor(
    @InjectRepository(EmotionEntity)
    private readonly emotionRepository: Repository<EmotionEntity>,
  ) {}

  async findAll(): Promise<EmotionEntity[]> {
    return await this.emotionRepository.find();
  }

  async create(emotionData: CreateEmotionDto): Promise<EmotionEntity> {
    const emotion = new EmotionEntity();
    emotion.height = emotionData.height;
    emotion.width = emotionData.width;
    emotion.url = emotionData.url;

    const newEmotion = await this.emotionRepository.save(emotion);

    return newEmotion;
  }

  async delete(emotionId: number): Promise<DeleteResult> {
    return await this.emotionRepository.delete({ id: emotionId });
  }

  async update(emotionId: number, emotionData: any): Promise<EmotionEntity> {
    const toUpdate = await this.emotionRepository.findOne({
      where: { id: emotionId },
    });
    const updated = Object.assign(toUpdate, emotionData);
    const emotion = await this.emotionRepository.save(updated);
    return emotion;
  }
}
