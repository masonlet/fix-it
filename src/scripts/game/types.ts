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
  elapsedTime:  number;
  beltSpeed:     number;
  spawnTimer:    number;
  spawnInterval: number;
  highScore:     number | null;
  items:         ActiveItem[];
  minigame:      null;
}

export type FrameState = { game: "menu-main"  }
                       | { game: "playing"    }
                       | { game: "game-over"  }
