/**
 * AstroVastu emblem: a sacred ॐ on a rising-sun disc, encircled by 16 lotus
 * petals (one for each Vastu direction) on a sindoor-maroon mandala with a
 * temple-gold rim. The ॐ is an outline taken from the Yatra One typeface so
 * it renders identically everywhere without depending on font loading.
 */
const OM_PATH = "M63.45 38.04Q66.2 40.55 64.83 45.99Q63.45 51.43 58.69 56.44Q63.32 57.44 67.33 56.19Q71.33 54.94 73.59 53.12Q75.84 51.31 80.09 47.3Q81.09 46.3 83.47 43.99Q85.85 41.67 87.16 40.48Q88.48 39.3 90.48 37.79Q92.48 36.29 94.23 35.67Q95.99 35.04 97.86 35.17Q101.24 35.29 112.44 44.55Q123.64 53.81 128.27 58.82Q128.77 59.94 129.02 62.32Q129.28 64.7 127.9 68.27Q126.52 71.83 124.52 75.21Q122.52 78.59 118.58 81.66Q114.63 84.72 109.75 86.1Q106.12 87.1 100.55 84.47Q94.99 81.84 86.23 75.59L88.48 72.96Q99.24 77.21 107.19 73.46Q115.13 69.71 115.45 62.95Q115.76 56.19 111 50.93Q108.38 48.81 105.69 48.49Q102.99 48.18 100.68 49.31Q98.36 50.43 95.8 52.5Q93.23 54.56 91.17 56.69Q89.1 58.82 86.54 61.07Q83.97 63.32 81.97 64.45Q79.84 65.2 76.28 65.26Q72.71 65.33 67.02 63.57Q61.32 61.82 56.32 58.69L54.81 59.82Q58.82 62.45 61.07 64.14Q63.32 65.83 66.33 69.46Q69.33 73.08 70.83 77.21Q72.21 80.84 69.46 84.97Q66.7 89.1 61.7 92.17Q56.69 95.24 50.68 97.55Q44.68 99.87 39.55 99.99Q34.41 100.12 31.29 98.49Q24.78 94.11 18.02 87.48Q11.26 80.84 0 68.08L2.63 64.95Q13.77 75.84 19.52 79.84Q35.04 90.61 45.93 84.47Q49.93 82.22 52.25 78.78Q54.56 75.34 54.25 70.89Q53.94 66.45 50.06 62.7Q42.42 66.45 33.54 66.33L26.78 54.69Q33.54 54.69 38.73 53.06Q43.93 51.43 46.62 48.87Q49.31 46.3 50.5 43.36Q51.68 40.42 51.06 37.54Q50.43 34.67 48.43 32.54Q45.05 28.78 40.17 29.72Q35.29 30.66 30.85 33.79Q26.41 36.92 22.28 41.67L10.14 33.29Q17.02 26.53 25.65 22.09Q34.29 17.65 38.04 19.77Q52.69 28.16 63.45 38.04ZM50.93 18.65L54.06 15.52Q55.44 16.89 57.69 18.96Q59.94 21.02 64.57 24.47Q69.21 27.91 71.33 27.91Q74.84 27.91 79.97 24.47Q85.1 21.02 88.48 17.65L91.98 14.14L99.37 21.9Q98.86 22.53 97.93 23.46Q96.99 24.4 93.98 26.78Q90.98 29.16 88.04 30.97Q85.1 32.79 80.91 34.29Q76.71 35.79 72.83 35.79Q69.33 35.79 63.89 31.47Q58.44 27.16 54.69 22.9ZM73.34 19.02Q66.58 15.89 63.32 9.26Q63.57 7.13 67.27 3.82Q70.96 0.5 73.08 0Q79.97 3 82.97 9.39Q80.97 15.02 73.34 19.02Z";

const C = 256;
function petal(i: number, inner: number, outer: number, halfWidth: number) {
  const a = (i * 22.5 * Math.PI) / 180;
  const pt = (r: number, dx: number) => {
    // Point at radius r along the petal axis, offset dx perpendicular to it.
    const x = C + r * Math.sin(a) + dx * Math.cos(a);
    const y = C - r * Math.cos(a) + dx * Math.sin(a);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  };
  const mid = inner + (outer - inner) * 0.55;
  return `M${pt(inner, -halfWidth)} Q${pt(mid, -halfWidth * 1.35)} ${pt(outer, 0)} Q${pt(mid, halfWidth * 1.35)} ${pt(inner, halfWidth)} Z`;
}

const minor = Array.from({ length: 16 }, (_, i) => petal(i + 0.5, 140, 200, 26)).join(" ");
const major = Array.from({ length: 16 }, (_, i) => petal(i, 138, 222, 30)).join(" ");
const veins = Array.from({ length: 16 }, (_, i) => {
  const a = (i * 22.5 * Math.PI) / 180;
  return `M${(C + 150 * Math.sin(a)).toFixed(1)} ${(C - 150 * Math.cos(a)).toFixed(1)} L${(C + 206 * Math.sin(a)).toFixed(1)} ${(C - 206 * Math.cos(a)).toFixed(1)}`;
}).join(" ");

const OM_W = 129.06;
const OM_SCALE = 1.28;

export function logoSvg({ background = true }: { background?: boolean } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="60%">
      <stop offset="0" stop-color="#9A2E1F"/><stop offset="0.7" stop-color="#6E1616"/><stop offset="1" stop-color="#420B0B"/>
    </radialGradient>
    <radialGradient id="sun" cx="50%" cy="40%" r="65%">
      <stop offset="0" stop-color="#FFD27A"/><stop offset="0.45" stop-color="#F59A2E"/><stop offset="1" stop-color="#C4550B"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FBE7A1"/><stop offset="0.5" stop-color="#E2B33C"/><stop offset="1" stop-color="#B8860B"/>
    </linearGradient>
  </defs>
  ${background ? '<circle cx="256" cy="256" r="252" fill="url(#bg)"/>' : ""}
  <circle cx="256" cy="256" r="240" fill="none" stroke="url(#gold)" stroke-width="7"/>
  <circle cx="256" cy="256" r="229" fill="none" stroke="#E2B33C" stroke-width="1.5" stroke-dasharray="2 7" stroke-linecap="round"/>
  <path d="${minor}" fill="#E8751A" stroke="#FBE7A1" stroke-width="1.5"/>
  <path d="${major}" fill="url(#gold)" stroke="#8C5A08" stroke-width="1.5"/>
  <path d="${veins}" stroke="#A8740E" stroke-width="2" stroke-linecap="round"/>
  <circle cx="256" cy="256" r="146" fill="url(#sun)" stroke="url(#gold)" stroke-width="6"/>
  <circle cx="256" cy="256" r="132" fill="none" stroke="#FFE3A8" stroke-opacity="0.6" stroke-width="1.5"/>
  <g transform="translate(${(256 - (OM_W * OM_SCALE) / 2).toFixed(1)} 176) scale(${OM_SCALE})">
    <path d="${OM_PATH}" fill="#5A0F0F"/>
  </g>
  <path d="M256 322 C244 336 244 352 256 362 C268 352 268 336 256 322 Z M226 336 C230 352 242 360 254 362 C246 350 238 340 226 336 Z M286 336 C282 352 270 360 258 362 C266 350 274 340 286 336 Z" fill="#5A0F0F" opacity="0.85"/>
  <path d="M214 366 Q256 378 298 366" fill="none" stroke="#5A0F0F" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
</svg>`;
}
