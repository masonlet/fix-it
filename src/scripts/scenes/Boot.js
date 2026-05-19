import { Scene } from "phaser";
import { YouTubePlayables } from '../YouTubePlayables';

export class Boot extends Scene {
  constructor () {
    super('Boot');
  }

  async create () {
    try {
      const data = await YouTubePlayables.withTimeout(YouTubePlayables.loadData(), 1000);
      if (data) this.registry.set('highScore', data.highScore || 0);
    }
    catch (error) {
      console.error('Could not load saved data:', error);
    }

    YouTubePlayables.setOnPause(() => {
      this.game.pause();
    });

    YouTubePlayables.setOnResume(() => {
      this.game.resume();
    });

    this.scene.start('Preloader');
  }
}
