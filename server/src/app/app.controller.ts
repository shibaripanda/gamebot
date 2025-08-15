import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { BotService } from 'src/bot/bot.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private botService: BotService,
  ) {}

  @Get('access/:token')
  async checkToken(@Param('token') startToken: string) {
    const access = await this.appService.getStatusAccess();
    if (!access) {
      throw new UnauthorizedException('Доступ закрыт');
    }
    const res = await this.appService.validateToken(startToken);
    if (!res) {
      throw new ForbiddenException('Недействительный токен');
    }
    await this.botService.alertUserHaveAccess(res.userId);
    return { token: res.token };
  }
}
