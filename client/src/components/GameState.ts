import { Enemy } from '@/components/Enemy';
import { gameServer } from '@/networking/GameServer';
import { log } from '@/utils/logAction';
import { GetPlayersEvent, GetWorldStateEvent } from '../../../shared/types/events';
import { Player } from './Player';
import * as PIXI from 'pixi.js';
import { GameEngine } from '../../../engine/GameEngine';
import { Rectangle } from '../../../engine/entities/Rectangle';
import { Circle } from '../../../engine/entities/Circle';
import { ServerBullet, ServerEnemy } from '../../../shared/types';
import { Bullet } from '@/components/Bullet';

export class GameState {
  private drawableEntities: Map<Rectangle | Circle, PIXI.Container> = new Map();
  private engine: GameEngine<Player, Enemy, Bullet>;

  constructor(private stage: PIXI.Container) {
    this.engine = new GameEngine<Player, Enemy, Bullet>();

    gameServer.playerConnected.on(data => {
      this.updatePlayersFromServer(data);
    });

    gameServer.getWorldState.on(data => {
      this.movePlayers(data);
      this.addEnemies(data.state.enemies);
      this.addBullets(data.state.bullets);
    });

    gameServer.addEnemies.on(data => {
      this.addEnemies(data.data);
    });

    // Add player on server
    gameServer.playerConnected.emit();
  }

  public addPlayer(player: Player) {
    this.engine.addPlayer(player);

    log(`Player ${player.id} connected`);
  }

  public addEnemies(enemies: ServerEnemy[]) {
    enemies.forEach(enemy => {
      const newEnemy = new Enemy(
        this.stage,
        this.engine,
        enemy.position.x,
        enemy.position.y,
        enemy.id
      );

      this.engine.addEnemy(newEnemy);
    });
  }

  public addBullets(bullets: ServerBullet[]) {
    bullets.forEach(bullet => {
      const newBullet = new Bullet(
        bullet.position.x,
        bullet.position.y,
        bullet.velocity,
        bullet.created,
        bullet.playerId,
        bullet.id
      );
      const player = this.engine.getPlayerById(bullet.playerId);
      player?.bullets.add(newBullet);

      this.engine.addBullet(newBullet);
    });
  }

  public removePlayer(player: Player) {
    this.engine.removePlayer(player.id);

    log(`Player ${player.id} disconnected`);
  }

  public updatePlayersFromServer(data: GetPlayersEvent) {
    this.engine.players.forEach(localPlayer => {
      if (!data.find(serverPlayer => localPlayer.id === serverPlayer.clientId)) {
        this.removePlayer(localPlayer);
      }
    });

    data.forEach(serverPlayer => {
      const {
        clientId,
        position: { x, y },
      } = serverPlayer;
      const foundPlayer = this.engine.getPlayerById(clientId);

      if (!foundPlayer) {
        const player = new Player(this.stage, this.engine, x, y, clientId);
        this.addPlayer(player);
      }
    });
  }

  public movePlayers(data: GetWorldStateEvent) {
    data.state.players.forEach(object => {
      const foundPlayer = this.engine.getPlayerById(object.clientId);
      foundPlayer?.setMovement(data.timestamp, object);
    });
  }

  // public moveEnemies(data: GetWorldStateEvent) {
  //   data.state.enemies.forEach(object => {
  //     // const foundEnemy = this.engine.enemies.get(object.id);
  //     // foundEnemy?.setMovement(data.timestamp, object);
  //   });
  // }

  update(dt: number) {
    // TODO is this the right order?
    this.drawDebugBounds();
    this.engine.update(dt);
  }

  private drawDebugBounds() {
    this.engine.entities.forEach(entity => {
      const { x, y, anchor, id } = entity;
      if (this.drawableEntities.has(entity)) return;

      // If sprite not drawn yet
      const boundsContainer = new PIXI.Container();
      const bounds = new PIXI.Graphics();
      const anchorPoint = new PIXI.Graphics();
      bounds.lineStyle(1, 0xffffff);

      if (entity instanceof Rectangle) {
        bounds.drawRect(0, 0, entity.width, entity.height);
      } else if (entity instanceof Circle) {
        bounds.drawCircle(0, 0, entity.radius);
      }

      anchorPoint.lineStyle(1, 0xbf40bf);
      anchorPoint.beginFill(0xbf40bf);
      anchorPoint.drawCircle(0, 0, 2);
      anchorPoint.position.set(anchor.x, anchor.y);
      anchorPoint.endFill();
      boundsContainer.position.set(x, y);

      const idText = new PIXI.Text(id);
      idText.position.set(0, -16);
      idText.style.fontSize = 12;

      boundsContainer.addChild(bounds);
      boundsContainer.addChild(anchorPoint);
      boundsContainer.addChild(idText);

      this.stage.addChild(boundsContainer);

      this.drawableEntities.set(entity, boundsContainer);
    });

    for (const [entity, spriteContainer] of this.drawableEntities) {
      const { x, y } = entity;

      if (!entity.isActive) {
        spriteContainer.destroy();
        this.drawableEntities.delete(entity);
        continue;
      }

      spriteContainer.position = { x: x, y: y };

      // Draw red if colliding
      const bounds = spriteContainer.children[0] as PIXI.Graphics;

      // if is colliding and is not red
      if (entity.isColliding && bounds.line.color === 16777215) {
        bounds.lineStyle(1, 0xff0000);
        if (entity instanceof Rectangle) {
          bounds.drawRect(0, 0, entity.width, entity.height);
        } else if (entity instanceof Circle) {
          bounds.drawCircle(0, 0, entity.radius);
        }
      } else if (!entity.isColliding && bounds.line.color !== 16777215) {
        bounds.lineStyle(1, 0xffffff);
        if (entity instanceof Rectangle) {
          bounds.drawRect(0, 0, entity.width, entity.height);
        } else if (entity instanceof Circle) {
          bounds.drawCircle(0, 0, entity.radius);
        }
      }
    }
  }
}
