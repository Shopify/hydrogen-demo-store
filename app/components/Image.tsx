import {forwardRef, type ImgHTMLAttributes} from 'react';

type ShopifyImageData = {
  url?: string | null;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

export type ImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'width' | 'height'
> & {
  data?: ShopifyImageData | null;
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: string;
  sizes?: string;
};

const WIDTHS = [300, 400, 500, 700, 900, 1200, 1600, 2000];

function withWidth(url: string, width: number) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('width', String(width));
    return parsed.toString();
  } catch {
    return url;
  }
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  {data, src, alt, width, height, aspectRatio, sizes, style, ...passthrough},
  ref,
) {
  const url = data?.url ?? src;
  if (!url) return null;

  const resolvedAlt = alt ?? data?.altText ?? '';
  const useSrcSet = Boolean(sizes) || width == null;
  const srcSet = useSrcSet
    ? WIDTHS.map((w) => `${withWidth(url, w)} ${w}w`).join(', ')
    : undefined;

  return (
    <img
      ref={ref}
      src={width != null ? withWidth(url, Number(width)) : url}
      srcSet={srcSet}
      sizes={sizes}
      alt={resolvedAlt}
      width={width}
      height={height}
      style={aspectRatio ? {aspectRatio, ...style} : style}
      {...passthrough}
    />
  );
});
