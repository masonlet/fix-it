import { GAME    } from "../config/game.ts";
import { BELT    } from "../config/belt.ts";
import { MINIGAME } from "../config/minigame.ts";
import { wasPointerClicked, pointerX, pointerY } from "web-engine/input/pointer.ts";
import { playSound } from "web-engine/audio/playback.ts";
import { getDifficulty                              } from "./difficulty.ts";
import { updateBelt, renderBelt                     } from "./conveyorBelt.ts";
import { spawnItem, moveItems, getItemAt, removeItem, renderItems } from "./itemSpawner.ts";
import { updateMinigame, openMinigame, renderMinigame } from "./minigameManager.ts";
import { renderHud                                  } from "./hud.ts";
import type { GameAssets } from "./assets.ts";
import type { GameState  } from "./types.ts";


export function resetPlayState(gameState: GameState): void {
  gameState.score           = 0;
  gameState.lives           = GAME.TUNING.LIVES_START;
  gameState.elapsedTime     = 0;
  gameState.beltSpeed       = BELT.TUNING.SPEED_BASE;
  gameState.spawnTimer      = 0;
  gameState.spawnInterval   = GAME.TUNING.SPAWN_INTERVAL_START;
  gameState.items           = [];
  gameState.minigame        = null;
  gameState.minigameTimeMax = MINIGAME.TUNING.TIME_MAX_START;
  gameState.belt            = { offsetX: 0 };
}

export function updatePlayState(
  gameState: GameState,
  assets:    GameAssets,
  dt:        number,
  w:         number,
  h:         number,
): boolean {
  if (gameState.minigame) {
    updateMinigame(gameState, dt, (item) => {
      gameState.score += GAME.TUNING.SCORE_PER_FIX * item.totalFaults;
      removeItem(gameState, item);
    });
    return false;
  }

  updateBelt(gameState.belt, gameState.beltSpeed, w, dt);

  gameState.spawnTimer += dt;
  if (gameState.spawnTimer >= gameState.spawnInterval) {
    gameState.spawnTimer = 0;
    spawnItem(gameState, gameState.elapsedTime, w, h);
  }

  const missed = moveItems(gameState, gameState.beltSpeed, w, dt);
  if (missed > 0) {
    playSound("oof");
    gameState.lives = Math.max(0, gameState.lives - missed);
    if (gameState.lives <= 0) return true;
  }

  if (wasPointerClicked()) {
    const item = getItemAt(gameState.items, pointerX(), pointerY());
    if (item) openMinigame(gameState, item, assets, w, h);
  }

  gameState.elapsedTime += dt;

  const d = getDifficulty(gameState.elapsedTime);
  gameState.beltSpeed       = d.beltSpeed;
  gameState.spawnInterval   = d.spawnInterval;
  gameState.minigameTimeMax = d.minigameTimeMax;

  return false;
}

export function renderPlayState(
  ctx:       CanvasRenderingContext2D,
  gameState: GameState,
  assets:    GameAssets,
  w:         number,
  h:         number,
): void {
  renderBelt(ctx, gameState.belt, assets.game.belt, w, h);
  renderItems(ctx, gameState.items, assets);
  if (gameState.minigame) renderMinigame(ctx, gameState, assets, w, h);
  renderHud(ctx, w, gameState.lives, gameState.score, assets.game.life);
}
