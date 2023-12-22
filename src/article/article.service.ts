import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { DeleteResult, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FollowsEntity } from '../profile/follows.entity';
import { UserEntity } from '../user/user.entity';
import { ArticleEntity } from './article.entity';
import { ArticleRO, ArticlesRO, CommentsRO } from './article.interface';
import { CommentEntity } from './comment.entity';
import { CreateArticleDto } from './dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowsEntity)
    private readonly followsRepository: Repository<FollowsEntity>,
  ) {}

  async findAll(query): Promise<ArticlesRO> {
    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author');

    if ('tag' in query) {
      qb.where('article.tagList LIKE :tag', { tag: `%${query.tag}%` });
    }

    if ('author' in query) {
      const author = await this.userRepository.findOne({
        where: {
          username: query.author,
        },
      });
      qb.andWhere('article.authorId = :id', { id: author.id });
    }

    if ('favorited' in query) {
      const author = await this.userRepository.findOne({
        where: {
          username: query.favorited,
        },
      });
      const ids = author.favorites.map((el) => el.id);
      qb.andWhere('article.id IN (:...ids)', { ids });
    }

    qb.orderBy('article.created', 'DESC');

    const articlesCount = await qb.getCount();

    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }

    const articles = await qb.getMany();

    return { articles, articlesCount };
  }

  async findFeed(userId: number, query): Promise<ArticlesRO> {
    const _follows = await this.followsRepository.find({
      where: { followerId: userId },
    });

    if (!(Array.isArray(_follows) && _follows.length > 0)) {
      return { articles: [], articlesCount: 0 };
    }

    const ids = _follows.map((el) => el.followingId);

    const qb = this.articleRepository
      .createQueryBuilder('article')
      .where('article.authorId IN (:ids)', { ids });

    qb.orderBy('article.created', 'DESC');

    const articlesCount = await qb.getCount();

    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }

    const articles = await qb.getMany();

    return { articles, articlesCount };
  }

  async findOne(slug): Promise<ArticleRO> {
    const article = await this.articleRepository.findOne({
      where: {
        slug,
      },
    });
    return { article };
  }

  async addComment(
    userId: number,
    slug: string,
    commentData,
  ): Promise<ArticleRO> {
    let article = await this.articleRepository.findOne({ where: { slug } });

    const comment = new CommentEntity();
    comment.body = commentData.body;
    comment.author.id = userId;

    article.comments.push(comment);

    await this.commentRepository.save(comment);
    article = await this.articleRepository.save(article);
    return { article };
  }

  async deleteComment(slug: string, id: number): Promise<ArticleRO> {
    const user = await this.userRepository.findOne({ where: { id } });
    let article = await this.articleRepository.findOne({ where: { slug } });

    const comment = await this.commentRepository.findOne({
      where: {
        id,
      },
    });

    if (user.id !== article.author.id && user.id !== comment.author.id) {
      throw new ForbiddenException('You do not have access to this resource.');
    }

    const deleteIndex = article.comments.findIndex(
      (_comment) => _comment.id === comment.id,
    );

    if (deleteIndex >= 0) {
      const deleteComments = article.comments.splice(deleteIndex, 1);
      await this.commentRepository.delete(deleteComments[0].id);
      article = await this.articleRepository.save(article);
      return { article };
    } else {
      return { article };
    }
  }

  async favorite(id: number, slug: string): Promise<ArticleRO> {
    let article = await this.articleRepository.findOne({ where: { slug } });
    const user = await this.userRepository.findOne({ where: { id } });

    const isNewFavorite =
      user.favorites.findIndex((_article) => _article.id === article.id) < 0;
    if (isNewFavorite) {
      user.favorites.push(article);
      article.favoriteCount++;

      await this.userRepository.save(user);
      article = await this.articleRepository.save(article);
    }

    return { article };
  }

  async unFavorite(id: number, slug: string): Promise<ArticleRO> {
    let article = await this.articleRepository.findOne({ where: { slug } });
    const user = await this.userRepository.findOne({ where: { id } });

    const deleteIndex = user.favorites.findIndex(
      (_article) => _article.id === article.id,
    );

    if (deleteIndex >= 0) {
      user.favorites.splice(deleteIndex, 1);
      article.favoriteCount--;

      await this.userRepository.save(user);
      article = await this.articleRepository.save(article);
    }

    return { article };
  }

  async findComments(slug: string): Promise<CommentsRO> {
    const article = await this.articleRepository.findOne({ where: { slug } });
    return { comments: article.comments };
  }

  async create(
    userId: number,
    articleData: CreateArticleDto,
  ): Promise<ArticleEntity> {
    const article = new ArticleEntity();
    article.title = articleData.title;
    article.description = articleData.description;
    article.slug =
      slugify(articleData.title, {
        lower: true,
        trim: true,
        strict: true,
      }) +
      '-' +
      uuidv4();
    article.tagList = articleData.tagList || [];
    article.comments = [];

    const newArticle = await this.articleRepository.save(article);

    const author = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['articles'],
    });
    author.articles.push(article);

    await this.userRepository.save(author);

    return newArticle;
  }

  async update(
    userId: number,
    slug: string,
    articleData: any,
  ): Promise<ArticleRO> {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    const toUpdate = await this.articleRepository.findOne({
      where: { slug: slug },
    });

    if (user.id !== toUpdate.author.id) {
      throw new ForbiddenException('You do not have access to this resource.');
    }

    const updated = Object.assign(toUpdate, articleData);
    const article = await this.articleRepository.save(updated);
    return { article };
  }

  async delete(userId: number, slug: string): Promise<DeleteResult> {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    const article = await this.articleRepository.findOne({ where: { slug } });

    if (user.id !== article.author.id) {
      throw new ForbiddenException('You do not have access to this resource.');
    }

    return await this.articleRepository.delete({ slug: slug });
  }
}
