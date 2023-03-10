import { io as client, Socket } from 'socket.io-client';
import { ClientShootData, ServerShootData } from '../../../shared/types';
import {
  AddEnemiesEvent,
  GetPlayersEvent,
  GetWorldStateEvent,
  PlayerConnectEvent,
  PlayerMoveEvent,
  SocketEvent,
} from '../../../shared/types/events';

class GameServer {
  public clientId!: string; // initialized in createGameServer
  private io!: Socket; // initialized in createGameServer

  constructor() {
    this.io = client(import.meta.env.VITE_SOCKET_SERVER);
  }

  async init() {
    return new Promise(resolve => {
      this.io.on('message', (id: string) => {
        this.clientId = id;

        return resolve(this.clientId);
      });
    });
  }

  get playerConnected() {
    return this.createSocket<PlayerConnectEvent, GetPlayersEvent>(SocketEvent.PLAYER_CONNECT);
  }

  get movePlayer() {
    return this.createSocket<PlayerMoveEvent>(SocketEvent.PLAYER_MOVE);
  }

  get addEnemies() {
    return this.createSocket<AddEnemiesEvent>(SocketEvent.ADD_ENEMIES);
  }

  get getWorldState() {
    return this.createSocket<GetWorldStateEvent>(SocketEvent.OBJECTS_CHANGE);
  }

  get shoot() {
    return this.createSocket<ClientShootData, ServerShootData>(SocketEvent.PLAYER_SHOOT);
  }

  private createSocket<TEmit = unknown, TOn = TEmit, TOff = TEmit>(
    event: SocketEvent
  ): DataSocket<TEmit, TOn, TOff> {
    return {
      emit: this.emitCallback.bind(this)(event),
      on: this.onCallback.bind(this)(event),
      off: this.offCallback.bind(this)(event),
    };
  }

  private emitCallback<T>(event: string) {
    return (data: T): void => {
      // console.log('emitCallback', event, this.clientId);
      this.io.emit(event, { clientId: this.clientId, ...data });
    };
  }

  private onCallback<T>(event: string) {
    return (callback: ListenerCallback<T>): void => {
      this.io.on(event, callback);
    };
  }

  private offCallback<T>(event: string) {
    return (callback?: ListenerCallback<T>): void => {
      this.io.off(event, callback);
    };
  }
}

export interface DataSocket<TEmit, TOn, TOff> {
  emit: (data?: Omit<TEmit, 'clientId'>) => void;
  on: (callback: ListenerCallback<TOn>) => void;
  off: (callback?: ListenerCallback<TOff>) => void;
}

interface ListenerCallback<T> {
  (data: T): void;
}

export let gameServer: GameServer;

export async function createGameServer() {
  gameServer = new GameServer();
  await gameServer.init();

  return gameServer;
}
