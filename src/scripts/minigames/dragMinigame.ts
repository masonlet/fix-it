import { DEPTH } from "../config/depth.ts";
import type { MinigameScene } from "../game/types.ts";

const LAYOUT = {
  BG_SIZE_PCT:    0.50,
  PIECE_SIZE_PCT: 0.10,
  SLOT_SIZE_PCT:  0.12,
  START_OFFSET_X_PCT: -0.15,
  SLOT_OFFSET_X_PCT:   0.15,
  SNAP_TOLERANCE_PCT:  0.50,
}

export class DragMinigame {
  private scene:      MinigameScene;
  private onComplete: () => void;
  private completed:  boolean;

  private startX: number;
  private startY: number;
  private slotX:  number;
  private slotY:  number;
  private snapTolerance: number;

  private bg:    Phaser.GameObjects.Image;
  private slot:  Phaser.GameObjects.Image;
  private piece: Phaser.GameObjects.Image;

  private onDrag: (
    pointer:    Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject,
    dragX: number,
    dragY: number
  ) => void;
  private onDragEnd: (
    pointer:    Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject
  ) => void;

  constructor (scene: MinigameScene, cx: number, cy: number, onComplete: () => void) {
    this.scene = scene;
    this.onComplete = onComplete;
    this.completed = false;

    const { width } = scene.scale;
    const bgSize = width * LAYOUT.BG_SIZE_PCT;
    const pieceSize = width * LAYOUT.PIECE_SIZE_PCT;
    const slotSize = width * LAYOUT.SLOT_SIZE_PCT;

    this.startX = cx + width * LAYOUT.START_OFFSET_X_PCT;
    this.startY = cy;
    this.slotX = cx + width * LAYOUT.SLOT_OFFSET_X_PCT;
    this.slotY = cy;
    this.snapTolerance = pieceSize * LAYOUT.SNAP_TOLERANCE_PCT;

    this.bg = scene.add.image(cx, cy, "drag-background")
      .setDisplaySize(bgSize, bgSize)
      .setDepth(DEPTH.MINIGAME);

    this.slot = scene.add.image(this.slotX, this.slotY, "drag-socket")
      .setDisplaySize(slotSize, slotSize)
      .setDepth(DEPTH.MINIGAME);

    this.piece = scene.add.image(this.startX, this.startY, "drag-plug")
      .setDisplaySize(pieceSize, pieceSize)
      .setDepth(DEPTH.MINIGAME)
      .setInteractive({ draggable: true });

    scene.input.setDraggable(this.piece);

    this.onDrag = (_, obj, x, y) => {
      if (obj !== this.piece) return;
      this.piece.setPosition(x, y);
      const dx = x - this.slotX;
      const dy = y - this.slotY;
      if (Math.hypot(dx, dy) <= this.snapTolerance) {
        this.slot.setTint(0x00cc66);
      } else {
        this.slot.clearTint();
      }
    };
    this.onDragEnd = (_, obj) => {
      if (obj !== this.piece || this.completed) return;
      const dx = this.piece.x - this.slotX;
      const dy = this.piece.y - this.slotY;
      if (Math.hypot(dx, dy) <= this.snapTolerance) {
        this.completed = true;
        this.piece.setPosition(this.slotX, this.slotY);
        this.scene.audio.play("drag-connect");
        this.onComplete();
      } else {
        this.piece.setPosition(this.startX, this.startY);
      }
    };

    scene.input.on("drag", this.onDrag);
    scene.input.on("dragend", this.onDragEnd);
  }

  public destroy(): void {
    this.scene.input.off("drag", this.onDrag);
    this.scene.input.off("dragend", this.onDragEnd);
    this.bg.destroy();
    this.piece.destroy();
    this.slot.destroy();
  }

  public onResize(width: number, height: number): void {
    const cx = width / 2;
    const cy = height / 2;
    const bgSize    = width * LAYOUT.BG_SIZE_PCT;
    const pieceSize = width * LAYOUT.PIECE_SIZE_PCT;
    const slotSize  = width * LAYOUT.SLOT_SIZE_PCT;

    this.startX = cx + width * LAYOUT.START_OFFSET_X_PCT;
    this.startY = cy;
    this.slotX  = cx + width * LAYOUT.SLOT_OFFSET_X_PCT;
    this.slotY  = cy;
    this.snapTolerance = pieceSize * LAYOUT.SNAP_TOLERANCE_PCT;

    this.bg.setPosition(cx, cy).setDisplaySize(bgSize, bgSize);
    this.slot.setPosition(this.slotX, this.slotY).setDisplaySize(slotSize, slotSize);

    if (this.completed) this.piece.setPosition(this.slotX,  this.slotY);
    else                this.piece.setPosition(this.startX, this.startY);

    this.piece.setDisplaySize(pieceSize, pieceSize);
  }
}
