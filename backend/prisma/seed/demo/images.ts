import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import type { Artwork, Plan } from './plan';

const directory = join(__dirname, 'media');
const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const maxBytes = 512 * 1024;

type Source = {
  category: string; kind: Artwork['kind']; file: string; author: string;
  license: string; licenseUrl: string; source: string; original: string; sha256: string;
};
export type Credit = {
  filename: string; owner: string; category: string; kind: Artwork['kind'];
  sha256: string; bytes: number; url: string; source: string; original: string | null;
  author: string; license: string; licenseUrl: string | null;
  attribution: string; status: 'validada' | 'fallback-validado';
};

export const sha256 = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');

export function validPng(bytes: Buffer) {
  return bytes.length >= 33 && bytes.length <= maxBytes && bytes.subarray(0, 8).equals(pngHeader)
    && bytes.toString('ascii', 12, 16) === 'IHDR'
    && [bytes.readUInt32BE(16), bytes.readUInt32BE(20)].every((size) => size >= 96 && size <= 960);
}

function vettedSources(): Source[] {
  const value: unknown = JSON.parse(readFileSync(join(directory, 'catalog.json'), 'utf8'));
  if (!Array.isArray(value)) throw new Error('Catálogo de imagens inválido.');
  const sourceHosts = new Set(['upload.wikimedia.org', 'commons.wikimedia.org']);
  return value.filter((source: Source) =>
    /^[a-z]+\.png$/.test(source.file) && /^[0-9a-f]{64}$/.test(source.sha256)
    && typeof source.author === 'string' && source.author.length > 0
    && /^(CC0|CC BY(?:-SA)? [234]\.0)$/.test(source.license)
    && [source.source, source.original].every((url) => url.startsWith('https://') && sourceHosts.has(new URL(url).hostname))
    && source.licenseUrl.startsWith('https://creativecommons.org/'),
  );
}

const palettes = [
  ['#183544', '#f7d9a9', '#ee826d', '#719396'], ['#3b293d', '#fde4be', '#ce7483', '#777ca8'],
  ['#12302d', '#c8dabb', '#efab5b', '#488d86'], ['#264764', '#e5dcbd', '#f2a279', '#93c6cc'],
  ['#3b2625', '#eed9bf', '#c96752', '#a4ac79'], ['#263046', '#e2ddf1', '#ea9672', '#9b93c1'],
];
const skins = ['#f2bc9c', '#e3ad75', '#bd805d', '#966148', '#744631', '#50312b'];
const hair = ['#261d21', '#473032', '#26252b', '#6e4638', '#211b24'];

function avatar(bytes: Buffer, colors: string[]) {
  const [base, paper, pop, tint] = colors;
  const tone = skins[bytes[1] % skins.length];
  const strands = hair[bytes[2] % hair.length];
  const hairlines = [
    '<path d="M43 59C35 25 88 10 99 45L97 68 81 51 66 58 57 48Z"/>',
    '<path d="M42 72C27 34 53 10 76 20 107 19 112 52 103 80L92 57 78 44 60 53 50 76Z"/>',
    '<path d="M41 64Q29 23 68 24Q105 12 100 64L86 47 70 50 56 47Z"/>',
    '<path d="M42 69Q28 27 60 21Q94 10 104 41L103 69 92 54 82 47 72 56 62 46 52 56Z"/>',
  ];
  const glasses = bytes[3] % 3 === 0 ? `<path d="M49 69h17v12H52z M78 69h17l-3 12H78z M66 72h12" fill="none" stroke="${base}" stroke-width="2"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
    <rect width="144" height="144" fill="${tint}"/><circle cx="${37 + bytes[4] % 65}" cy="44" r="43" fill="${paper}"/>
    <path d="M0 117Q48 87 144 122v22H0Z" fill="${base}"/>
    <path d="M29 144Q31 104 72 104q40 0 45 40Z" fill="${pop}"/>
    <path d="M61 93v18q10 8 22 0V93" fill="${tone}"/>
    <ellipse cx="72" cy="69" rx="30" ry="36" fill="${tone}"/>
    <g fill="${strands}">${hairlines[bytes[5] % hairlines.length]}</g>
    <path d="M62 73h-3m26 0h-3m-16 14q6 6 12 0" fill="none" stroke="${strands}" stroke-width="2.4" stroke-linecap="round"/>
    ${glasses}<circle cx="45" cy="84" r="2.5" fill="${paper}"/><circle cx="99" cy="84" r="2.5" fill="${paper}"/>
    <path d="M7 13h13m-6-6v12M122 111h13m-6-6v12" stroke="${paper}"/>
  </svg>`;
}

