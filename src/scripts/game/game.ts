import { createGameCanvas } from "web-engine/canvas.ts";
import { initKeyboard     } from "web-engine/input/keyboard.ts";
import { initPointer      } from "web-engine/input/pointer.ts";
import { initAudio        } from "web-engine/audio/context.ts";

export function bootstrapGame() {
  const { canvas, ctx } = createGameCanvas();

  initKeyboard();
  initPointer(canvas);
  initAudio();

  return { canvas, ctx };
}
