// Inline SVG diagrams for notebook/inspect overlays (accessible textual clues accompany each).
import { symbolG as sym, SYMBOLS } from '../content/symbols';
import { MANTEL, SERVICE, EMBLEMS, GUESTBOOK_TABS, CATALOG, CIPHER, PLATES } from '../content/canon';

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
  // the woodland south of the manor (estate X 0–180, Z 0–72); the manor sits above the top edge
  const mx = (px: number) => 14 + (px / 180) * 292;
  const mz = (pz: number) => 226 - (pz / 72) * 180;
  let trees = '';
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 90; i++) trees += `<circle cx="${mx(r() * 180).toFixed(1)}" cy="${mz(r() * 70).toFixed(1)}" r="${(3 + r() * 3).toFixed(1)}" fill="#9db57e"/>`;
  const route: [number, number][] = [[144, 39], [120, 51], [92, 56], [62, 50], [42, 39], [31, 28], [21, 18]];
  const heads: [number, number][] = [[0, 0.55], [2, 0.5], [3, 0.6], [5, 0.6]];
  return `<svg class="diagram" viewBox="0 0 320 240" width="320" height="240" role="img" aria-label="Kaart van het bos: een gestippelde ochtendwandeling begint bij de put in het oosten, gaat naar de schuur in het westen en eindigt bij de vuurplaats in het zuidwesten">
  <rect x="4" y="4" width="312" height="232" fill="none" stroke="#5a4630" stroke-width="3"/>${trees}
  <ellipse cx="${mx(63)}" cy="${mz(31)}" rx="${(16 / 180) * 292}" ry="${(16 / 72) * 180 * 0.5}" fill="#8aa56a" stroke="#6b8a4a" stroke-dasharray="3 3"/>
  <rect x="${mx(89)}" y="${mz(72)}" width="8" height="${mz(0) - mz(72)}" fill="#c9b48a"/>
  <rect x="${mx(72)}" y="8" width="${mx(108) - mx(72)}" height="22" fill="#b8a07a"/><text x="${mx(90)}" y="24" font-size="12" text-anchor="middle" fill="#3a2a1a">landhuis</text>
  <polyline points="${route.map(([x, z]) => `${mx(x).toFixed(1)},${mz(z).toFixed(1)}`).join(' ')}" fill="none" stroke="#8a2f1a" stroke-width="2.5" stroke-dasharray="6 5"/>
  ${heads.map(([i, t]) => {
    const [ax, az] = route[i], [bx, bz] = route[i + 1];
    const px = mx(ax + (bx - ax) * t), pz = mz(az + (bz - az) * t), ang = (Math.atan2(mz(bz) - mz(az), mx(bx) - mx(ax)) * 180) / Math.PI;
    return `<path d="M7 0 L-5 -5 L-5 5 Z" fill="#8a2f1a" transform="translate(${px.toFixed(1)},${pz.toFixed(1)}) rotate(${ang.toFixed(1)})"/>`;
  }).join('')}
  <text x="${mx(96)}" y="${mz(62)}" font-size="12" font-style="italic" text-anchor="middle" fill="#8a2f1a">ochtendwandeling</text>
  <text x="${mx(144)}" y="${mz(39) + 42}" font-size="11" font-style="italic" text-anchor="middle" fill="#8a2f1a">start</text>
  ${sym('put', mx(144) - 15, mz(39) - 15, 30)}<text x="${mx(144)}" y="${mz(39) + 28}" font-size="12" text-anchor="middle">put</text>
  ${sym('schuur', mx(42) - 15, mz(39) - 15, 30)}<text x="${mx(42)}" y="${mz(39) + 28}" font-size="12" text-anchor="middle">schuur</text>
  ${sym('vuur', mx(21) - 13, mz(18) - 18, 28)}<text x="${mx(21) + 4}" y="${mz(18) + 24}" font-size="12" text-anchor="middle">vuur</text>
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


const wrapText = (t: string, max: number) => {
  const out: string[] = [];
  let line = '';
  for (const w of t.split(' ')) { const n = line ? `${line} ${w}` : w; if (n.length > max) { out.push(line); line = w; } else line = n; }
  if (line) out.push(line);
  return out;
};

/** Service chart: rule, three destinations (left → right) and the three wordless trolley tags. */
export function serviceChartSvg() {
  const rule = wrapText(SERVICE.rule, 46);
  return `<svg class="diagram" viewBox="0 0 360 250" width="360" role="img" aria-label="Dienstrooster met drie vakken: ${SERVICE.slots.map((x) => x.name).join(', ')}, en drie wagenlabels">
  <rect x="4" y="4" width="352" height="242" fill="#efe2c2" stroke="#3a2a1a" stroke-width="3"/>
  ${rule.map((l, i) => `<text x="180" y="${24 + i * 15}" font-size="12" font-style="italic" text-anchor="middle">${l}</text>`).join('')}
  ${SERVICE.slots.map((sl, i) => `<rect x="${20 + i * 80}" y="80" width="70" height="96" fill="#fbf6ea" stroke="#6b4426" stroke-width="2"/>${sym(sl.sym, 32 + i * 80, 86, 46)}<text x="${55 + i * 80}" y="146" font-size="10" text-anchor="middle">${sl.name}</text><rect x="${30 + i * 80}" y="152" width="50" height="18" fill="#d8c8a0"/>`).join('')}
  <text x="300" y="80" font-size="10" text-anchor="middle">haakjes</text>
  ${SERVICE.tags.map((t, i) => `<rect x="${274}" y="${86 + i * 52}" width="52" height="48" fill="#f6eed8" stroke="#6b4426" stroke-width="2"/>${sym(t.sym, 280, 89 + i * 52, 42)}`).join('')}
