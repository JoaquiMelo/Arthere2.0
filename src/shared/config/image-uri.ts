/** URLs usadas como demonstração pelo código antigo; não são fotos de usuários. */
export function realImageUri(value?: string | null): string {
  const uri = value?.trim() || '';
  if (/^https?:\/\/(?:i\.)?pravatar\.cc(?:\/|$)/i.test(uri)) return '';
  if (/^https?:\/\/picsum\.photos\/seed\/arthere-/i.test(uri)) return '';
  if (/^https?:\/\/images\.unsplash\.com\/photo-(?:1600607687939-ce8a6c25118c|1556761175-b413da4baf72|1506157786151-b8491531f063)(?:\?|$)/i.test(uri)) return '';
  return uri;
}
