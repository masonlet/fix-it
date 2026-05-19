export class Audio {
  constructor (scene) {
    this.scene = scene;
    this.sounds = {};
  }

  register (key, assetKey) {
    this.sounds[key] = this.scene.sound.add(assetKey);
  }

  play (key, config) {
    this.sounds[key]?.play(config);
    return this.sounds[key];
  }

  stop (key) {
    this.sounds[key]?.stop();
  }

  stopAll () {
    Object.values(this.sounds).forEach(s => s.stop());
  }
}
