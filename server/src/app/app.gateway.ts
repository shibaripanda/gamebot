import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { SocketAuthMiddleware } from 'src/app/auth-guards/socket-auth.middleware';
import { WsJwtAuthGuard } from './auth-guards/socket-auth.guard';
import { GroupService } from 'src/group/group.service';
import { Group } from 'src/group/group.model';
import { EditRegUsers } from './interfaces/editRegUsers';
import { BotService } from 'src/bot/bot.service';
import { AppService } from './app.service';
import { EditPaymentMetods } from './interfaces/editPaymentMetods';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly socketAuthMiddleware: SocketAuthMiddleware,
    private groupService: GroupService,
    private botService: BotService,
    private appService: AppService,
  ) {}
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('AppGateway');

  afterInit(server: Server) {
    server.use((socket, next) => {
      this.socketAuthMiddleware.use(socket, next);
    });
    this.logger.log('Socket server initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // client.onAny((event, ...args) => {
    //   this.logger.debug(
    //     `onAny -> [${event}] from ${client.id}: ${JSON.stringify(args)}`,
    //   );
    // });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('editRegUsers')
  @UseGuards(WsJwtAuthGuard)
  async handleEditRegUsers(
    client: Socket,
    payload: EditRegUsers,
  ): Promise<any> {
    let res: Group | null | false = null;
    if (payload.action === 'Delete') {
      res = await this.groupService.deleteUsersInGroupAndSetNull(
        payload.groupId,
        payload.idRegUsersForDeleteOrEdit,
      );
    } else if (payload.action === 'Confirm') {
      res = await this.groupService.confirmUsersInGroup(
        payload.groupId,
        payload.idRegUsersForDeleteOrEdit,
      );
      if (res) {
        await this.botService.notifyUsersInGroupByIdsConfirmation(
          payload.groupId,
          payload.idRegUsersForDeleteOrEdit,
        );
      }
    } else if (payload.action === 'Unconfirm') {
      res = await this.groupService.unConfirmUsersInGroup(
        payload.groupId,
        payload.idRegUsersForDeleteOrEdit,
      );
    } else if (payload.action === 'Aliance') {
      res = await this.botService.sendPaymentToKrugerUsers(
        payload.groupId,
        payload.idRegUsersForDeleteOrEdit,
        payload.payment,
      );
      return { success: true, message: 'Подтверждено', group: res };
    }
    if (res) {
      await this.botService.sendOrUpdateMessage(
        res._id,
        res.messageIdInTelegramGroup,
      );
      return { success: true, message: 'Подтверждено', group: res };
    }
    return { success: false, message: 'Ошибка' };
  }

  @SubscribeMessage('editPaymentsMetods')
  @UseGuards(WsJwtAuthGuard)
  async handleEditPaymentMetods(client: Socket, payload: EditPaymentMetods) {
    if (payload.action === 'Create') {
      const res = await this.appService.addPaymentMetod({
        paymentName: payload.name,
        paymentData: payload.data,
      });
      if (res)
        return {
          success: true,
          message: 'Платежные медоты загружены',
          metods: res,
        };
    }
    if (payload.action === 'Delete') {
      const res = await this.appService.deletePaymentMetod({
        paymentName: payload.name,
        paymentData: payload.data,
      });
      if (res)
        return {
          success: true,
          message: 'Платежные медоты загружены',
          metods: res,
        };
    }
    return { success: false, message: 'Ошибка' };
  }

  @SubscribeMessage('getPaymentMetods')
  @UseGuards(WsJwtAuthGuard)
  async handlegetPaymentMetods(): Promise<any> {
    const res = await this.appService.getPaymentMetods();
    if (!res)
      return { success: false, message: 'Платежные медоты не загружены' };
    return {
      success: true,
      message: 'Платежные медоты загружены',
      metods: res,
    };
  }

  @SubscribeMessage('getGroups')
  @UseGuards(WsJwtAuthGuard)
  async handleGetGroups(): Promise<any> {
    const res = await this.groupService.getGroups();
    if (!res) return { success: false, message: 'Группы не загружены' };
    return { success: true, message: 'Группы получены', groups: res };
  }

  @SubscribeMessage('createNewGroup')
  @UseGuards(WsJwtAuthGuard)
  async handleCreateGroup(
    client: Socket,
    payload: Pick<Group, 'name' | 'promo' | 'aliance' | 'prefix'>,
  ): Promise<any> {
    console.log(payload);
    this.logger.log(`Создание группы: ${JSON.stringify(payload)}`);
    const res = await this.groupService.createGroup(payload);
    if (!res) return { success: false, message: 'Группа не создана' };
    return { success: true, message: 'Группа создана', group: res };
  }
}
