import { Enemy } from '@/components/Enemy';
import { gameServer } from '@/networking/GameServer';
import { log } from '@/utils/logAction';
import { GetPlayersEvent, GetWorldStateEvent } from '../../../shared/types/events';
import { Player } from './Player';
import * as PIXI from 'pixi.js';
import { GameEngine } from '../../../engine/GameEngine';
import { Rectangle } from '../../../engine/entities/Rectangle';
import { Circle } from '../../../engine/entities/Circle';

export class GameState extends GameEngine<Player, Enemy> {
  private drawableEntities: Map<Rectangle | Circle, PIXI.Container> = new Map();

  constructor(private stage: PIXI.Container) {
    super();
    console.log('GameState.initialize');
    gameServer.getPlayers.on(data => {
      this.updatePlayersFromServer(data);
    });

    gameServer.getWorldState.on(data => {
      this.movePlayers(data);
    });

    gameServer.createPlayer.emit();

    Array.from(Array(10)).forEach((_, index) => {
      const enemy = new Enemy(this.stage, this, 200, 100 + index * 100);
      this.addEnemy(enemy);
    });
  }

  public addEnemy(enemy: Enemy) {
    super.addEnemy(enemy);
  }

  public addPlayer(player: Player) {
    super.addPlayer(player);

    log(`Player ${player.id} connected`);
  }

  public removePlayer(player: Player) {
    super.removePlayer(player);

    log(`Player ${player.id} disconnected`);
  }

  public updatePlayersFromServer(data: GetPlayersEvent) {
    this.players.forEach(localPlayer => {
      if (!data.find(serverPlayer => localPlayer.id === serverPlayer.clientId)) {
        this.removePlayer(localPlayer);
      }
    });

    data.forEach(serverPlayer => {
      const {
        clientId,
        position: { x, y },
      } = serverPlayer;
      const foundPlayer = this.getPlayerById(clientId);

      if (!foundPlayer) {
        const player = new Player(this.stage, this, x, y, clientId);
        this.addPlayer(player);
      }
    });
  }

  public movePlayers(data: GetWorldStateEvent) {
    data.state.players.forEach(object => {
      const foundPlayer = this.getPlayerById(object.clientId);
      foundPlayer?.setMovement(data.timestamp, object);
    });
  }

  update(dt: number) {
    // TODO is this the right order?
    this.drawDebugBounds();
    this.removeInactiveEntities();

    this.collisionDetector();

    this.updatePlayers(dt);
    this.updateEnemies(dt);
  }

  private drawDebugBounds() {
    this.entities.forEach(entity => {
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
