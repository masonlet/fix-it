import { MINIGAME_TYPES  } from "./minigameTypes.ts";
import type { GameAssets } from "../game/assets.ts";

export const ITEM_SPRITES: Partial<Record<string, keyof GameAssets["items"]>> = {
  [MINIGAME_TYPES.DRAG]:   "toaster",
  [MINIGAME_TYPES.TAP]:    "walkie",
  [MINIGAME_TYPES.PUMP]:   "tire",
  [MINIGAME_TYPES.SPIN]:   "pipe",
  [MINIGAME_TYPES.SWIPE]:  "light",
  [MINIGAME_TYPES.TIMING]: "gauge",
};
