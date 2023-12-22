import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ValidationPipe } from '../shared/pipes/validation.pipe';
import { User } from '../user/user.decorator';
import { ArticleRO, ArticlesRO, CommentsRO } from './article.interface';
import { ArticleService } from './article.service';
import { CreateArticleDto, CreateCommentDto } from './dto';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  async findAll(@Query() query): Promise<ArticlesRO> {
    return await this.articleService.findAll(query);
  }

  @Get('feed')
  async getFeed(
    @User('id') userId: number,
    @Query() query,
  ): Promise<ArticlesRO> {
    return await this.articleService.findFeed(userId, query);
  }

  @Get(':slug')
  async findOne(@Param('slug') slug): Promise<ArticleRO> {
    return await this.articleService.findOne({ slug });
  }

  @Get(':slug/comments')
  async findComments(@Param('slug') slug): Promise<CommentsRO> {
    return await this.articleService.findComments(slug);
  }

  @Post()
  async create(
    @User('id') userId: number,
    @Body(new ValidationPipe()) articleData: CreateArticleDto,
  ) {
    return this.articleService.create(userId, articleData);
  }

  @Put(':slug')
  async update(
    @User('id') userId: number,
    @Param() params,
    @Body(new ValidationPipe()) articleData: CreateArticleDto,
  ) {
    return this.articleService.update(userId, params.slug, articleData);
  }

  @Delete(':slug')
  async delete(@User('id') userId: number, @Param() params) {
    return this.articleService.delete(userId, params.slug);
  }

  @Post(':slug/comments')
  async createComment(
    @User('id') userId: number,
    @Param('slug') slug,
    @Body(new ValidationPipe()) commentData: CreateCommentDto,
  ) {
    return await this.articleService.addComment(userId, slug, commentData);
  }

  @Delete(':slug/comments/:id')
  async deleteComment(@User('id') userId: number, @Param() params) {
    const { slug, id } = params;
    return await this.articleService.deleteComment(slug, id);
  }

  @Post(':slug/favorite')
  async favorite(@User('id') userId: number, @Param('slug') slug) {
    return await this.articleService.favorite(userId, slug);
  }

  @Delete(':slug/favorite')
  async unFavorite(@User('id') userId: number, @Param('slug') slug) {
    return await this.articleService.unFavorite(userId, slug);
  }
}
