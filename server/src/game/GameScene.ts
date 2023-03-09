import { ServerSnapshot } from '../../../shared/types';
import { GameState } from './GameState';
import { TIMESTEP, SNAPSHOT_STEP } from '../../../shared/constants';

export class GameScene {
  public state: GameState;
  private gameLoop?: ReturnType<typeof setInterval>;

  public onSnapshot?: (snapshot: ServerSnapshot) => void;

  constructor() {
    this.state = new GameState();
  }

  public setOnSnapshot(callback: typeof this.onSnapshot) {
    this.onSnapshot = callback;
  }

  startGame() {
    let lastTimestamp = Date.now();

    this.gameLoop = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTimestamp;
      lastTimestamp = now;

      this.state.update(delta);
    }, TIMESTEP);

    setInterval(() => {
      const now = Date.now();

      this.onSnapshot?.({
        timestamp: now,
        state: {
          players: this.state.players,
          enemies: this.state.enemies,
          bullets: this.state.bullets,
        },
      });
    }, SNAPSHOT_STEP);
  }

  stopGame() {
    clearInterval(this.gameLoop);
  }
}
