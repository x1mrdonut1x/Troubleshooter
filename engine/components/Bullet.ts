import { EntityId } from '../../shared/types';
import { Circle } from '../entities/Circle';
import { Vector2 } from '../entities/Vector2';

export class Bullet extends Circle {
  public readonly damage = 10;
  public readonly initialPosition: Vector2;
  public readonly createdTimestamp: number;
  public readonly playerId: EntityId;

  constructor(
    x: number,
    y: number,
    velocity: Vector2,
    created: number,
    playerId: EntityId,
    id: EntityId
  ) {
    super(x, y, 6, id);

    this.initialPosition = { x, y };
    this.createdTimestamp = created;
    this.playerId = playerId;

    this.setVelocity(velocity);
    this.collisionGroup = 'player';
  }

  public onCollide() {
    this.destroy();
    this.isStatic = true;
    this.collisionGroup = undefined;
  }
}
