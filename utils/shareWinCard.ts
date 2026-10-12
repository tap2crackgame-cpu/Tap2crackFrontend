import { Platform, Share } from "react-native";
import { recordShare } from "@/utils/progression";

/**
 * "Share my win" card: draws a branded 1080x1350 image (Clucky + prize + link) on a canvas
 * and opens the share sheet (WhatsApp, IG Stories, X…) where supported, otherwise downloads it.
 * Native apps fall back to a text share. No new packages needed.
 */

const SITE = "tap2crackgame.com";

const CLUCKY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -14 220 214"><defs>
<radialGradient id="b" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#FFF1D6"/><stop offset="1" stop-color="#F6D9A6"/></radialGradient>
<linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A8A"/><stop offset="1" stop-color="#EE4B4B"/></linearGradient>
<linearGradient id="k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC04D"/><stop offset="1" stop-color="#FF8C00"/></linearGradient></defs>
<ellipse cx="100" cy="186" rx="52" ry="8" fill="#000" opacity=".25"/>
<g stroke="#1A1A2E" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
<path d="M146 120C170 84 196 96 188 130C182 146 164 150 148 144Z" fill="url(#k)"/>
<path d="M84 170L80 188M70 188L92 188M116 170L120 188M108 188L130 188" fill="none" stroke="url(#k)" stroke-width="7"/>
<ellipse cx="100" cy="114" rx="66" ry="60" fill="url(#b)"/>
<path d="M42 108C16 90 8 126 30 142C46 144 54 126 42 108Z" fill="#FFE2A8"/>
<path transform="rotate(-100 152 116)" d="M158 112C184 98 192 132 170 146C154 148 146 130 158 112Z" fill="#FFE2A8"/>
<circle cx="86" cy="40" r="12" fill="url(#c)"/><circle cx="102" cy="32" r="14" fill="url(#c)"/><circle cx="118" cy="42" r="11" fill="url(#c)"/>
<path d="M50 80C50 44 150 44 150 80L139 71L127 82L114 70L100 82L86 70L73 82L61 71Z" fill="#FFF8E7"/>
<path d="M72 66L100 6L128 66Z" fill="#FF6B6B"/><path d="M84 40L116 40M90 24L110 24" stroke="#FFD700" stroke-width="5"/><circle cx="100" cy="8" r="8" fill="#FFD700" stroke-width="3"/></g>
<circle cx="64" cy="118" r="10" fill="#FF9AA2" opacity=".7"/><circle cx="136" cy="118" r="10" fill="#FF9AA2" opacity=".7"/>
<path d="M67 104Q80 88 93 104M107 104Q120 88 133 104" fill="none" stroke="#1A1A2E" stroke-width="5" stroke-linecap="round"/>
<path d="M88 112Q100 104 112 112L100 118Z" fill="url(#k)" stroke="#1A1A2E" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M90 120L100 118L110 120Q106 136 100 136Q94 136 90 120Z" fill="url(#k)" stroke="#1A1A2E" stroke-width="3.5" stroke-linejoin="round"/>
<ellipse cx="100" cy="142" rx="6" ry="8" fill="url(#c)" stroke="#1A1A2E" stroke-width="3"/></svg>`;

export type ShareWinInfo = { prizeLabel: string; eggLabel?: string; playerName?: string | null };

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number, start: number, weight = 900) {
  let size = start;
  do {
    ctx.font = `${weight} ${size}px Poppins, "Arial Rounded MT Bold", Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxW) break;
    size -= 4;
  } while (size > 28);
  return size;
}

async function drawCard(info: ShareWinInfo): Promise<HTMLCanvasElement> {
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(W / 2, H * 0.45, 50, W / 2, H * 0.45, H * 0.8);
  g.addColorStop(0, "#FFE3B3"); g.addColorStop(0.55, "#FFB25B"); g.addColorStop(1, "#E0803A");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // sparkles
  ctx.fillStyle = "rgba(255,255,255,.7)";
  for (let i = 0; i < 26; i++) {
    const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * W, y = (Math.sin(i * 37.3) * 0.5 + 0.5) * H, r = 4 + (i % 4) * 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  const stroke = (t: string, x: number, y: number, fill: string, lw: number) => {
    ctx.lineWidth = lw; ctx.strokeStyle = "#1A1A2E"; ctx.strokeText(t, x, y); ctx.fillStyle = fill; ctx.fillText(t, x, y);
  };
  fitText(ctx, "I CRACKED IT!", W - 140, 120);
  stroke("I CRACKED IT!", W / 2, 190, "#fff", 22);
  if (info.playerName) {
    ctx.font = `800 40px Poppins, Arial, sans-serif`;
    ctx.fillStyle = "#1A1A2E"; ctx.fillText(`— ${info.playerName} on Tap2Crack`, W / 2, 255);
  }
  try {
    const img = await loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(CLUCKY_SVG));
    ctx.drawImage(img, W / 2 - 300, 290, 600, 584);
  } catch {}
  // prize card
  const py = 900, ph = 220;
  roundRect(ctx, 90, py, W - 180, ph, 44);
  ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = "#1A1A2E"; ctx.stroke();
  ctx.font = `800 36px Poppins, Arial, sans-serif`; ctx.fillStyle = "rgba(26,26,46,.6)";
  ctx.fillText(info.eggLabel ? `I WON · ${info.eggLabel.toUpperCase()}` : "I WON", W / 2, py + 68);
  fitText(ctx, info.prizeLabel, W - 260, 84);
  ctx.fillStyle = "#E0803A"; ctx.fillText(info.prizeLabel, W / 2, py + 165);
  // footer
  roundRect(ctx, W / 2 - 330, 1180, 660, 100, 50);
  ctx.fillStyle = "#1A1A2E"; ctx.fill();
  ctx.font = `900 46px Poppins, Arial, sans-serif`; ctx.fillStyle = "#FFB25B";
  ctx.fillText(`🥚 ${SITE}`, W / 2, 1246);
  return c;
}

export async function shareWin(info: ShareWinInfo): Promise<void> {
  const text = `I just cracked ${info.prizeLabel} on Tap2Crack 🥚🎉 One egg, everyone taps, last tap wins! ${SITE}`;
  void recordShare();
  if (Platform.OS !== "web" || typeof document === "undefined") {
    try { await Share.share({ message: text }); } catch {}
    return;
  }
  try {
    const canvas = await drawCard(info);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob((b) => r(b), "image/png"));
    if (blob) {
      const file = new File([blob], "tap2crack-win.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text, title: "I cracked it on Tap2Crack!" });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "tap2crack-win.png"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      if (nav.share) {
        try { await nav.share({ text, title: "Tap2Crack" }); } catch {}
      }
    }
  } catch (e) {
    console.log("share card error", e);
    try {
      if ((navigator as Navigator).share) await navigator.share({ text });
    } catch {}
  }
}