function cover(bytes: Buffer, colors: string[], art: Artwork) {
  const [ink, paper, accent, teal] = colors;
  const sun = 125 + bytes[1] % 260;
  const wave = 132 + bytes[2] % 45;
  const lines = Array.from({ length: 7 }, (_, i) => {
    const y = wave + i * 13;
    return `<path d="M0 ${y}Q115 ${y - 68} 240 ${y + 6}T480 ${y - 18}" stroke="${i % 2 ? paper : teal}" opacity=".52" fill="none"/>`;
  }).join('');
  const motifs = [
    `<path d="M14 262 156 79 226 262Z" fill="${teal}"/><path d="M192 262 342 71 477 262Z" fill="${ink}" opacity=".78"/>`,
    `<path d="M58 209V65h102v144Zm120 0V93h97v116Zm117 0V49h93v160Z" fill="${teal}" opacity=".84"/><path d="M54 200H420m-366-24H420m-366-24H420" stroke="${paper}" opacity=".35"/>`,
    `<path d="M0 244Q135 88 252 145T480 64V300H0Z" fill="${ink}" opacity=".72"/><path d="M0 276Q135 122 252 164T480 98" stroke="${paper}" stroke-width="3" fill="none"/>`,
    `<rect x="91" y="65" width="298" height="144" rx="72" fill="none" stroke="${ink}" stroke-width="24"/><ellipse cx="240" cy="137" rx="80" ry="68" fill="${teal}"/>`,
  ];
  const categories = ['Fotografia', 'Audiovisual', 'Música', 'Dança', 'Teatro', 'Design gráfico', 'Ilustração', 'Literatura'];
  const index = categories.indexOf(art.category);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="288" viewBox="0 0 480 288">
    <rect width="480" height="288" fill="${paper}"/>
    <circle cx="${sun}" cy="${79 + bytes[3] % 55}" r="${38 + bytes[4] % 39}" fill="${accent}"/>
    ${motifs[index >= 0 ? index % motifs.length : bytes[5] % motifs.length]}
    ${lines}
    <path d="M20 37V20h17m406 0h17v17m0 214v17h-17m-406 0H20v-17" stroke="${ink}" stroke-width="2" fill="none"/>
    <circle cx="${40 + bytes[6] % 392}" cy="248" r="${6 + bytes[7] % 13}" fill="${accent}"/>
  </svg>`;
}

function illustration(art: Artwork, variation: number) {
  const key = variation === 0 ? art.filename : `${art.filename}:${variation}`;
  const bytes = createHash('sha256').update(key).digest();
  const colors = palettes[bytes[0] % palettes.length];
  const svg = art.kind === 'avatar' ? avatar(bytes, colors) : cover(bytes, colors, art);
  return new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng();
}

export function prepareImages(plan: Plan, read: (filename: string) => Buffer = readFileSync) {
  const available = vettedSources();
  const reserved = new Set<string>();
  const hashes = new Set<string>();
  const rows: { filename: string; mime: string; conteudo: Uint8Array<ArrayBuffer> }[] = [];
  const credits: Credit[] = [];

  for (const art of plan.art) {
    const source = available.find((item) => item.category === art.category && item.kind === art.kind && !reserved.has(item.file));
    let content: Buffer | undefined;
    if (source) {
      reserved.add(source.file);
      try {
        const bytes = read(join(directory, source.file));
        if (validPng(bytes) && sha256(bytes) === source.sha256 && !hashes.has(source.sha256)) content = bytes;
      } catch {
        // O lote pode ser preparado sem rede e com o acervo local indisponível.
      }
    }
    const used = content ? source : undefined;
    content ??= illustration(art, 0);
    let digest = sha256(content);
    for (let variation = 1; hashes.has(digest) && variation <= 4; variation++) {
      content = illustration(art, variation);
      digest = sha256(content);
    }
    if (!validPng(content) || hashes.has(digest)) throw new Error(`Arte inválida ou duplicada: ${art.filename}`);
    hashes.add(digest);
    rows.push({ filename: art.filename, mime: 'image/png', conteudo: Uint8Array.from(content) });
    const attribution = used
      ? `Imagem ilustrativa: ${used.author} · ${used.license} · ${used.source} · versão reduzida.`
      : 'Ilustração original gerada para a demonstração do Arthere.';
    credits.push({
      ...art, sha256: digest, bytes: content.length, url: `/uploads/${art.filename}`,
      source: used?.source ?? 'Ilustração procedural do seed',
      original: used?.original ?? null, author: used?.author ?? 'Arthere Intelligent Data Seed',
      license: used?.license ?? 'CC0 1.0', licenseUrl: used?.licenseUrl ?? 'https://creativecommons.org/publicdomain/zero/1.0/',
      attribution, status: source && !used ? 'fallback-validado' : 'validada',
    });
  }
  return { rows, credits };
}

export function withImageCredits(plan: Plan, credits: Credit[]) {
  const credited = new Map(credits.filter((item) => item.original !== null).map((item) => [item.owner, item.attribution]));
  return {
    works: plan.works.map((work) => credited.has(work.id!) ? { ...work, descricao: `${work.descricao}\n\n${credited.get(work.id!)}` } : work),
    events: plan.events.map((event) => credited.has(event.id!) ? { ...event, descricao: `${event.descricao}\n\n${credited.get(event.id!)}` } : event),
  };
}
