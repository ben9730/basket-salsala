import type { SupabaseClient } from '@supabase/supabase-js';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

const PUBLIC_URL_SEGMENT = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;

export function buildUploadPath(productId: string, file: File): string {
  const ext = extensionFor(file);
  const uuid =
    typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : fallbackUuid();
  return `${productId}/${uuid}.${ext}`;
}

export function pathFromPublicUrl(url: string): string | null {
  const idx = url.indexOf(PUBLIC_URL_SEGMENT);
  if (idx === -1) return null;
  return url.slice(idx + PUBLIC_URL_SEGMENT.length);
}

export async function deleteImages(
  supabase: SupabaseClient,
  urls: string[],
): Promise<void> {
  if (urls.length === 0) return;
  const paths = urls.map(pathFromPublicUrl).filter((p): p is string => !!p);
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
  if (error) console.error('[storage] deleteImages failed', error, paths);
}

export async function deleteProductPrefix(
  supabase: SupabaseClient,
  productId: string,
  knownUrls: string[],
): Promise<void> {
  await deleteImages(supabase, knownUrls);
}

function extensionFor(file: File): string {
  const fromType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const byType = fromType[file.type];
  if (byType) return byType;
  const match = /\.([a-z0-9]+)$/i.exec(file.name);
  return match ? match[1].toLowerCase() : 'bin';
}

function fallbackUuid(): string {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
