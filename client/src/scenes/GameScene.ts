import { Scene } from 'phaser';
import { Player } from '../components/Player';

export class GameScene extends Scene {
  private player;

  constructor() {
    super('gameScene');
  }

  //load assets
  preload() {
    this.loadSprites();
  }

  //init variables, define animations & sounds, and display assets
  create() {
    this.createAnimations();

    this.player = new Player(this, 100, 450);
    this.physics.add.existing(this.player);
    // this.player = this.physics.add.sprite(100, 450, 'fire-wizard-idle');
  }

  //update the attributes of various game objects per game logic
  update() {
    this.player.move();
  }

  private loadSprite(key: string, path: string) {
    this.load.spritesheet(key, new URL(path, import.meta.url).href, {
      frameWidth: 128,
      frameHeight: 128,
    });
  }

  private loadSprites() {
    this.loadSprite('fire-wizard-walk', `../assets/wizards/fire-wizard/walk.png`);
    this.loadSprite('fire-wizard-idle', `../assets/wizards/fire-wizard/idle.png`);
  }

  private createAnimations() {
    this.anims.create({
      key: 'fire-wizard-idle',
      frames: this.anims.generateFrameNumbers('fire-wizard-idle', {}),
      frameRate: 20,
      repeat: -1,
    });

    this.anims.create({
      key: 'fire-wizard-walk',
      frames: this.anims.generateFrameNumbers('fire-wizard-walk', {}),
      frameRate: 20,
      repeat: -1,
    });
  }
}
