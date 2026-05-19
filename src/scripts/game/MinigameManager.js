import { DEPTH } from "../config/depth.ts";
import { POPUP } from "../config/popup.ts";
import { TIMER } from "../config/timer.ts";
import { INDICATOR } from "../config/indicator.ts";

import { MINIGAME } from "../config/minigame.ts";
import { MINIGAME_TYPES } from "../config/minigameTypes.ts";

import { TapMinigame } from "../minigames/TapMinigame";
import { PumpMinigame } from "../minigames/PumpMinigame";
import { DragMinigame } from "../minigames/dragMinigame.ts";
import { SpinMinigame } from "../minigames/spinMinigame.ts";
import { SwipeMinigame } from "../minigames/swipeMinigame.ts";
import { TimingMinigame } from "../minigames/TimingMinigame";

const MINIGAMES = {
  [MINIGAME_TYPES.TAP]: TapMinigame,
  [MINIGAME_TYPES.PUMP]: PumpMinigame,
  [MINIGAME_TYPES.DRAG]: DragMinigame,
  [MINIGAME_TYPES.SPIN]: SpinMinigame,
  [MINIGAME_TYPES.SWIPE]: SwipeMinigame,
  [MINIGAME_TYPES.TIMING]: TimingMinigame,
};

export class MinigameManager {
  constructor (scene) {
    this.scene = scene;
    this.timeMax  = MINIGAME.TUNING.TIME_MAX_START;
    this.timeLeft = 0;
    this.activeItem      = null;
    this.currentMinigame = null;
    this.overlay    = null;
    this.popup      = null;
    this.timerBarBg = null;
    this.timerBar   = null;
  }

  get isActive () {
    return this.activeItem !== null;
  }

  open (item) {
    const { width, height } = this.scene.scale;
    this.activeItem = item;
    this.scene.audio.play('click');
    item.paused = true;

    // Overlay
    this.overlay = this.scene.add.rectangle(
      width / 2, height / 2, width, height,
      POPUP.COLOUR.OVERLAY_FILL, POPUP.COLOUR.OVERLAY_ALPHA
    ).setDepth(DEPTH.OVERLAY);

    // Timer
    const barWidth = width * TIMER.LAYOUT.BAR_WIDTH_PCT;
    const barHeight = height * TIMER.LAYOUT.BAR_HEIGHT_PCT;
    const barYOffset = height * TIMER.LAYOUT.BAR_Y_OFFSET_PCT;
    this.timerBarBg = this.scene.add.rectangle(
      width / 2, height - barYOffset,
      barWidth, barHeight,
      TIMER.COLOUR.BG_FILL
    ).setStrokeStyle(TIMER.LAYOUT.BAR_STROKE_WIDTH, TIMER.COLOUR.BG_STROKE)
     .setDepth(DEPTH.TIMER_BG);

    this.timerBar = this.scene.add.rectangle(
      width / 2 - barWidth / 2, height - barYOffset,
      barWidth, barHeight,
      TIMER.COLOUR.BAR_FILL
    ).setOrigin(0, 0.5).setDepth(DEPTH.TIMER_BAR);

    // Minigame
    const minigameType = item.faultTypes[item.totalFaults - item.faults];
    const MinigameClass = MINIGAMES[minigameType];
    if (!MinigameClass) throw new Error("Invalid minigame type");
    if (MinigameClass.useDefaultPopup !== false) {
      // Popup
      this.popup = this.scene.add.rectangle(
        width / 2, height / 2,
        width * POPUP.LAYOUT.WIDTH_PCT, height * POPUP.LAYOUT.HEIGHT_PCT,
        POPUP.COLOUR.FILL
      ).setDepth(DEPTH.POPUP)
      .setStrokeStyle(POPUP.LAYOUT.STROKE_WIDTH, POPUP.COLOUR.STROKE);
    }

    this.currentMinigame = new MinigameClass(
      this.scene,
      width / 2, height / 2,
      () => this.fix(),
      () => this.fail()
    );

    this.timeLeft = this.timeMax;
  }

  update (delta) {
    if (!this.activeItem || this.timeLeft <= 0) return;
    if (this.currentMinigame?.update) this.currentMinigame.update(delta);
    if (!this.activeItem) return;

    this.timeLeft -= delta / 1000;
    const pct = Math.max(0, this.timeLeft / this.timeMax);
    this.timerBar.setScale(pct, 1);

    if (this.timeLeft <= 0) {
      this.fail();
      return { failed: true };
    }

    return null;
  }

  fix () {
    if (!this.activeItem) return;

    const item = this.activeItem;
    item.faults--;

    const fixedIndex = item.totalFaults - item.faults - 1;
    if (item.indicators[fixedIndex]) item.indicators[fixedIndex].insert.setTint(INDICATOR.COLOUR.FIXED);

    const result = { fixed: true, complete: item.faults <= 0, item };
    if (!result.complete) item.paused = false;
    else if (this.scene.onFixComplete) this.scene.onFixComplete(result);

    this.close();
    return result;
  }

  fail () {
    if (!this.activeItem) return;
    this.scene.audio.play("fail");
    this.activeItem.paused = false;
    this.close();
  }

  close () {
    this.overlay.destroy();
    this.popup?.destroy();
    this.popup = null;
    this.timerBarBg.destroy();
    this.timerBar.destroy();
    this.activeItem = null;
    if (this.currentMinigame) {
      this.currentMinigame.destroy();
      this.currentMinigame = null;
    }
  }

  handleResize (width, height) {
    if (!this.activeItem) return;
    const barWidth = width * TIMER.LAYOUT.BAR_WIDTH_PCT;
    const barHeight = height * TIMER.LAYOUT.BAR_HEIGHT_PCT;
    const barYOffset = height * TIMER.LAYOUT.BAR_Y_OFFSET_PCT;
    this.overlay.setPosition(width / 2, height / 2).setSize(width, height);
    this.popup?.setPosition(width / 2, height / 2).setSize(
      width * POPUP.LAYOUT.WIDTH_PCT, height * POPUP.LAYOUT.HEIGHT_PCT
    );
    this.timerBarBg.setPosition(width / 2, height - barYOffset).setSize(barWidth, barHeight);
    this.timerBar.setPosition(width / 2 - barWidth / 2, height - barYOffset).setSize(barWidth, barHeight);
    const pct = Math.max(0, this.timeLeft / this.timeMax);
    this.timerBar.setScale(pct, 1);
    this.currentMinigame?.onResize?.(width, height);
  }
}

