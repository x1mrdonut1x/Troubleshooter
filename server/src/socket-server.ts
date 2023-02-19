import { Server } from 'socket.io';
import { SocketEvent } from '../../types/events';
import httpServer from 'http';
import { ServerMovement, ServerPlayer, ServerShootData, ServerWorldObject } from '../../types';

export interface WrappedServerSocket<T> {
  event: string;
  callback: SocketActionFn<T>;
}

type SocketActionFn<T> = (message: T) => void;

let io: Server;

export function createSocketServer(server: httpServer.Server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  let players: ServerPlayer[] = [];
  let socketId: string;

  io.on('connection', socket => {
    socketId = socket.id;
    socket.send(socketId);
    console.log(`user ${socketId} connected`);

    registeredEvents.forEach(({ event, callback }) => {
      socket.on(event, callback);
    });
  });

  function handleCreatePlayer(data: { id: string }) {
    console.log(`player ${data.id} connected`);

    players.push({
      id: data.id,
      x: Math.random() * 1100 + 100,
      y: Math.random() * 600 + 100,
    });

    broadcast<ServerWorldObject[]>(SocketEvent.PLAYER)(players);
  }

  function handleMovePlayer(data: { id: string; movement: ServerMovement }) {
    const foundPlayer = players.find(p => p.id === data.id);
    if (foundPlayer) {
      foundPlayer.move = data.movement;
    }

    broadcast<ServerWorldObject[]>(SocketEvent.OBJECTS_CHANGE)(players);
  }

  function handleDisconnectPlayer() {
    players = players.filter(player => player.id !== socketId);
  }

  const registeredEvents = [
    createSocket(SocketEvent.DISCONNECT, handleDisconnectPlayer),
    createSocket<{ id: string }>(SocketEvent.PLAYER_CREATE, handleCreatePlayer),
    createSocket<{ id: string; movement: ServerMovement }>(
      SocketEvent.PLAYER_MOVE,
      handleMovePlayer
    ),
    createSocket<ServerShootData>(SocketEvent.PLAYER_SHOOT),
  ];
}

export function broadcast<T>(event: SocketEvent) {
  console.log('emmiting', event);
  return (message: T) => io?.emit(event, message);
}

export function createSocket<T>(
  event: SocketEvent,
  action?: SocketActionFn<T>
): WrappedServerSocket<T> {
  const callback = action || broadcast(event);
  return { event, callback };
}
