import { Enemy } from './components/Enemy';
import { Player } from './components/Player';
import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from '../shared/constants';
import { Circle } from './entities/Circle';
import { Rectangle } from './entities/Rectangle';
import { Entity } from './entities/Entity';
import { CollisionDetector } from './helpers/CollisionDetector';

export class GameEngine<TPlayer extends Player = Player, TEnemy extends Enemy = Enemy> {
  public entities: Set<Rectangle | Circle> = new Set();
  public players: Set<TPlayer> = new Set();
  public enemies: Set<Enemy> = new Set();

  private collisions = new Map<Entity, Set<Entity>>();

  public addEntity(entity: Rectangle | Circle) {
    this.entities.add(entity);
  }

  public removeEntity(entity: Rectangle | Circle) {
    this.entities.delete(entity);
  }

  // Players
  public getPlayerById(id: string | number) {
    return Array.from(this.players).find(player => player.id === id);
  }

  public addPlayer(player: TPlayer) {
    this.players.add(player);
    this.addEntity(player);
  }

  public removePlayer(player: TPlayer | string) {
    let foundPlayer: TPlayer | undefined;

    if (typeof player === 'string') {
      foundPlayer = this.getPlayerById(player);
    } else {
      foundPlayer = player;
    }

    if (foundPlayer) {
      this.players.delete(foundPlayer);
      this.removeEntity(foundPlayer);
    }
  }

  public updatePlayers(dt: number) {
    this.players.forEach(player => player.update(dt));
  }

  // Enemies
  public addEnemy(enemy: TEnemy) {
    this.enemies.add(enemy);
    this.addEntity(enemy);
  }

  public removeEnemy(enemy: TEnemy) {
    this.enemies.delete(enemy);
    this.removeEntity(enemy);
  }

  public updateEnemies(dt: number) {
    this.enemies.forEach(enemy => enemy.update(dt));
  }

  public removeInactiveEntities() {
    this.entities.forEach(entity => {
      if (
        entity.x < 0 ||
        entity.x > MAP_WIDTH_PX ||
        entity.y < 0 ||
        entity.y > MAP_HEIGHT_PX ||
        !entity.isActive
      ) {
        if (entity instanceof Enemy) {
          this.removeEnemy(entity as TEnemy);
        } else if (entity instanceof Player) {
          this.removePlayer(entity as TPlayer);
        }

        this.removeEntity(entity);
      }
    });
  }

  public update(dt: number) {
    this.collisionDetector();
    this.removeInactiveEntities();
    this.updatePlayers(dt);
    this.updateEnemies(dt);
  }

  public collisionDetector() {
    this.entities.forEach(entity => {
      if (!entity.collisionGroup) return;
      const candidates = this.entities;

      entity.isColliding = false;
      candidates.forEach(candidate => {
        if (!candidate.collisionGroup) return;
        if (entity === candidate) return;
        if (entity.collisionGroup === candidate.collisionGroup) return;

        const collision = CollisionDetector.getCollision(entity, candidate);

        if (collision) {
          entity.onCollide?.(candidate, collision);
          entity.isColliding = true;
        }
      });
    });
  }
}
