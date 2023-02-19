import { Scene } from 'phaser';
import { Player } from '@/components/Player';
import { gameServer } from '@/networking/GameServer';

import fireWizardWalkUrl from '@/assets/wizards/fire-wizard/Walk.png';
import fireWizardIdleUrl from '@/assets/wizards/fire-wizard/Idle.png';
import fireWizardFireballUrl from '@/assets/wizards/fire-wizard/Fireball.png';
import fireballUrl from '@/assets/wizards/fire-wizard/Charge.png';
import { log } from '@/utils/logAction';

export class GameScene extends Scene {
  private players: Player[] = [];

  constructor() {
    super('gameScene');
  }

  preload() {
    this.loadSprites();
  }

  create() {
    this.createAnimations();

    gameServer.onPlayersChange.bind(this)(data => {
      console.log('serverPlayers', data);
      console.log('localPlayers', this.players);
      const newPlayers: Player[] = [];

      // this.players.forEach(localPlayer => {
      //   if (!data.find(serverPlayer => localPlayer.id === serverPlayer.id)) {
      //     log(`Player ${localPlayer.id} destroyed`);
      //     localPlayer.destroy(true);
      //   }
      // });

      data.forEach(serverPlayer => {
        if (!this.players.find(localPlayer => localPlayer.id === serverPlayer.id)) {
          log(`Player ${serverPlayer.id} created`);

          newPlayers.push(new Player(this, serverPlayer.x, serverPlayer.y, serverPlayer.id));
        }
      });

      this.players = newPlayers;
    });

    gameServer.onWorldChange(data => {
      data.forEach(object => {
        const foundPlayer = this.players.find(player => player.id === object.id);

        foundPlayer?.setMovement(object.move);
      });
    });

    gameServer.onConnect(() => {
      gameServer.createPlayer();
    });

    gameServer.onPlayerDisconnect(playerId => {
      log(`Player ${playerId} disconnected`);
      this.players = this.players.filter(player => player.id === playerId);
    });
  }

  update(time: number, delta: number) {
    this.players.forEach(player => {
      player.update(delta);
    });
  }

  private loadSprite(key: string, path: string, size = 128) {
    this.load.spritesheet(key, path, {
      frameWidth: size,
      frameHeight: size,
    });
  }

  private loadSprites() {
    this.loadSprite('fire-wizard-walk', fireWizardWalkUrl);
    this.loadSprite('fire-wizard-idle', fireWizardIdleUrl);
    this.loadSprite('fire-wizard-fireball', fireWizardFireballUrl);
    this.loadSprite('fire-ball', fireballUrl, 64);
  }

  private createAnimations() {
    this.anims.create({
      key: 'fire-wizard-idle',
      frames: this.anims.generateFrameNumbers('fire-wizard-idle', {}),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'fire-wizard-fireball',
      frames: this.anims.generateFrameNumbers('fire-wizard-fireball', {}),
      frameRate: 40,
      repeat: -1,
    });

    this.anims.create({
      key: 'fire-wizard-walk',
      frames: this.anims.generateFrameNumbers('fire-wizard-walk', {}),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'fire-ball',
      frames: this.anims.generateFrameNumbers('fire-ball', {}),
      frameRate: 20,
      repeat: 0,
    });
  }
}
