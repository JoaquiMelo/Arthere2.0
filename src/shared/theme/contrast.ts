/** Utilitários para as cores hexadecimais opacas das paletas do Arthere. */
function channels(hex: string): number[] {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function mix(first: string, second: string, amount: number): string {
  const target = channels(second);
  return '#' + channels(first).map((value, index) =>
    Math.round(value + (target[index] - value) * amount).toString(16).padStart(2, '0'),
  ).join('');
}

/** Preserva a cor preferida se legível; adapta apenas o primeiro plano.
 * As superfícies das paletas atuais são claras, ou recebem um único fundo escuro.
 */
export function readableColor(preferred: string, backgrounds: readonly string[]): string {
  const minimum = (color: string) => Math.min(...backgrounds.map((bg) => contrastRatio(color, bg)));
  if (minimum(preferred) >= 4.5) return preferred;
  const target = minimum('#000000') >= minimum('#FFFFFF') ? '#000000' : '#FFFFFF';
  for (let step = 1; step <= 20; step += 1) {
    const candidate = mix(preferred, target, step / 20);
    if (minimum(candidate) >= 4.5) return candidate;
  }
  return target;
}
