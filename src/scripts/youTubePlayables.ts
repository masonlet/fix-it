export const SDKErrorType = Object.freeze({
  UNKNOWN: 'UNKNOWN',
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  INVALID_PARAMS: 'INVALID_PARAMS',
  SIZE_LIMIT_EXCEEDED: 'SIZE_LIMIT_EXCEEDED'
});

interface YTGame {
  SDK_VERSION: string;
  IN_PLAYABLES_ENV: boolean;
  game: {
    firstFrameReady(): void;
    gameReady(): void;
    loadData(): Promise<string>;
    saveData(data: string): Promise<void>;
  };
  engagement: {
    sendScore(score: { value: number }): void;
  };
  system: {
    onPause(callback: () => void): void;
    onResume(callback: () => void): void;
    getLanguage(): Promise<string>;
    isAudioEnabled(): boolean;
    onAudioEnabledChange(callbadck: (enabled: boolean) => void): () => void;
  };
  health: {
    logError(): void;
    logWarning(): void;
  };
}

declare global {
  interface Window {
    ytgame?: YTGame;
  }
}

function getErrorType(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'errorType' in error) {
    const { errorType } = error;
    return typeof errorType === 'string' ? errorType : undefined;
  }
  return undefined;
}

class YouTubePlayablesSdk {
  //  https://developers.google.com/youtube/gaming/playables/reference/sdk#sdk_version
  version = 'unloaded';

  //  https://developers.google.com/youtube/gaming/playables/reference/sdk#in_playables_env
  inPlayablesEnv = false;

  private _ytgameRef: YTGame | null = null;
  private _firstFrameReady: boolean = false;
  private _gameReady: boolean = false;
  private _unsetAudioCallback: (() => void) | undefined = undefined;
  private _language: string = 'unavailable';
  private _data: unknown = null;

  boot(loadedCallback: () => void): void {
    const callback = (): void => {
      const ytgame = window.ytgame;
      if (ytgame) {
        this._ytgameRef     = ytgame;
        this.version        = ytgame.SDK_VERSION;
        this.inPlayablesEnv = ytgame.IN_PLAYABLES_ENV;
      }
      else console.error('YouTube Playables SDK is not available.');
      loadedCallback();
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      callback();
      return;
    };

    const check = (): void => {
      document.removeEventListener('DOMContentLoaded', check, true);
      window.removeEventListener('load', check, true);
      callback();
    };

    if (!document.body) window.setTimeout(check, 20);
    else {
      document.addEventListener('DOMContentLoaded', check, true);
      window.addEventListener('load', check, true);
    };
  }

  firstFrameReady(): void {
    const ytgame = this._ytgameRef;
    if (!ytgame || !this.inPlayablesEnv || this._firstFrameReady) return;
    ytgame.game.firstFrameReady();
    this._firstFrameReady = true;
  }

  gameReady(): void {
    const ytgame = this._ytgameRef;
    if (!ytgame || !this.inPlayablesEnv || this._gameReady) return;
    if (!this._firstFrameReady) {
      console.error('gameReady called before firstFrameReady');
      return;
    }
    ytgame.game.gameReady();
    this._gameReady = true;
  }

  isFirstFrameReady(): boolean {
    return this._firstFrameReady;
  }

  isGameReady(): boolean {
    return this._gameReady;
  }

  isLoaded(): boolean {
    return this._ytgameRef !== null && this.inPlayablesEnv;
  }

  isReady(): boolean {
    return this.isLoaded() && this._firstFrameReady && this._gameReady;
  }

  sendScore(score: number): void {
    if (this.isReady()) {
      try {
        this._ytgameRef?.engagement.sendScore({ value: score });
      }
      catch (e) {
        const errorType = getErrorType(e);
        if (errorType) this.handleError(errorType);
      }
    }
  }

  setOnPause(callback: () => void): void {
    const ytgame = this._ytgameRef;
    if (ytgame && this.inPlayablesEnv) ytgame.system.onPause(callback);
  }

  setOnResume(callback: () => void): void {
    const ytgame = this._ytgameRef;
    if (ytgame && this.inPlayablesEnv) ytgame.system.onResume(callback);
  }

