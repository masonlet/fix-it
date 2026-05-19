import { BELT } from "./config/belt.ts";
import { GAME } from "./config/game.ts";
import { MINIGAME } from "./config/minigame.ts";

export class Difficulty {
  update (elapsedTime) {
    return {
      beltSpeed: Math.max(
        BELT.TUNING.SPEED_MIN,
        BELT.TUNING.SPEED_BASE + elapsedTime * BELT.TUNING.SPEED_RAMP_PER_SEC
      ),
      spawnInterval: Math.max(
        GAME.TUNING.SPAWN_INTERVAL_MIN,
        GAME.TUNING.SPAWN_INTERVAL_START - elapsedTime * GAME.TUNING.SPAWN_INTERVAL_RAMP_PER_SEC
      ),
      minigameTimeMax: Math.max(
        MINIGAME.TUNING.TIME_MAX_MIN,
        MINIGAME.TUNING.TIME_MAX_START - elapsedTime * MINIGAME.TUNING.TIME_RAMP_PER_SEC
      ),
    };
  }
}
