import { ServerMovement, ServerPlayer, ClientShootData, ServerSnapshot } from '.';

export enum SocketEvent {
  DISCONNECT = 'disconnect',
  PLAYER_CONNECT = 'players:connect',
  PLAYER_DISCONNECT = 'players:disconnect',
  PLAYERS = 'players',
  PLAYER_MOVE = 'players:move',
  OBJECTS_CHANGE = 'objects:change',
  PLAYER_SHOOT = 'players:shoot',
  WORLD_OBJECTS = 'world:objects',
}

export type SocketEventHandler<T> = (data: T) => void;

export type SocketEventListener = {
  [SocketEvent.PLAYER_MOVE]: SocketEventHandler<PlayerMoveEvent>;
};

export type PlayerMoveEvent = {
  movement: ServerMovement;
};

export type EmitPlayerShootEvent = Omit<ClientShootData, 'playerPos'>;

export type GetWorldStateEvent = ServerSnapshot;

export type GetPlayersEvent = ServerPlayer[];
