import { ClientShootData, ServerShootData } from '../../shared/types';
import {
  AddEnemiesEvent,
  GetPlayersEvent,
  PlayerConnectEvent,
  PlayerMoveEvent,
  SocketEvent,
} from '../../shared/types/events';
import { GameScene } from './game/GameScene';
import { rooms } from './main';
import { SocketActions } from './SocketActions';

export class SocketController {
  public hasChanged = false;
  private game?: GameScene; // game will always exist once a player is connected

  constructor(private socket: SocketActions) {
    this.playerConnected.on(data => {
      if (data.clientId === this.socket.clientId) this.joinRoom();

      this.game?.state.addPlayer(data.clientId);

      socket.broadcastToRoom(SocketEvent.PLAYER_CONNECT, this.game?.state.players);
    });

    this.playerDisconnected.on(() => {
      this.game?.state.removePlayer(socket.clientId);
    });

    this.movePlayer.on(data => {
      this.game?.state.movePlayer(socket.clientId, data.movement);
    });

    this.shoot.on(data => {
      this.game?.state.playerShoots(socket.clientId, data);
    });
  }

  public joinRoom() {
    const roomId = rooms.addPlayerToRoom(this.socket.clientId);
    const room = rooms.getRoom(roomId);

    if (!room) {
      console.log('Could not find room');
      return;
    }

    console.log(`Player ${this.socket.clientId} connected`);
    this.game = room.game;
    this.socket.roomId = room.id;
    this.socket.joinRoom(roomId);
  }

  get playerDisconnected() {
    return this.socket.createSocket(SocketEvent.DISCONNECT);
  }

  get playerConnected() {
    return this.socket.createSocket<PlayerConnectEvent>(SocketEvent.PLAYER_CONNECT);
  }

  get getPlayers() {
    return this.socket.createSocket<GetPlayersEvent>(SocketEvent.PLAYERS);
  }

  get addEnemies() {
    return this.socket.createSocket<AddEnemiesEvent>(SocketEvent.ADD_ENEMIES);
  }

  get movePlayer() {
    return this.socket.createSocket<PlayerMoveEvent>(SocketEvent.PLAYER_MOVE);
  }

  get shoot() {
    return this.socket.createSocket<ServerShootData, ClientShootData>(SocketEvent.PLAYER_SHOOT);
  }
}