</svg>`;
}

export function libraryPlanSvg() {
  return `<svg class="diagram" viewBox="0 0 360 200" width="360" role="img" aria-label="Plattegrond met emblemen: ${EMBLEMS.map((e) => `${e.room} ${SYMBOLS[e.sym].name}`).join(', ')}">
  <rect x="4" y="4" width="352" height="192" fill="#efe2c2" stroke="#5a4630" stroke-width="3"/>
  ${EMBLEMS.map((e, i) => { const x = 12 + (i % 4) * 86, y = 12 + Math.floor(i / 4) * 92; return `<rect x="${x}" y="${y}" width="80" height="86" fill="#f7efdc" stroke="#5a4630" stroke-width="1.5"/>${sym(e.sym, x + 20, y + 6, 40)}<text x="${x + 40}" y="${y + 70}" font-size="10" text-anchor="middle">${e.room}</text>`; }).join('')}
</svg>`;
}

export function guestbookTabsSvg() {
  return `<svg class="diagram" viewBox="0 0 360 ${30 + GUESTBOOK_TABS.length * 44}" width="360" role="img" aria-label="Tabbladen in het gastenboek: ${GUESTBOOK_TABS.map((t) => `${SYMBOLS[t.tab].name} bij ${t.room}`).join(', ')}">
  <rect x="4" y="4" width="352" height="${22 + GUESTBOOK_TABS.length * 44}" fill="#f6eed8" stroke="#5a2a22" stroke-width="3"/>
  ${GUESTBOOK_TABS.map((t, i) => `${sym(t.tab, 20, 14 + i * 44, 40)}<text x="72" y="${40 + i * 44}" font-size="13">${SYMBOLS[t.tab].name} — bladzijden van de ${t.room}</text>`).join('')}
</svg>`;
}

export function catalogDeskSvg() {
  return `<svg class="diagram" viewBox="0 0 360 220" width="360" role="img" aria-label="Leestafel: drie boeken met emblemen en drie vakken met tabvormen">
  <rect x="4" y="4" width="352" height="212" fill="#8a5a34" stroke="#3a2a1a" stroke-width="3"/>
  <text x="180" y="24" font-size="12" fill="#f6eed8" text-anchor="middle">boeken</text>
  ${CATALOG.books.map((b, i) => `<rect x="${40 + i * 105}" y="32" width="70" height="78" rx="4" fill="${['#26344a', '#3f5f32', '#7a4f2c'][i]}" stroke="#c9a44c" stroke-width="3"/>${sym(b.sym, 52 + i * 105, 44, 46)}`).join('')}
  <text x="180" y="132" font-size="12" fill="#f6eed8" text-anchor="middle">vakken in het tafelblad, van links naar rechts</text>
  ${CATALOG.sockets.map((sk, i) => `<rect x="${40 + i * 105}" y="140" width="70" height="66" fill="#c9a44c" stroke="#5a3a10" stroke-width="3"/>${sym(sk.tab, 52 + i * 105, 146, 46)}`).join('')}
