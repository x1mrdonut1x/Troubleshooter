import { gameServer } from '@/networking/GameServer';
import { Player as EnginePlayer } from '../../../engine/components/Player';
import { ServerPlayer } from '../../../shared/types';
import { BulletController } from './BulletController';
import { MovementController } from './MovementController';
import * as PIXI from 'pixi.js';
import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from '../../../shared/constants';
import { GameEngine } from '../../../engine/GameEngine';

export class Player extends EnginePlayer {
  protected bulletController?: BulletController;
  protected movementController?: MovementController;
  public isLocalPlayer;

  constructor(
    private stage: PIXI.Container,
    engine: GameEngine,
    x: number,
    y: number,
    public id: string | number
  ) {
    super(engine, x, y, id);

    this.isLocalPlayer = id === gameServer?.clientId;

    this.movementController = new MovementController(this);
    this.bulletController = new BulletController(stage, this);
  }

  update(dt: number) {
    this.bulletController?.update(dt);
    this.movementController?.update(dt);

    // Camera controller
    if (this.isLocalPlayer) {
      const nextX = this.x - window.innerWidth / 2;
      const nextY = this.y - window.innerHeight / 2;

      if (
        nextX > 0 &&
        (this.stage.pivot.x >= 0 || nextX > this.stage.pivot.x) &&
        (this.stage.pivot.x + window.innerWidth <= MAP_WIDTH_PX || nextX < this.stage.pivot.x)
      ) {
        this.stage.pivot.x = nextX;
      }

      if (
        nextY > 0 &&
        (this.stage.pivot.y >= 0 || nextY > this.stage.pivot.y) &&
        (this.stage.pivot.y + window.innerHeight <= MAP_HEIGHT_PX || nextY < this.stage.pivot.y)
      ) {
        this.stage.pivot.y = nextY;
      }
    }

    super.update(dt);
  }

  public setMovement(timestamp: number, position: ServerPlayer) {
    if (!this.isLocalPlayer) this.setVelocityFromMovement(position.move);
    this.movementController?.updatePositionFromServer(timestamp, position.position);
  }
}
