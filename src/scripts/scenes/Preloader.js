import { Scene } from "phaser";
import { YouTubePlayables } from "../YouTubePlayables";
import { WaveDash } from "../WaveDash";

const AUDIO_BASE = "assets/audio/";
const AUDIO = [
  ["sfx-button", "button.wav"],
  ["sfx-oof", "oof.wav"],
  ["sfx-click", "click.wav"],
  ["sfx-death", "death.wav"],
  ["sfx-fail", "minigames/fail.wav"],
  ["sfx-drag-connect", "minigames/drag/connect.wav"],
  ["sfx-tap-complete", "minigames/tap/complete.wav"],
  ["sfx-tap-button", "minigames/tap/button.wav"],
  ["sfx-spin-turn", "minigames/spin/spin.wav"],
  ["sfx-spin-complete", "minigames/spin/complete.wav"],
  ["sfx-pump-down", "minigames/pump/down.wav"],
  ["sfx-pump-complete", "minigames/pump/complete.wav"],
  ["sfx-timing-click", "minigames/timing/click.wav"],
  ["sfx-timing-complete", "minigames/timing/complete.wav"],
  ["sfx-swipe-move", "minigames/swipe/move.wav"],
  ["sfx-swipe-complete", "minigames/swipe/complete.wav"],
];

const IMAGE_BASE = "assets/";
const IMAGES = [
  ["life-icon", "game/life.png"],
  ["belt-tile", "game/belt.png"],
  ["rectangle-border", "game/rectangle-border.png"],
  ["rectangle-insert", "game/rectangle-insert.png"],
  ["square-border", "game/square-border.png"],
  ["square-insert", "game/square-insert.png"],
  ["item-background", "items/background.png"],
  ["item-toaster", "items/toaster.png"],
  ["item-walkie", "items/walkie.png"],
  ["item-tire", "items/tire.png"],
  ["item-pipe", "items/pipe.png"],
  ["item-light", "items/light.png"],
  ["item-gauge", "items/gauge.png"],
  ["drag-background", "minigames/drag/background.png"],
  ["drag-plug", "minigames/drag/plug.png"],
  ["drag-socket", "minigames/drag/socket.png"],
  ["tap-walkie", "minigames/tap/walkie-close.png"],
  ["pump-body", "minigames/pump/body.png"],
  ["spin-pipe", "minigames/spin/pipe.png"],
  ["spin-valve", "minigames/spin/valve.png"],
  ["swipe-light", "minigames/swipe/light.png"],
  ["swipe-bulb", "minigames/swipe/bulb.png"],
  ["swipe-bulb-insert", "minigames/swipe/bulb-insert.png"],
  ["timing-gauge", "minigames/timing/gauge.png"],
];

export class Preloader extends Scene {
  constructor () {
    super("Preloader");
  }

  init () {
    YouTubePlayables.firstFrameReady();
  }

  preload () {
    AUDIO.forEach(([key, path]) => this.load.audio(key, AUDIO_BASE + path));
    IMAGES.forEach(([key, path]) => this.load.image(key, IMAGE_BASE + path));
  }

  async create () {
    let saved = null;
    try {
      if (WaveDash.isAvailable()) {
        saved = await WaveDash.loadHighScore();
      } else {
        const data = await YouTubePlayables.loadData();
        saved = data?.highScore ?? null;
      }
    } catch (e) {
      console.warn('[Preloader] failed to load high score:', e);
    }
    if (saved) this.registry.set("highScore", saved);

    this.scene.start("MainMenu");
  }
}