</svg>`;
}

export function alphabetStripsSvg() {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const shifted = A.slice(CIPHER.shift) + A.slice(0, CIPHER.shift);
  const cell = 13.4;
  const row = (str: string, y: number, fill: string) => `<rect x="6" y="${y - 14}" width="${26 * cell + 4}" height="20" fill="${fill}" stroke="#5a4630"/>` +
    [...str].map((ch, i) => `<text x="${8 + i * cell + cell / 2}" y="${y}" font-size="11" font-family="monospace" text-anchor="middle">${ch}</text>`).join('');
  return `<svg class="diagram" viewBox="0 0 ${26 * cell + 16} 92" width="${26 * cell + 16}" role="img" aria-label="Twee alfabetstroken: boven gewoon, onder drie letters opgeschoven. Lees van onder naar boven om terug te gaan.">
  ${row(A, 26, '#fbf6ea')}${row(shifted, 54, '#efe2c2')}
  <text x="${(26 * cell + 16) / 2}" y="82" font-size="11" font-style="italic" text-anchor="middle">gewone tekst boven · geheimschrift onder · ↑ terug lezen</text>
</svg>`;
}

export function serviceDrawingSvg() {
  return `<svg class="diagram" viewBox="0 0 360 230" width="360" role="img" aria-label="Leidingtekening: doorgetrokken lijn vanaf de bibliotheek, gestreepte lijn vanaf het zwembad, gestippelde lijn vanaf de vuurplaats; samen naar de routekamer en verder naar een heuvel">
  <rect x="4" y="4" width="352" height="222" fill="#e8dcbc" stroke="#6b5a3a" stroke-width="3"/>
  <g stroke="#2b2118" stroke-width="4" stroke-linecap="round">
  <line x1="60" y1="60" x2="180" y2="125"/><line x1="300" y1="60" x2="180" y2="125" stroke-dasharray="14 8"/><line x1="70" y1="190" x2="180" y2="125" stroke-dasharray="2 8"/></g>
  <line x1="180" y1="125" x2="240" y2="200" stroke="#8a2f1a" stroke-width="6"/>
  <circle cx="180" cy="125" r="9" fill="#8a2f1a"/><text x="196" y="122" font-size="12" font-weight="bold">routekamer</text>
  <text x="60" y="48" font-size="12" text-anchor="middle">bibliotheek (muren)</text><text x="300" y="48" font-size="12" text-anchor="middle">zwembad (water)</text>
  <text x="70" y="212" font-size="12" text-anchor="middle">vuurplaats (paden)</text>
  <path d="M210 214 Q240 186 270 214 Z" fill="#8a2f1a"/><text x="282" y="210" font-size="11" font-style="italic">heuvel</text>
