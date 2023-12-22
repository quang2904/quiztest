import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Put,
} from '@nestjs/common';
import { ValidationPipe } from '../shared/pipes/validation.pipe';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { User } from './user.decorator';
import { UserRO } from './user.interface';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('user')
  async findMe(@User('email') email: string): Promise<UserRO> {
    return await this.userService.findByEmail(email);
  }

  @Put('user')
  async update(
    @User('id') userId: number,
    @Body(new ValidationPipe()) userData: UpdateUserDto,
  ) {
    return this.userService.update(userId, userData);
  }

  @Post('users')
  async register(@Body(new ValidationPipe()) userData: CreateUserDto) {
    return this.userService.create(userData);
  }

  @Post('users/login')
  async login(
    @Body(new ValidationPipe()) loginUserDto: LoginUserDto,
  ): Promise<UserRO> {
    const _user = await this.userService.findOne(loginUserDto);

    const errors = { User: 'Not found' };
    if (!_user) throw new HttpException({ errors }, 401);

    const token = await this.userService.generateJWT(_user);
    const { email, username, image } = _user;
    const user = { email, token, username, image };
    return user;
  }
}
