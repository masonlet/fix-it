import { Scene } from 'phaser';

export class Audio {
  private scene: Scene;
  private sounds: Record<string, Phaser.Sound.BaseSound | undefined>;

  constructor (scene: Scene) {
    this.scene = scene;
    this.sounds = {};
  }

  register (key: string, assetKey: string): void {
    this.sounds[key] = this.scene.sound.add(assetKey);
  }

  play (key: string, config?: Phaser.Types.Sound.SoundConfig): Phaser.Sound.BaseSound | undefined {
    this.sounds[key]?.play(config);
    return this.sounds[key];
  }

  stop (key: string): void {
    this.sounds[key]?.stop();
  }

  stopAll (): void {
    Object.values(this.sounds).forEach(s => s?.stop());
  }
}