</svg>`;
}

export function platesSvg() {
  const dirs: Record<string, [number, number]> = { boven: [0, -1], rechts: [1, 0], onder: [0, 1], links: [-1, 0] };
  return `<svg class="diagram" viewBox="0 0 360 170" width="360" role="img" aria-label="Drie platen met het koperen nokje: ${PLATES.map((p) => `${p.name} nokje ${p.notch}`).join(', ')}">
  <rect x="4" y="4" width="352" height="30" fill="#7fa04a"/><rect x="4" y="34" width="352" height="132" fill="#9a9078" stroke="#3a2a1a" stroke-width="2"/>
  ${PLATES.map((p, i) => { const cx = 70 + i * 110, cy = 92, r = 38; const [dx, dy] = dirs[p.notch]; return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#c98a4e" stroke="#3a1e0a" stroke-width="2"/>${sym(p.motif, cx - 24, cy - 24, 48)}<rect x="${cx + dx * r * 0.86 - 7}" y="${cy + dy * r * 0.86 - 7}" width="14" height="14" fill="#f3d27a" stroke="#3a1e0a" stroke-width="1.5"/><text x="${cx}" y="158" font-size="12" text-anchor="middle">${p.name}</text>`; }).join('')}
</svg>`;
}

export function journalHillSvg() {
  return `<svg class="diagram" viewBox="0 0 320 190" width="320" role="img" aria-label="Schets: een ronde heuvel met wortels als dak en een deurtje, en een wegwijzer met een gevorkte arm naar het noorden">
  <rect x="4" y="4" width="312" height="182" fill="#f6eed8" stroke="#4f6a3a" stroke-width="3"/>
  <path d="M40 150 Q150 30 270 150 Z" fill="#a9c47a" stroke="#4f6a3a" stroke-width="2"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${110 + i * 18} 72 q${-6 + i * 3} 30 ${-10 + i * 4} 60" fill="none" stroke="#6b4a32" stroke-width="3"/>`).join('')}
  <rect x="140" y="112" width="30" height="38" rx="14" fill="#5a3a22" stroke="#2b2118" stroke-width="2"/>
  <line x1="40" y1="160" x2="290" y2="160" stroke="#c8ad80" stroke-width="6"/>
  <line x1="60" y1="176" x2="60" y2="120" stroke="#6b4a2a" stroke-width="4"/><path d="M60 128 L82 120 M60 128 L70 110 M70 110 L64 102 M70 110 L76 102" stroke="#6b4a2a" stroke-width="3" fill="none"/>
  <text x="248" y="40" font-size="12" font-weight="bold">N ↑</text>
</svg>`;
}

const sealShape = (kind: 'rond' | 'vierkant' | 'blad', cx: number, cy: number, fill: string) =>
  kind === 'rond' ? `<circle cx="${cx}" cy="${cy}" r="24" fill="${fill}" stroke="#2b2118" stroke-width="2"/>`
    : kind === 'vierkant' ? `<rect x="${cx - 22}" y="${cy - 22}" width="44" height="44" fill="${fill}" stroke="#2b2118" stroke-width="2"/>`
      : `<path d="M${cx} ${cy - 26} C${cx + 26} ${cy - 10} ${cx + 18} ${cy + 18} ${cx} ${cy + 26} C${cx - 18} ${cy + 18} ${cx - 26} ${cy - 10} ${cx} ${cy - 26} Z" fill="${fill}" stroke="#2b2118" stroke-width="2"/>`;

export function ledgerSealsSvg() {
  const rows: ['rond' | 'vierkant' | 'blad', string, string][] = [['rond', 'AAN TAFEL', 'eetkamer · keuken · serre'], ['vierkant', 'IN DE KANTLIJN', 'bibliotheek · studeerkamer'], ['blad', 'BUITEN DE PADEN', 'schuur · vuur · tuin']];
  return `<svg class="diagram" viewBox="0 0 360 120" width="360" role="img" aria-label="Drie lege zegelafdrukken: rond bij aan tafel, vierkant bij in de kantlijn, blad bij buiten de paden">
  <rect x="4" y="4" width="352" height="112" fill="#efe2c2" stroke="#5a2a22" stroke-width="3"/>
  ${rows.map(([k, t, sub], i) => `${sealShape(k, 60 + i * 120, 46, '#e2d2ae')}<text x="${60 + i * 120}" y="92" font-size="11" font-weight="bold" text-anchor="middle">${t}</text><text x="${60 + i * 120}" y="106" font-size="9" text-anchor="middle">${sub}</text>`).join('')}
</svg>`;
}

export function basementDoorSvg() {
  return `<svg class="diagram" viewBox="0 0 220 240" width="220" role="img" aria-label="Kelderdeur met drie lege afdrukken: rond, vierkant en een blad">
  <rect x="40" y="10" width="140" height="220" rx="8" fill="#6b4426" stroke="#2b2118" stroke-width="3"/>
  <rect x="90" y="40" width="40" height="160" fill="#c9a44c" stroke="#2b2118" stroke-width="2"/>
  ${sealShape('rond', 110, 70, '#4a3020')}${sealShape('vierkant', 110, 122, '#4a3020')}${sealShape('blad', 110, 172, '#4a3020')}
</svg>`;
}

export const DIAGRAMS: Record<string, () => string> = {
  mantel: mantelSvg,
  brassStands: brassStandsSvg,
  forestMap: forestMapSvg,
  saunaPool: saunaPoolSvg,
  poolTiles: poolTilesSvg,
  billiardExamples: billiardExamplesSvg,
  serviceChart: serviceChartSvg,
  libraryPlan: libraryPlanSvg,
  guestbookTabs: guestbookTabsSvg,
  catalogDesk: catalogDeskSvg,
  alphabetStrips: alphabetStripsSvg,
  serviceDrawing: serviceDrawingSvg,
  plates: platesSvg,
  journalHill: journalHillSvg,
  ledgerSeals: ledgerSealsSvg,
  basementDoor: basementDoorSvg,
};
