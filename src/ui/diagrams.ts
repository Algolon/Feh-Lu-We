// Inline SVG diagrams for notebook/inspect overlays (accessible textual clues accompany each).
import { symbolG as sym, SYMBOLS } from '../content/symbols';
import { MANTEL } from '../content/canon';

/** Drawn base under a mantel object; the three identical brass stands are the selection cue. */
function base(kind: string, cx: number, y: number) {
  if (kind === 'brass') return `<path d="M${cx - 16} ${y + 14} H${cx + 16} L${cx + 12} ${y + 10} H${cx + 5} V${y + 4} H${cx + 10} V${y} H${cx - 10} V${y + 4} H${cx - 5} V${y + 10} H${cx - 12} Z" fill="#d9b14a" stroke="#2b2118" stroke-width="1.6" stroke-linejoin="round"/>`;
  if (kind === 'tin') return `<ellipse cx="${cx}" cy="${y + 8}" rx="19" ry="5" fill="#a9adb3" stroke="#2b2118" stroke-width="1.6"/>`;
  if (kind === 'plinth') return `<rect x="${cx - 17}" y="${y}" width="34" height="14" fill="#7a4f2c" stroke="#2b2118" stroke-width="1.6"/>`;
  return `<path d="M${cx - 20} ${y + 9} q4 -6 8 0 q4 -6 8 0 q4 -6 8 0 q4 -6 8 0 q4 -6 8 0 q-20 8 -40 0 Z" fill="#fbf8f0" stroke="#2b2118" stroke-width="1.4"/>`;
}

/** The mantelpiece row as seen standing in front of the fireplace (left → right). */
export function mantelSvg() {
  const W = 380, step = 60, x0 = 40;
  const items = MANTEL.map((o, i) => {
    const cx = x0 + i * step;
    return `${sym(o.sym, cx - 21, 44, 42)}${base(o.base, cx, 88)}<text x="${cx}" y="122" font-size="12" text-anchor="middle">${SYMBOLS[o.sym].name}</text>`;
  }).join('');
  return `<svg class="diagram" viewBox="0 0 ${W} 170" width="${W}" role="img" aria-label="Schoorsteenmantel van links naar rechts: ${MANTEL.map((o) => `${SYMBOLS[o.sym].name} op ${o.baseName}`).join(', ')}">
  <rect x="8" y="102" width="${W - 16}" height="8" fill="#cbb898" stroke="#5a4630" stroke-width="1.5"/>
  ${items}
  <text x="16" y="24" font-size="13" fill="#3a2a1a">← links</text><text x="${W - 16}" y="24" font-size="13" text-anchor="end" fill="#3a2a1a">rechts →</text>
  <text x="${W / 2}" y="158" font-size="12" font-style="italic" text-anchor="middle" fill="#5a4630">zoals je het ziet als je recht voor de haard staat</text>
</svg>`;
}

/** Three empty brass stands (illustration on the invitation). */
export function brassStandsSvg() {
  return `<svg class="diagram" viewBox="0 0 220 70" width="220" role="img" aria-label="Drie kleine messing voetjes">
  ${[50, 110, 170].map((cx) => base('brass', cx, 30)).join('')}
  <text x="110" y="64" font-size="11" font-style="italic" text-anchor="middle" fill="#5a4630">kleine messing voetjes</text></svg>`;
}

export function forestMapSvg() {
  const mx = (px: number) => 14 + (px / 120) * 292;
  const mz = (pz: number) => 226 - (pz / 50) * 180;
  let trees = '';
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) trees += `<circle cx="${mx(r() * 120)}" cy="${mz(r() * 48)}" r="${3 + r() * 3}" fill="#9db57e"/>`;
  return `<svg class="diagram" viewBox="0 0 320 240" width="320" height="240" role="img" aria-label="Kaart van het bos: een gestippelde ochtendwandeling begint bij de put, gaat naar de schuur en eindigt bij de vuurplaats">
  <rect x="4" y="4" width="312" height="232" fill="none" stroke="#5a4630" stroke-width="3"/>${trees}
  <rect x="${mx(58)}" y="${mz(50)}" width="9" height="180" fill="#c9b48a"/>
  <rect x="${mx(52)}" y="10" width="${mx(68) - mx(52)}" height="24" fill="#b8a07a"/><text x="${mx(60)}" y="27" font-size="12" text-anchor="middle" fill="#3a2a1a">landhuis</text>
  <polyline points="${[[96, 26], [78, 33], [52, 30], [28, 26], [20, 18], [14, 12]].map(([x, z]) => `${mx(x)},${mz(z)}`).join(' ')}" fill="none" stroke="#8a2f1a" stroke-width="2.5" stroke-dasharray="6 5"/>
  ${[[[78, 33], [52, 30]], [[52, 30], [28, 26]], [[20, 18], [14, 12]]].map(([[ax, az], [bx, bz]]) => {
    const px = mx((ax + bx) / 2), pz = mz((az + bz) / 2), ang = (Math.atan2(mz(bz) - mz(az), mx(bx) - mx(ax)) * 180) / Math.PI;
    return `<path d="M7 0 L-5 -5 L-5 5 Z" fill="#8a2f1a" transform="translate(${px},${pz}) rotate(${ang})"/>`;
  }).join('')}
  <text x="${mx(64)}" y="${mz(38)}" font-size="12" font-style="italic" text-anchor="middle" fill="#8a2f1a">ochtendwandeling</text>
  <text x="${mx(96)}" y="${mz(26) + 42}" font-size="11" font-style="italic" text-anchor="middle" fill="#8a2f1a">start</text>
  ${sym('put', mx(96) - 15, mz(26) - 15, 30)}<text x="${mx(96)}" y="${mz(26) + 28}" font-size="12" text-anchor="middle">put</text>
  ${sym('schuur', mx(28) - 15, mz(26) - 15, 30)}<text x="${mx(28)}" y="${mz(26) + 28}" font-size="12" text-anchor="middle">schuur</text>
  ${sym('vuur', mx(14) - 13, mz(12) - 18, 28)}<text x="${mx(14) + 4}" y="${mz(12) + 24}" font-size="12" text-anchor="middle">vuur</text>
  <g transform="translate(280,62)" stroke="#3a2a1a" stroke-width="2" font-size="12" font-weight="bold" text-anchor="middle">
  <line x1="0" y1="-20" x2="0" y2="20"/><line x1="-20" y1="0" x2="20" y2="0"/>
  <text x="0" y="-24" stroke="none">N</text><text x="0" y="34" stroke="none">Z</text><text x="30" y="5" stroke="none">O</text><text x="-30" y="5" stroke="none">W</text></g>
</svg>`;
}

