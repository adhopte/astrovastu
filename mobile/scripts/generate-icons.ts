/**
 * Regenerates every app icon/splash asset from the emblem in src/components/logoSvg.ts.
 * Run: npx tsx scripts/generate-icons.ts
 */
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";
import { logoSvg } from "../src/components/logoSvg";

const out = (name: string) => path.join(__dirname, "..", "assets", name);
const render = (svg: string, size: number) => new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

/** Emblem placed inside a larger canvas, scaled to `fraction` of it. */
function framed(fraction: number, background: string, opts: { background?: boolean } = {}) {
  const s = fraction;
  const offset = (512 * (1 - s)) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${background}<g transform="translate(${offset} ${offset}) scale(${s})">${inner(logoSvg(opts))}</g></svg>`;
}

const maroonSquare = `<defs><radialGradient id="sq" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#8E2A1E"/><stop offset="1" stop-color="#3E0A0A"/></radialGradient></defs><rect width="512" height="512" fill="url(#sq)"/>`;

// iOS / store icon: opaque square.
fs.writeFileSync(out("icon.png"), render(framed(0.9, maroonSquare), 1024));
// Android adaptive: foreground inside the 66% safe zone, solid background layer.
fs.writeFileSync(out("android-icon-foreground.png"), render(framed(0.62, ""), 1024));
fs.writeFileSync(out("android-icon-background.png"), render(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${maroonSquare}</svg>`, 1024));
// Monochrome (themed icons): white silhouette of the emblem.
// Om and lotus filled, everything else as outline, so the shape stays readable in one colour.
const mono = framed(0.62, "")
  .replace(/fill="#5A0F0F"/g, 'fill="#FFFFFF"')
  .replace(/fill="(url\(#[a-z]+\)|#[0-9A-Fa-f]{6})"/g, (m) => (m.includes("FFFFFF") ? m : 'fill="none"'))
  .replace(/stroke="[^"]+"/g, 'stroke="#FFFFFF"');
fs.writeFileSync(out("android-icon-monochrome.png"), render(mono, 1024));
// Splash + favicon.
fs.writeFileSync(out("splash-icon.png"), render(logoSvg(), 1024));
fs.writeFileSync(out("favicon.png"), render(logoSvg(), 64));
console.log("Icons written to assets/");
