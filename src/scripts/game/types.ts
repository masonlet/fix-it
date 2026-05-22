import type { BeltState } from "./conveyorBelt.ts";
import type { DragState   } from "../minigames/dragMinigame.ts";
import type { TapState    } from "../minigames/tapMinigame.ts";
import type { PumpState   } from "../minigames/pumpMinigame.ts";
import type { SpinState   } from "../minigames/spinMinigame.ts";
import type { SwipeState  } from "../minigames/swipeMinigame.ts";
import type { TimingState } from "../minigames/timingMinigame.ts";

export interface Indicator {
  faultType: string;
  fixed:     boolean;
}

export interface ActiveItem {
  paused?:     boolean;
  faults:      number;
  totalFaults: number;
  faultTypes:  string[];
  x:           number;
  y:           number;
  size:        number;
  indicators:  Indicator[];
}

export type InnerMinigame =
  | { type: "drag";   state: DragState   }
  | { type: "tap";    state: TapState    }
  | { type: "pump";   state: PumpState   }
  | { type: "spin";   state: SpinState   }
  | { type: "swipe";  state: SwipeState  }
  | { type: "timing"; state: TimingState }

export interface MinigameState {
  item:     ActiveItem;
  timeLeft: number;
  timeMax:  number;
  inner:    InnerMinigame;
}

export interface GameState {
  elapsedTime:     number;
  score:           number;
  highScore:       number | null;
  lives:           number;
  spawnTimer:      number;
  spawnInterval:   number;
  belt:            BeltState;
  beltSpeed:       number;
  items:           ActiveItem[];
  minigame:        MinigameState | null;
  minigameTimeMax: number;
}

export interface GameOverState {
  isNewHigh:    boolean;
  playHovered:  boolean;
  menuHovered:  boolean;
}

export interface MainMenuState {
  pulseTime:       number;
  gameReadyCalled: boolean;
}

export type FrameState = { game: "menu-main"; ui: MainMenuState | null }
                       | { game: "playing";   ui: null }
                       | { game: "game-over"; ui: GameOverState | null }
