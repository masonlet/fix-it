//import { Scene            } from "phaser";
import { YouTubePlayables } from "../sdk/youTubePlayables.ts";

export class Boot /*extends Scene*/ {
  constructor () {
    super('Boot');
  }

  async create () {
    try {
      const data = await YouTubePlayables.withTimeout(YouTubePlayables.loadData(), 1000) as {highScore?: number } | null;
      if (data) this.registry.set('highScore', data.highScore || 0);
    }
    catch (e) { console.error("Could not load saved data:", e); }

    YouTubePlayables.setOnPause (() => { this.game.pause();  });
    YouTubePlayables.setOnResume(() => { this.game.resume(); });

    this.scene.start("Preloader");
  }
}
