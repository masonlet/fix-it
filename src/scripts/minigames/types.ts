import { Scene } from "phaser";

export interface SoundInstance {
  isPlaying: boolean;
}

export interface MinigameScene extends Scene {
  audio: {
    play(key: string, config?: Record<string, unknown>): unknown;
    stop(key: string): unknown;
    sounds: Record<string, SoundInstance | undefined>;
  };
  onFixComplete?(result: { fixed: boolean; complete: boolean; item: any }): void;
}
