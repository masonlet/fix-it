
import { registerSound    } from 'web-engine/audio/registry.ts';
import { setMuted         } from 'web-engine/audio/mixer.ts';
import { startLoop        } from 'web-engine/update.ts';
import { YouTubePlayables } from './scripts/sdk/youTubePlayables.ts';
import { WaveDash         } from './scripts/sdk/waveDash.ts';
import { GAME                       } from './scripts/config/game.ts';
import { bootstrapGame              } from './scripts/game/game.ts';
import { loadAssets                 } from './scripts/game/assets.ts';
import { updateFrame, renderFrame   } from "./scripts/game/frame.ts";
import type { FrameState, GameState } from "./scripts/game/types.ts";

const BASE_URL = import.meta.env.BASE_URL;

YouTubePlayables.boot(async () => {
  await WaveDash.boot();
  let highScore: number | null = null;
  try {
    if (WaveDash.isAvailable()) {
      highScore = await WaveDash.loadHighScore();
    } else {
      const data = await YouTubePlayables.loadData() as { highScore?: number } | null;
      highScore = data?.highScore ?? null;
    }
  } catch (e) { console.warn("[main] failed to load high score:", e); }

  const { canvas, ctx } = bootstrapGame();

  await Promise.all([
    registerSound("button",          "assets/audio/button.wav",                    BASE_URL),
    registerSound("click",           "assets/audio/click.wav",                     BASE_URL),
    registerSound("death",           "assets/audio/death.wav",                     BASE_URL),
    registerSound("oof",             "assets/audio/oof.wav",                       BASE_URL),
    registerSound("drag-connect",    "assets/audio/minigames/drag/connect.wav",    BASE_URL),
    registerSound("minigame-fail",   "assets/audio/minigames/fail.wav",            BASE_URL),
    registerSound("pump-complete",   "assets/audio/minigames/pump/complete.wav",   BASE_URL),
    registerSound("pump-down",       "assets/audio/minigames/pump/down.wav",       BASE_URL),
    registerSound("spin-complete",   "assets/audio/minigames/spin/complete.wav",   BASE_URL),
    registerSound("spin-spin",       "assets/audio/minigames/spin/spin.wav",       BASE_URL),
    registerSound("swipe-complete",  "assets/audio/minigames/swipe/complete.wav",  BASE_URL),
    registerSound("swipe-move",      "assets/audio/minigames/swipe/move.wav",      BASE_URL),
    registerSound("tap-button",      "assets/audio/minigames/tap/button.wav",      BASE_URL),
    registerSound("tap-complete",    "assets/audio/minigames/tap/complete.wav",    BASE_URL),
    registerSound("timing-click",    "assets/audio/minigames/timing/click.wav",    BASE_URL),
    registerSound("timing-complete", "assets/audio/minigames/timing/complete.wav", BASE_URL),
  ]);

  const assets = await loadAssets(BASE_URL);

  YouTubePlayables.setAudioChangeCallback((enabled) => setMuted(!enabled));
  setMuted(!YouTubePlayables.isAudioEnabled());

  const gameState: GameState = {
    score:         0,
    lives:         GAME.TUNING.LIVES_START,
    elapsedTime:   0,
    beltSpeed:     1,
    spawnTimer:    0,
    spawnInterval: GAME.TUNING.SPAWN_INTERVAL_START,
    highScore,
    items:         [],
    minigame:      null,
  };

  let frame: FrameState = { game: "menu-main" };

  startLoop(
    (dt) => { frame = updateFrame(canvas, frame, gameState, dt);  },
    (  ) => { renderFrame(ctx, canvas, assets, gameState, frame); },
    { tickRate: "variable" },
  );
});
