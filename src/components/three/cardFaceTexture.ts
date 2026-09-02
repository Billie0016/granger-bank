import * as THREE from "three";

const WIDTH = 1400;
const HEIGHT = 882;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWordmark(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.font = `600 ${34 * scale}px Georgia, 'Times New Roman', serif`;
  ctx.fillStyle = "#f7f4ec";
  ctx.letterSpacing = `${4 * scale}px`;
  ctx.textBaseline = "middle";
  ctx.fillText("GRANGER", 0, 0);
  const w = ctx.measureText("GRANGER").width;
  ctx.font = `300 ${34 * scale}px Georgia, 'Times New Roman', serif`;
  ctx.fillStyle = "#c9a458";
  ctx.fillText(" BANK", w + 6 * scale, 0);
  ctx.restore();
}

function drawChip(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const w = 128;
  const h = 96;
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "#e9d6a3");
  grad.addColorStop(0.5, "#c9a458");
  grad.addColorStop(1, "#8a6c34");
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();

  ctx.strokeStyle = "rgba(10,10,10,0.35)";
  ctx.lineWidth = 2;
  roundRect(ctx, x + 14, y + 14, w - 28, h - 28, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 14);
  ctx.lineTo(x + w / 2, y + h - 14);
  ctx.moveTo(x + 14, y + h / 2);
  ctx.lineTo(x + w - 14, y + h / 2);
  ctx.moveTo(x + 32, y + 14);
  ctx.lineTo(x + 32, y + h - 14);
  ctx.moveTo(x + w - 32, y + 14);
  ctx.lineTo(x + w - 32, y + h - 14);
  ctx.stroke();
}

function drawContactless(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "rgba(247,244,236,0.85)";
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.arc(0, 0, 20 + i * 16, -0.85, 0.85);
    ctx.stroke();
  }
  ctx.restore();
}

function drawNetworkMark(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(-22, 0, 42, 0, Math.PI * 2);
  ctx.fillStyle = "#c9a458";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(22, 0, 42, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(247,244,236,0.9)";
  ctx.globalCompositeOperation = "lighter";
  ctx.fill();
  ctx.restore();
}

export function createCardCanvas(face: "front" | "back", accent: string) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;

  const bgGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGrad.addColorStop(0, "#161b23");
  bgGrad.addColorStop(0.45, "#11151d");
  bgGrad.addColorStop(1, "#0a0d13");
  ctx.fillStyle = bgGrad;
  roundRect(ctx, 0, 0, WIDTH, HEIGHT, 56);
  ctx.fill();

  const sheen = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT * 0.6);
  sheen.addColorStop(0, "rgba(255,255,255,0.05)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0.0)");
  sheen.addColorStop(1, "rgba(255,255,255,0.03)");
  ctx.fillStyle = sheen;
  roundRect(ctx, 0, 0, WIDTH, HEIGHT, 56);
  ctx.fill();

  ctx.strokeStyle = accent === "gold" ? "rgba(201,164,88,0.22)" : "rgba(247,244,236,0.08)";
  ctx.lineWidth = 2;
  roundRect(ctx, 3, 3, WIDTH - 6, HEIGHT - 6, 54);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, 0, 0, WIDTH, HEIGHT, 56);
  ctx.clip();
  ctx.strokeStyle = "rgba(201,164,88,0.08)";
  ctx.lineWidth = 220;
  ctx.beginPath();
  ctx.moveTo(-200, HEIGHT + 200);
  ctx.lineTo(WIDTH * 0.55, -200);
  ctx.stroke();
  ctx.restore();

  if (face === "front") {
    drawWordmark(ctx, 80, 96);
    drawChip(ctx, 80, 190);
    drawContactless(ctx, 260, 236);

    ctx.font = `500 62px "Courier New", monospace`;
    ctx.fillStyle = "#f7f4ec";
    ctx.textBaseline = "alphabetic";
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.letterSpacing = "6px";
    ctx.fillText("••••  ••••  ••••  4827", 80, 520);
    ctx.restore();

    ctx.font = `400 26px Arial`;
    ctx.fillStyle = "rgba(203,208,216,0.75)";
    ctx.letterSpacing = "2px";
    ctx.fillText("CARDHOLDER", 80, 610);
    ctx.fillText("VALID THRU", 620, 610);

    ctx.font = `500 34px Arial`;
    ctx.fillStyle = "#f7f4ec";
    ctx.letterSpacing = "3px";
    ctx.fillText("ALEX MORGAN", 80, 655);
    ctx.fillText("09/30", 620, 655);

    drawNetworkMark(ctx, WIDTH - 130, HEIGHT - 100);

    ctx.font = `italic 300 24px Georgia`;
    ctx.fillStyle = "rgba(203,208,216,0.55)";
    ctx.letterSpacing = "1px";
    ctx.fillText("PRIVATE CLIENT", 80, HEIGHT - 70);
  } else {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 90, WIDTH, 130);

    ctx.fillStyle = "rgba(247,244,236,0.92)";
    ctx.fillRect(90, 280, WIDTH - 300, 70);

    ctx.font = `italic 400 30px Georgia`;
    ctx.fillStyle = "#3a3a3a";
    ctx.fillText("Alex Morgan", 120, 325);

    ctx.font = `600 30px Arial`;
    ctx.fillStyle = "#161b23";
    ctx.letterSpacing = "4px";
    ctx.fillText("CVV", WIDTH - 190, 275);
    ctx.fillStyle = "#f7f4ec";
    ctx.font = `500 34px "Courier New", monospace`;
    ctx.fillText("•••", WIDTH - 190, 325);

    ctx.font = `300 22px Arial`;
    ctx.fillStyle = "rgba(203,208,216,0.65)";
    ctx.letterSpacing = "0.5px";
    const legal =
      "This card is property of Granger Bank. Fictional demo card for illustrative purposes only.";
    ctx.fillText(legal, 90, 440);
    ctx.fillText("24/7 Support  •  grangerbank.example  •  1-800-555-0142", 90, 480);

    drawWordmark(ctx, 90, HEIGHT - 100, 0.7);
  }

  return canvas;
}

export function createCardTexture(face: "front" | "back", accent: string) {
  const canvas = createCardCanvas(face, accent);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export const CARD_ASPECT = WIDTH / HEIGHT;
