// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { Enemy } from '@/components/Enemy';
// import { MAP_HEIGHT, MAP_WIDTH } from '@/constants';
import { gameServer } from '@/networking/GameServer';
import { log } from '@/utils/logAction';
import { GetPlayersEvent, GetWorldStateEvent } from '../../../shared/types/events';
import { Player } from './Player';
import * as PIXI from 'pixi.js';

export class GameState {
  public players: Player[] = [];
  public enemies: Enemy[] = [];

  constructor(private stage: PIXI.Container) {
    console.log('GameState.initialize');
    gameServer.getPlayers.on(data => {
      this.updatePlayersFromServer(data);
    });

    gameServer.getWorldState.on(data => {
      this.movePlayers(data);
    });

    // gameServer.getWorldObjects.on(data => {
    //   console.log(data);
    //   this.buildWorld(data);
    // });

    gameServer.createPlayer.emit();
    // gameServer.getWorldObjects.emit();

    Array.from(Array(10)).forEach((_, index) => {
      this.addEnemy(400, 200 + index * 100);
    });

    document.getElementById('loading')?.remove();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public addEnemy(x: number, y: number) {
    // const newEnemy = new Enemy(this.stage, this, x, y);
    // this.enemies.push(newEnemy);
  }

  public getPlayerCount() {
    return this.players.length;
  }

  public addPlayer(id: string, x: number, y: number) {
    log(`Player ${id} connected`);
    this.players.push(new Player(this.stage, x, y, id));
  }

  public removePlayer(id: string) {
    const foundPlayer = this.players.find(player => player.id === id);

    if (foundPlayer) {
      log(`Player ${id} disconnected`);
      foundPlayer.destroy(true);
      this.players = this.players.filter(p => p.id !== id);
    }
  }

  public updatePlayers(delta: number) {
    this.players.forEach(player => {
      player.update(delta);
    });
  }

  public updateEnemies(delta: number) {
    this.enemies.forEach(enemy => {
      enemy.update(delta);
    });
  }

  public updatePlayersFromServer(data: GetPlayersEvent) {
    this.players.forEach(localPlayer => {
      if (!data.find(serverPlayer => localPlayer.id === serverPlayer.clientId)) {
        this.removePlayer(localPlayer.id);
      }
    });

    data.forEach(serverPlayer => {
      const foundPlayer = this.players.find(
        localPlayer => localPlayer.id === serverPlayer.clientId
      );

      if (!foundPlayer) {
        this.addPlayer(serverPlayer.clientId, serverPlayer.x, serverPlayer.y);
      }
    });

    console.log('serverPlayers', data);
    console.log('localPlayers', this.players);
  }

  public movePlayers(data: GetWorldStateEvent) {
    data.state.players.forEach(object => {
      const foundPlayer = this.players.find(player => player.id === object.clientId);
      foundPlayer?.setMovement(data.timestamp, object);
    });
  }

  // public buildWorld(data: ServerObject[]) {
  //   data.forEach(object => {
  //     const wall = this.stage.addChild.fromVertices(
  //       object.position.x,
  //       object.position.y,
  //       object.vertices,
  //       {
  //         isStatic: object.isStatic,
  //         label: object.label,
  //       }
  //     );

  //     this.world.add(wall);
  //   });
  // }
}
