import { gameServer } from '@/networking/GameServer';
import * as PIXI from 'pixi.js';
import { Player } from './Player';
import { PointerController } from './input-controllers/PointerController';
import { Vector2 } from '../../../engine/entities/Vector2';

export class ShootingController {
  private mousePos: Vector2 = { x: 0, y: 0 };
  private pointerController?: PointerController;
  public isShooting = false;

  constructor(private stage: PIXI.Container, private player: Player) {
    if (this.player.isLocalPlayer) {
      this.pointerController = new PointerController(stage, player);
      this.pointerController.setOnChange((isShooting, position) => {
        this.mousePos = position;

        console.log('shooting', isShooting);

        if (isShooting || (this.isShooting && !isShooting)) this.emitShoot(isShooting);
        this.isShooting = isShooting;
      });
    }
  }

  emitShoot(isShooting: boolean) {
    gameServer.shoot.emit({
      isShooting: isShooting,
      playerPos: {
        x: this.player.x,
        y: this.player.y,
      },
      mousePos: this.mousePos,
    });
  }

  public update() {
    const now = Date.now();
    this.player.bullets.forEach(bullet => {
      const dt = (now - bullet.createdTimestamp) / 1000;
      bullet.x = bullet.initialPosition.x + dt * bullet.velocity.x;
      bullet.y = bullet.initialPosition.y + dt * bullet.velocity.y;
    });
  }
}
