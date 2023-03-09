import { Bullet } from '../../../engine/components/Bullet';
import { Enemy } from '../../../engine/components/Enemy';
import { Player } from '../../../engine/components/Player';
import { GameEngine } from '../../../engine/GameEngine';
import {
  ClientShootData,
  ServerBullet,
  ServerEnemy,
  ServerMovement,
  ServerPlayer,
} from '../../../shared/types';
import { SocketEvent } from '../../../shared/types/events';
import { io } from '../main';

export class GameState {
  public hasChanged = false;
  private readonly engine: GameEngine<Player, Enemy>;

  constructor() {
    this.engine = new GameEngine();

    const initialEnemies = Array.from(Array(10))
      .map(() => this.addEnemy())
      .map(fromServerEnemy);

    io.emit(SocketEvent.ADD_ENEMIES, { data: initialEnemies });
  }

  public getPlayerCount() {
    return this.engine.players.size;
  }

  get players() {
    return Array.from(this.engine.players.values()).map(fromServerPlayer);
  }

  get enemies() {
    return Array.from(this.engine.enemies.values()).map(fromServerEnemy);
  }

  get bullets() {
    return Array.from(this.engine.bullets.values()).map(fromServerBullet);
  }

  public getPlayerById(id: number | string) {
    return this.engine.getPlayerById(id);
  }

  public addPlayer(id: string) {
    this.hasChanged = true;

    const x = Math.random() * 200 + 100;
    const y = Math.random() * 200 + 100;
    const entity = new Player(this.engine, x, y, id);

    this.engine.addPlayer(entity);
  }

  public addEnemy() {
    this.hasChanged = true;

    const x = Math.random() * 1000 + 100;
    const y = Math.random() * 1000 + 100;

    const enemy = new Enemy(this.engine, x, y, this.engine.enemies.size + 1);
    this.engine.addEnemy(enemy);
    return enemy;
  }

  public removePlayer(id: string) {
    this.hasChanged = true;

    this.engine.removePlayer(id);
  }

  public movePlayer(id: string, data: ServerMovement) {
    this.hasChanged = true;
    const foundPlayer = this.engine.getPlayerById(id);

    foundPlayer?.setVelocityFromMovement(data);
  }

  public playerShoots(id: string, data: ClientShootData) {
    const foundPlayer = this.engine.getPlayerById(id);
    foundPlayer?.setShootingFromInput(data);
  }

  public update(dt: number) {
    this.engine.update(dt);
  }
}

export const fromServerPlayer = (player: Player) => {
  return {
    clientId: player.id,
    position: { x: player.x, y: player.y },
    speed: player.speed,
    bulletSpeed: player.bulletSpeed,
    move: player.movement,
  } satisfies ServerPlayer;
};

export const fromServerEnemy = (enemy: Enemy) => {
  return {
    id: enemy.id,
    speed: enemy.speed,
    velocity: { x: enemy.velocity.x, y: enemy.velocity.y },
    position: { x: enemy.x, y: enemy.y },
  } satisfies ServerEnemy;
};

export const fromServerBullet = (bullet: Bullet) => {
  return {
    id: bullet.id,
    velocity: bullet.velocity,
    position: { x: bullet.x, y: bullet.y },
    created: bullet.createdTimestamp,
    playerId: bullet.playerId,
  } satisfies ServerBullet;
};