  loadData(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const ytgame = this._ytgameRef;
      if (ytgame && this.inPlayablesEnv) {
        ytgame.game.loadData().then(rawdata => {
          if (rawdata) {
            try {
              const data = JSON.parse(rawdata);
              this._data = data;
              resolve(data);
            }
            catch (e) {
              console.error('Failed to parse loadData');
              this.logError();
              reject(e);
            }
          }
          else resolve(undefined);
        }).catch((e: unknown) => {
          console.error('Failed to loadData');
          const errorType = getErrorType(e);
          if (errorType) this.handleError(errorType);
          this.logError();
          reject(e);
        });
      }
      else resolve(undefined);
    });
  }

  logError(): void {
    const ytgame = this._ytgameRef;
    if (ytgame && this.inPlayablesEnv) ytgame.health.logError();
  }

  logWarning(): void {
    const ytgame = this._ytgameRef;
    if (ytgame && this.inPlayablesEnv) ytgame.health.logWarning();
  }

   hasLoneSurrogates(str: string): boolean {
    //  Find lone high surrogates (D800-DBFF) not followed by a low surrogate (DC00-DFFF)
    const loneHighSurrogate = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])/;

    //  Find lone low surrogates (DC00-DFFF) not preceded by a high surrogate (D800-DBFF)
    const loneLowSurrogate = /(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

    return loneHighSurrogate.test(str) || loneLowSurrogate.test(str);
  }

  saveData(data: unknown): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
      const ytgame = this._ytgameRef;
      if (ytgame && this.inPlayablesEnv) {
        //  Serialize the object to JSON
        const jsonString = JSON.stringify(data);
        if (this.hasLoneSurrogates(jsonString)) console.warn('Lone surrogates found in the JSON string');

        //  Ensure the JSON string is a valid UTF-16 string by replacing lone surrogates
        const validUtf16String = jsonString.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '');

        ytgame.game.saveData(validUtf16String).then(() => {
          resolve(data);
        }).catch((e: unknown) => {
          console.error('Failed to saveData');
          const errorType = getErrorType(e);
          if (errorType) this.handleError(errorType);
          this.logError();
          reject(e);
        });
      }
      else resolve(undefined);
    });
  }

  getData(): unknown {
    return this._data;
  }

  loadLanguage(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const ytgame = this._ytgameRef;
      if (ytgame && this.inPlayablesEnv) {
        ytgame.system.getLanguage().then(language => {
          this._language = language;
          resolve(language);
        }).catch(error => {
          console.error('Failed to getLanguage');
          this.logError();
          reject(error);
        });
      }
      else resolve(this._language);
    });
  }

  getLanguage(): string {
    return this._language;
  }

  isAudioEnabled(): boolean {
    const ytgame = this._ytgameRef;
    if (ytgame && this.inPlayablesEnv) return ytgame.system.isAudioEnabled();
    return true;
  }

  setAudioChangeCallback(callback: (enabled: boolean) => void): void {
    const ytgame = this._ytgameRef;
    if (ytgame && this.inPlayablesEnv) {
      if (this._unsetAudioCallback) this._unsetAudioCallback();
      this._unsetAudioCallback = ytgame.system.onAudioEnabledChange(callback);
    }
  }

  unsetAudioChangeCallback(): void {
    if (this._unsetAudioCallback) {
      this._unsetAudioCallback();
      this._unsetAudioCallback = undefined;
    }
  }

  handleError(errorType: string): string | null {
    let type: string | null = null;

    switch (errorType) {
      case SDKErrorType.UNKNOWN:
        console.error('The error is unknown.');
        type = SDKErrorType.UNKNOWN;
        break;
      case SDKErrorType.API_UNAVAILABLE:
        console.error('The API is temporarily unavailable. Please try again later.');
        type = SDKErrorType.API_UNAVAILABLE;
        break;
      case SDKErrorType.INVALID_PARAMS:
        console.error('The API was called with invalid parameters.');
        type = SDKErrorType.INVALID_PARAMS;
        break;
      case SDKErrorType.SIZE_LIMIT_EXCEEDED:
        console.error('The API was called with parameters exceeding the size limit.');
        type = SDKErrorType.SIZE_LIMIT_EXCEEDED;
        break;
      default:
        console.error('Unhandled error type.');
    }

    return type;
  }

  withTimeout<T>(promise: Promise<T>, timeout = 2000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Operation timed out'));
      }, timeout);

      promise.then(value => {
        clearTimeout(timer);
        resolve(value);
      }).catch((e: unknown) => {
        clearTimeout(timer);
        reject(e);
      });
    });
  }
};

export const YouTubePlayables = new YouTubePlayablesSdk();
