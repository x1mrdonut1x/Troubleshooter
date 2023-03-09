import { Enemy } from './components/Enemy';
import { Player } from './components/Player';
import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from '../shared/constants';
import { Circle } from './entities/Circle';
import { Rectangle } from './entities/Rectangle';
import { CollisionDetector } from './helpers/CollisionDetector';
import { EntityId } from '../shared/types';
import { Bullet } from './components/Bullet';

export class GameEngine<
  TPlayer extends Player = Player,
  TEnemy extends Enemy = Enemy,
  TBullet extends Bullet = Bullet
> {
  public entities: Map<EntityId, Rectangle | Circle> = new Map();
  public players: Map<EntityId, TPlayer> = new Map();
  public enemies: Map<EntityId, TEnemy> = new Map();
  public bullets: Map<EntityId, TBullet> = new Map();

  public addEntity(entity: Rectangle | Circle) {
    if (this.entities.has(entity.id)) return;

    this.entities.set(entity.id, entity);
  }

  public removeEntity(id: EntityId) {
    this.entities.delete(id);
  }

  // Players
  public getPlayerById(id: EntityId) {
    return this.players.get(id);
  }

  public addPlayer(player: TPlayer) {
    if (this.players.has(player.id)) return;

    this.players.set(player.id, player);
    this.addEntity(player);
  }

  public removePlayer(id: EntityId) {
    this.players.delete(id);
    this.removeEntity(id);
  }

  public updatePlayers(dt: number) {
    this.players.forEach(player => player.update(dt));
  }

  // Enemies
  public addEnemy(enemy: TEnemy) {
    if (this.enemies.has(enemy.id)) return;

    this.enemies.set(enemy.id, enemy);
    this.addEntity(enemy);
  }

  public removeEnemy(id: EntityId) {
    this.enemies.delete(id);
    this.removeEntity(id);
  }

  public updateEnemies(dt: number) {
    this.enemies.forEach(enemy => enemy.update(dt));
  }

  // Bullets
  public addBullet(bullet: TBullet) {
    if (this.bullets.has(bullet.id)) return;

    this.bullets.set(bullet.id, bullet);
    this.addEntity(bullet);
  }

  public removeBullet(id: EntityId) {
    // TODO? maybe remove bullet from player here
    this.bullets.delete(id);
    this.removeEntity(id);
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
          this.removeEnemy(entity.id);
        } else if (entity instanceof Player) {
          this.removePlayer(entity.id);
        } else if (entity instanceof Bullet) {
          this.removeBullet(entity.id);
        } else {
          this.removeEntity(entity.id);
        }
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
