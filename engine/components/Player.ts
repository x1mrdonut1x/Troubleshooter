import { EntityId, ServerMovement } from '../../shared/types';
import { Rectangle } from '../entities/Rectangle';
import { GameEngine } from '../GameEngine';
import { Bullet } from './Bullet';

export class Player extends Rectangle {
  public bullets: Set<Bullet> = new Set();
  public isMoving = false;
  public bulletSpeed = 700;
  public shootingSpeed = 120;
  public speed = 200;
  public health = 200;
  public movement: ServerMovement = { left: false, right: false, up: false, down: false };

  private lastShot = Date.now();

  constructor(private engine: GameEngine, x: number, y: number, public id: EntityId) {
    super(x, y, 40, 60, id);

    this.label = 'Player';
    this.collisionGroup = 'player';
  }

  public shoot(bullet: Bullet) {
    const now = Date.now();
    const dt = now - this.lastShot;

    if (dt >= this.shootingSpeed) {
      this.bullets.add(bullet);
      this.engine.addEntity(bullet);

      this.lastShot = now;
      return bullet;
    }

    return;
  }

  public onHit(damage: number) {
    this.health -= damage;
  }

  public setVelocityFromMovement(movement: ServerMovement) {
    this.movement = { ...movement };
    const { left, right, up, down } = this.movement;
    let velocityY = 0;
    let velocityX = 0;

    if (up) {
      velocityY = -this.speed;
    }
    if (down) {
      velocityY = this.speed;
    }
    if (left) {
      velocityX = -this.speed;
    }
    if (right) {
      velocityX = this.speed;
    }

    this.velocity.x = velocityX;
    this.velocity.y = velocityY;
  }

  public update(dt: number) {
    super.update(dt);

    if (this.health <= 0) {
      this.destroy();
    }

    this.bullets.forEach(bullet => {
      if (!bullet.isActive) {
        this.bullets.delete(bullet);
      } else {
        bullet.update(dt);
      }
    });
  }
}
