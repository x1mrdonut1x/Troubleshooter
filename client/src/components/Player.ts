import { Physics, Scene, Types } from 'phaser';
import { ServerMovement } from '../../../types';
import { gameServer } from '../networking/GameServer';
import { Bullet } from './Bullet';
import { isEqual } from 'lodash';

interface Keys {
  [keyCode: string]: {
    key: Phaser.Input.Keyboard.Key;
    onDown: () => void;
    onUp: () => void;
  };
}

const defaultMovement: ServerMovement = {
  left: false,
  right: false,
  up: false,
  down: false,
  dx: 0,
  dy: 0,
};

export class Player extends Physics.Arcade.Sprite {
  private localMovement = { ...defaultMovement };
  private serverMovement = { ...defaultMovement };
  private readonly speed = 200;
  private readonly keys: Keys = {};
  private bullets;

  private isShooting = false;
  private lastMousePosition: { x: number; y: number } = { x: 0, y: 0 };

  constructor(scene: Scene, x: number, y: number, public id: string) {
    super(scene, x, y, 'fireWizard');

    this.bullets = scene.add.group({ classType: Bullet, runChildUpdate: true });

    scene.physics.add.existing(this);
    scene.sys.displayList.add(this);
    scene.sys.updateList.add(this);

    this.scene.input.on('pointerdown', (pointer: PointerEvent) => {
      this.lastMousePosition = { x: pointer.x, y: pointer.y };
      this.isShooting = true;
    });

    this.scene.input.on('pointermove', (pointer: PointerEvent) => {
      this.lastMousePosition = { x: pointer.x, y: pointer.y };
    });

    this.scene.input.on('pointerup', (pointer: PointerEvent) => {
      this.isShooting = false;
    });

    if (this.id === gameServer.clientId) {
      this.initKeyboard();
    }
  }

  shoot() {
    const rotation = Math.atan2(
      this.lastMousePosition.y - this.y,
      this.lastMousePosition.x - this.x
    );
    const bullet = this.bullets.get();

    if (bullet) {
      bullet.fire(this.x, this.y, rotation);
    }
  }

  updateBullets(): void {
    if (this.isShooting) {
      this.shoot();
    }
  }

  private initKeyboard() {
    this.keys['W'] = {
      key: this.scene.input.keyboard.addKey('W'),
      onDown: () => this.onMoveUp(),
      onUp: () => {
        if (this.keys['S'].key.isDown) {
          this.onMoveDown();
        } else {
          this.localMovement.dy = 0;
        }
      },
    };

    this.keys['S'] = {
      key: this.scene.input.keyboard.addKey('S'),
      onDown: () => this.onMoveDown(),
      onUp: () => {
        if (this.keys['W'].key.isDown) {
          this.onMoveUp();
        } else {
          this.localMovement.dy = 0;
        }
      },
    };

    this.keys['A'] = {
      key: this.scene.input.keyboard.addKey('A'),
      onDown: () => this.onMoveLeft(),
      onUp: () => {
        if (this.keys['D'].key.isDown) {
          this.onMoveRight();
        } else {
          this.localMovement.dx = 0;
        }
      },
    };

    this.keys['D'] = {
      key: this.scene.input.keyboard.addKey('D'),
      onDown: () => this.onMoveRight(),
      onUp: () => {
        if (this.keys['A'].key.isDown) {
          this.onMoveLeft();
        } else {
          this.localMovement.dx = 0;
        }
      },
    };
  }

  private onMoveRight() {
    this.localMovement.left = false;
    this.localMovement.right = true;
    this.localMovement.dx = this.speed;
    this.flipX = false;
  }

  private onMoveLeft() {
    this.localMovement.left = true;
    this.localMovement.right = false;
    this.localMovement.dx = -this.speed;
    this.flipX = true;
  }

  private onMoveUp() {
    this.localMovement.up = true;
    this.localMovement.down = false;
    this.localMovement.dy = -this.speed;
  }

  private onMoveDown() {
    this.localMovement.up = false;
    this.localMovement.down = true;
    this.localMovement.dy = this.speed;
  }

  public setMovement(movement?: ServerMovement) {
    if (movement) {
      this.serverMovement = movement;
    }
  }

  public move() {
    Object.keys(this.keys).forEach(key => {
      const entry = this.keys[key];

      if (Phaser.Input.Keyboard.JustDown(entry.key)) {
        entry.onDown();
      } else if (Phaser.Input.Keyboard.JustUp(entry.key)) {
        entry.onUp();
      }
    });

    if (Object.values(this.keys).some(value => value.key.isDown)) {
      this.anims.play('fire-wizard-walk', true);
    } else {
      this.anims.play('fire-wizard-idle', true);
    }

    this.setVelocityX(this.serverMovement.dx || 0);
    this.setVelocityY(this.serverMovement.dy || 0);

    if (this.id === gameServer.clientId) {
      if (!isEqual(this.localMovement, this.serverMovement))
        gameServer.movePlayer(this.localMovement);
    }
  }
}
