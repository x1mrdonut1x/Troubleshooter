import { gameServer } from '@/networking/GameServer';
import { ServerShootData, XYPosition } from '../../../shared/types';
import { Bullet } from './Bullet';
import * as PIXI from 'pixi.js';
import { Player } from './Player';
import { PointerController } from './input-controllers/PointerController';

export class BulletController {
  private bullets: Set<Bullet> = new Set();
  private mousePos: XYPosition = { x: 0, y: 0 };
  private pointerController?: PointerController;
  private serverStep?: ServerShootData;
  public isShooting = false;

  constructor(private stage: PIXI.Container, private player: Player) {
    if (this.player.isLocalPlayer) {
      this.pointerController = new PointerController(stage, player);
      this.pointerController.setOnChange((isShooting, position) => {
        this.isShooting = isShooting;
        this.mousePos = position;
        this.emitShoot();
      });
    }

    gameServer.shoot.on(data => {
      if (data.clientId !== player.id) return;
      if (!this.player.isLocalPlayer) this.isShooting = data.isShooting;

      this.serverStep = data;
    });
  }

  emitShoot() {
    gameServer.shoot.emit({
      isShooting: this.isShooting,
      playerPos: {
        x: this.player.position.x,
        y: this.player.position.y,
      },
      mousePos: this.mousePos,
    });
  }

  shoot() {
    const velocity = this.getVelocity(this.serverStep?.mousePos);
    const bullet = new Bullet(this.player.position.x, this.player.position.y, velocity);

    if (this.player.shoot(bullet)) {
      this.stage.addChild(bullet.sprite);
    }
  }

  private getVelocity(data: XYPosition = this.mousePos) {
    const xRelativeToPlayer = data.x;
    const yRelativeToPlayer = data.y;

    const angle = Math.atan2(yRelativeToPlayer, xRelativeToPlayer);

    const velocityX = Math.cos(angle) * this.player.bulletSpeed;
    const velocityY = Math.sin(angle) * this.player.bulletSpeed;

    return { x: velocityX, y: velocityY };
  }

  update(dt: number) {
    if (this.isShooting) {
      this.shoot();
    }

    this.bullets.forEach(bullet => bullet.update(dt));
  }
}
