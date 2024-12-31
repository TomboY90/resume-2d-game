import {k} from "./kaboomCtx.js";
import {SCALE_FACTOR} from "./constatns.js";
import {displayDialogue, setCamScale} from "./utils.js";

k.loadSprite('spritesheet', './assets/spritesheet.png', {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "idle-down": 936,
    "walk-down": {from: 936, to: 939, loop: true, speed: 8},
    "idle-side": 975,
    "walk-side": {from: 975, to: 978, loop: true, speed: 8},
    "idle-up": 1014,
    "walk-up": {from: 1014, to: 1017, loop: true, speed: 8},
  }
})
k.loadSprite("map", "./assets/map.png");

k.setBackground(k.Color.fromHex("#311047"));

k.scene("main", async () => {
  const mapData = await (await fetch("./assets/map.json")).json()
  const layers = mapData.layers;

  const map = k.add([
    k.sprite("map"),
    k.pos(0),
    k.scale(SCALE_FACTOR),
  ])

  const player = k.make([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.area({
      shape: new k.Rect(k.vec2(0, 3), 10, 10)
    }),
    k.body(),
    k.anchor("center"),
    k.pos(),
    k.scale(SCALE_FACTOR),
    {
      speed: 250,
      direction: "down",
      isInDialogue: false,
    },
    "player",
  ])

  for (const layer of layers) {
    if (layer.name === 'boundaries') {
      for (const boundary of layer.objects) {
        map.add([
          k.area({
            shape: new k.Rect(k.vec2(0), boundary.width, boundary.height)
          }),
          k.body({ isStatic: true, }),
          k.pos(boundary.x, boundary.y),
          boundary.name
        ])

        if (boundary.name) {
          player.onCollide(boundary.name, () => {
            player.isInDialouge = true;
            displayDialogue("TEST DIALOGUE", () => player.isInDialouge = false)
          })
        }
      }

      continue;
    }

    if (layer.name === "spawnpoints") {
      for (const entity of layer.objects) {
        if (entity.name === "player") {
          player.pos = k.vec2(
            (map.pos.x + entity.x) * SCALE_FACTOR,
            (map.pos.y + entity.y) * SCALE_FACTOR
          )
          k.add(player);
          continue;
        }
      }
    }
  }

  setCamScale(k);

  k.onResize(() => {
    setCamScale(k);
  })

  k.onUpdate(() => {
    k.camPos(player.pos.x, player.pos.y + 100);
  })

  k.onMouseDown((event) => {
    if (event !== "left" || player.isInDialouge) return;

    const worldMousePos = k.toWorld(k.mousePos());
    player.moveTo(worldMousePos, player.speed);

    const mouseAngle = player.pos.angle(worldMousePos);

    const lowerBound = 50;
    const upperBound = 125;

    // Up
    if (mouseAngle > lowerBound && mouseAngle < upperBound && player.curAnim() !== 'walk-up') {
      player.play("walk-up");
      player.direction = "up";
      return;
    }

    // Down
    if (mouseAngle < -lowerBound && mouseAngle > -upperBound && player.curAnim() !== 'walk-down') {
      player.play("walk-down");
      player.direction = "down";
      return;
    }

    // Left
    if (Math.abs(mouseAngle) > upperBound) {
      player.flipX = false;

      if (player.curAnim() !== 'walk-side') {
        player.play("walk-side");
      }

      player.direction = "right"
      return;
    }

    // Right
    if (Math.abs(mouseAngle) < lowerBound) {
      player.flipX = true;

      if (player.curAnim() !== 'walk-side') {
        player.play("walk-side");
      }

      player.direction = "left"
      return;
    }
  })

  k.onMouseRelease(() => {
    if (player.direction === 'down') {
      player.play("idle-down")
      return;
    }

    if (player.direction === 'up') {
      player.play("idle-down")
      return;
    }

    player.play("idle-side")
  })
})

k.go("main");
