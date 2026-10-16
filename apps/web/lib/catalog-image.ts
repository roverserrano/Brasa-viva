/** Only local assets or public Storage images from this project's Supabase origin. */
export function resolveCatalogImage(
  imageUrl: string | null,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
): string | null {
  if (!imageUrl) return null;
  if (/^\/images\/[a-zA-Z0-9/_-]+\.(webp|avif|png|jpe?g)$/.test(imageUrl)) return imageUrl;
  try {
    const image = new URL(imageUrl);
    const supabase = new URL(supabaseUrl ?? '');
    return image.protocol === 'https:' &&
      supabase.protocol === 'https:' &&
      image.origin === supabase.origin &&
      !image.username &&
      !image.password &&
      image.pathname.startsWith('/storage/v1/object/public/')
      ? image.href
      : null;
  } catch {
    return null;
  }
}
