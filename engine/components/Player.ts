import { ClientShootData, EntityId, ServerMovement } from '../../shared/types';
import { Rectangle } from '../entities/Rectangle';
import { Vector2 } from '../entities/Vector2';
import { GameEngine } from '../GameEngine';
import { Bullet } from './Bullet';

export class Player extends Rectangle {
  public bullets: Set<Bullet> = new Set();
  public isMoving = false;
  public speed = 200;
  public health = 200;
  public movement: ServerMovement = { left: false, right: false, up: false, down: false };

  public bulletSpeed = 700;
  public shootingSpeed = 120;
  public isShooting = false;
  public pointer?: Vector2;
  private lastShot = Date.now();

  constructor(private engine: GameEngine, x: number, y: number, public id: EntityId) {
    super(x, y, 40, 60, id);

    this.label = 'Player';
    this.collisionGroup = 'player';
  }

  private getBulletVelocity(data: Vector2) {
    const xRelativeToPlayer = data.x;
    const yRelativeToPlayer = data.y;

    const angle = Math.atan2(yRelativeToPlayer, xRelativeToPlayer);

    const velocityX = Math.cos(angle) * this.bulletSpeed;
    const velocityY = Math.sin(angle) * this.bulletSpeed;

    return { x: velocityX, y: velocityY };
  }

  public shoot() {
    if (!this.isShooting || !this.pointer) return;

    const now = Date.now();
    const dt = now - this.lastShot;

    if (dt >= this.shootingSpeed) {
      const velocity = this.getBulletVelocity(this.pointer);
      const bullet = new Bullet(
        this.x,
        this.y,
        velocity,
        now,
        this.id,
        `${this.id}_${this.bullets.size + 1}_${Math.random() * 100}`
      );

      this.bullets.add(bullet);
      this.engine.addBullet(bullet);

      this.lastShot = now;
    }
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

  public setShootingFromInput(input: ClientShootData) {
    this.isShooting = input.isShooting;
    this.pointer = input.mousePos;
  }

  public update(dt: number) {
    super.update(dt);

    if (this.health <= 0) {
      this.destroy();
    }

    if (this.isShooting) {
      this.shoot();
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
