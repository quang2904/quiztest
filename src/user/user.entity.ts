import * as argon2 from 'argon2';
import { IsEmail } from 'class-validator';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ArticleEntity } from '../article/article.entity';
import { CommentEntity } from 'src/article/comment.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  @IsEmail()
  email: string;

  @Column({ default: '' })
  image: string;

  @Column()
  password: string;

  @Column({ default: 'active' })
  status: string;

  @BeforeInsert()
  async hashPassword() {
    this.password = await argon2.hash(this.password);
  }

  @ManyToMany(() => ArticleEntity, { eager: true })
  @JoinTable()
  favorites: ArticleEntity[];

  @OneToMany(() => ArticleEntity, (article) => article.author)
  articles: ArticleEntity[];

  @OneToMany(() => CommentEntity, (article) => article.author)
  comments: CommentEntity[];
}
