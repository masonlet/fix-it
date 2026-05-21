import type { BeltState } from "./conveyorBelt.ts";

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

export interface GameState {
  score:         number;
  lives:         number;
  elapsedTime:   number;
  belt:          BeltState;
  beltSpeed:     number;
  spawnTimer:    number;
  spawnInterval: number;
  highScore:     number | null;
  items:         ActiveItem[];
  minigame:      null;
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
