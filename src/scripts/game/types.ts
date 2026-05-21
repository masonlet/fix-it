//import { Scene } from "phaser";

export interface ActiveItem {
  paused?:     boolean;
  faults:      number;
  totalFaults: number;
  faultTypes:  string[];
  indicators:  Array<{ insert: /*Phaser.GameObjects.Image*/ }>;
}

export interface GameInitData {
  score?: number;
  time?:  number;
}

export interface SoundInstance {
  isPlaying: boolean;
}

export interface MinigameScene /*extends Scene*/ {
  audio: {
    play(key: string, config?: Record<string, unknown>): unknown;
    stop(key: string): unknown;
    sounds: Record<string, SoundInstance | undefined>;
  };
  onFixComplete?(result: { fixed: boolean; complete: boolean; item: any }): void;
}

export type FrameState = { game: "menu-main"  }
                       | { game: "playing"    }
                       | { game: "game-over"  }
