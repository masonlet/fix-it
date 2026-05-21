import { YouTubePlayables } from './scripts/sdk/youTubePlayables.ts';
import { WaveDash         } from './scripts/sdk/waveDash.ts';
import { Boot      } from './scripts/scenes/boot.ts';
import { Preloader } from './scripts/scenes/preloader.ts';
import { MainMenu  } from './scripts/scenes/mainMenu.ts';
import { Game      } from './scripts/scenes/game.ts';
import { GameOver  } from './scripts/scenes/gameOver.ts';

/*const config = {
  type: Phaser.AUTO,
  parent: 'gameParent',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    Boot,
    Preloader,
    MainMenu,
    Game,
    GameOver
  ],
  pixelArt: true,
};*/

YouTubePlayables.boot(async () => {
  //const game = new Phaser.Game(config);
  await WaveDash.boot();

  const applyAudioState = (enabled: boolean) => { /*game.sound.mute = !enabled;*/ }
  applyAudioState(YouTubePlayables.isAudioEnabled());
  YouTubePlayables.setAudioChangeCallback(applyAudioState);

  //return game;
});
