import { loadImage } from "web-engine/assets.ts";

export interface GameAssets {
  game: {
    belt:         HTMLImageElement;
    life:         HTMLImageElement;
    rectBorder:   HTMLImageElement;
    rectInsert:   HTMLImageElement;
    squareBorder: HTMLImageElement;
    squareInsert: HTMLImageElement;
  };
  items: {
    background: HTMLImageElement;
    gauge:      HTMLImageElement;
    light:      HTMLImageElement;
    pipe:       HTMLImageElement;
    tire:       HTMLImageElement;
    toaster:    HTMLImageElement;
    walkie:     HTMLImageElement;
  };
  minigames: {
    drag:   { background: HTMLImageElement; plug: HTMLImageElement; socket: HTMLImageElement; };
    pump:   { body: HTMLImageElement; };
    spin:   { pipe: HTMLImageElement; valve: HTMLImageElement; };
    swipe:  { bulbInsert: HTMLImageElement; bulb: HTMLImageElement; light: HTMLImageElement; };
    tap:    { walkieClose: HTMLImageElement; };
    timing: { gauge: HTMLImageElement; };
  };
}

export async function loadAssets(baseUrl: string): Promise<GameAssets> {
  const img = (path: string) => loadImage(`${baseUrl}assets/${path}`);

  const [
    belt, life, rectBorder, rectInsert, squareBorder, squareInsert,
    itemBg, itemGauge, itemLight, itemPipe, itemTire, itemToaster, itemWalkie,
    dragBg, dragPlug, dragSocket,
    pumpBody,
    spinPipe, spinValve,
    swipeBulbInsert, swipeBulb, swipeLight,
    tapWalkieClose,
    timingGauge,
  ] = await Promise.all([
    img("game/belt.png"),
    img("game/life.png"),
    img("game/rectangle-border.png"),
    img("game/rectangle-insert.png"),
    img("game/square-border.png"),
    img("game/square-insert.png"),
    img("items/background.png"),
    img("items/gauge.png"),
    img("items/light.png"),
    img("items/pipe.png"),
    img("items/tire.png"),
    img("items/toaster.png"),
    img("items/walkie.png"),
    img("minigames/drag/background.png"),
    img("minigames/drag/plug.png"),
    img("minigames/drag/socket.png"),
    img("minigames/pump/body.png"),
    img("minigames/spin/pipe.png"),
    img("minigames/spin/valve.png"),
    img("minigames/swipe/bulb-insert.png"),
    img("minigames/swipe/bulb.png"),
    img("minigames/swipe/light.png"),
    img("minigames/tap/walkie-close.png"),
    img("minigames/timing/gauge.png"),
  ]);

  return {
    game:  { belt, life, rectBorder, rectInsert, squareBorder, squareInsert },
    items: { background: itemBg, gauge: itemGauge, light: itemLight, pipe: itemPipe, tire: itemTire, toaster: itemToaster, walkie: itemWalkie },
    minigames: {
      drag:   { background: dragBg, plug: dragPlug, socket: dragSocket },
      pump:   { body: pumpBody },
      spin:   { pipe: spinPipe, valve: spinValve },
      swipe:  { bulbInsert: swipeBulbInsert, bulb: swipeBulb, light: swipeLight },
      tap:    { walkieClose: tapWalkieClose },
      timing: { gauge: timingGauge },
    },
  };
}