export function saunaPoolSvg() {
  return `<svg class="diagram" viewBox="0 0 220 280" width="220" height="280" role="img" aria-label="Zwembad van bovenaf; pijl van diep naar ondiep langs vier lege vakjes">
  <rect x="50" y="30" width="120" height="220" rx="6" fill="#bfe3ea" stroke="#5a4630" stroke-width="4"/>
  <text x="110" y="22" text-anchor="middle" font-size="14" font-weight="bold">DIEP</text>
  <text x="110" y="272" text-anchor="middle" font-size="14" font-weight="bold">ONDIEP · trapje</text>
  <g fill="#5a4630">${[0, 1, 2].map((i) => `<rect x="${92 + i * 0}" y="${238 - i * 6}" width="36" height="4"/>`).join('')}</g>
  <line x1="110" y1="44" x2="110" y2="226" stroke="#7a2a1a" stroke-width="5"/>
  <path d="M98 212 L110 232 L122 212 Z" fill="#7a2a1a"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="128" y="${52 + i * 44}" width="30" height="30" fill="#fff8e8" stroke="#5a4630" stroke-width="2"/><text x="143" y="${72 + i * 44}" font-size="13" text-anchor="middle">${i + 1}</text>`).join('')}
</svg>`;
}

export function poolTilesSvg() {
  const order = ['cirkel', 'driehoek', 'golf', 'ruit'];
  return `<svg class="diagram" viewBox="0 0 200 280" width="200" height="280" role="img" aria-label="Mozaïek: van ondiep naar diep cirkel, driehoek, golf, ruit">
  <rect x="40" y="30" width="120" height="220" rx="6" fill="#8fd3e0" stroke="#2f6f80" stroke-width="4"/>
  <text x="100" y="22" text-anchor="middle" font-size="13" font-weight="bold">diep (noord)</text>
  <text x="100" y="272" text-anchor="middle" font-size="13" font-weight="bold">ondiep · trapje (zuid)</text>
  ${order.map((s, i) => sym(s, 80, 204 - i * 52, 40)).join('')}
</svg>`;
}

export function billiardExamplesSvg() {
  const ex = (ox: number, balls: [number, number, string][]) => {
    let t = `<rect x="${ox}" y="20" width="96" height="120" rx="8" fill="#2f6b3f" stroke="#5a3a1a" stroke-width="6"/>`;
    t += `<text x="${ox + 48}" y="14" text-anchor="middle" font-size="10">raam</text>`;
    for (const [r, c, col] of balls) t += `<circle cx="${ox + 18 + c * 30}" cy="${42 + r * 38}" r="9" fill="${col}" stroke="#000" stroke-width="1"/>`;
    let g = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const on = balls.some(([br, bc, col]) => br === r && bc === c && col !== '#ffffff');
      g += `<rect x="${ox + 10 + c * 26}" y="${160 + r * 26}" width="22" height="22" rx="4" fill="${on ? '#f3c45a' : '#4a3a2a'}"/>` +
        (on ? `<text x="${ox + 21 + c * 26}" y="${176 + r * 26}" font-size="13" text-anchor="middle">●</text>` : '');
    }
    return t + `<text x="${ox + 48}" y="153" text-anchor="middle" font-size="16">↓</text>` + g;
  };
  return `<svg class="diagram" viewBox="0 0 250 250" width="250" height="250" role="img" aria-label="Twee voorbeelden: lampjes branden op de plekken van gekleurde ballen, niet van de witte bal">
  ${ex(10, [[0, 2, '#d33'], [1, 0, '#ffffff'], [2, 1, '#36c']])}
  ${ex(140, [[0, 0, '#ffffff'], [1, 1, '#e8c547'], [2, 0, '#d33'], [2, 2, '#36c']])}
</svg>`;
}

export const DIAGRAMS: Record<string, () => string> = {
  mantel: mantelSvg,
  brassStands: brassStandsSvg,
  forestMap: forestMapSvg,
  saunaPool: saunaPoolSvg,
  poolTiles: poolTilesSvg,
  billiardExamples: billiardExamplesSvg,
};
