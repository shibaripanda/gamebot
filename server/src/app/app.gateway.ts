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
    payload: Pick<Group, 'name' | 'promo' | 'aliance'>,
  ): Promise<any> {
    console.log(payload);
    this.logger.log(`Создание группы: ${JSON.stringify(payload)}`);
    const res = await this.groupService.createGroup(payload);
    if (!res) return { success: false, message: 'Группа не создана' };
    return { success: true, message: 'Группа создана', group: res };
  }
}
