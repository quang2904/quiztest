import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class EmotionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  height: number;

  @Column()
  width: number;

  @Column()
  url: string;
}
