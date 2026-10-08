import type {Image as ImageType} from '@shopify/hydrogen/storefront-api-types';

type Crop = 'center' | 'top' | 'bottom' | 'left' | 'right';

type ShopifyImageOptions = {
  width?: number;
  height?: number;
  crop?: Crop;
};

const SHOPIFY_CDN_HOSTS = ['cdn.shopify.com', 'mock.shop'];
const RESPONSIVE_WIDTHS = [352, 704, 1056, 1408, 1760];

function isShopifyImageHost(hostname: string) {
  return SHOPIFY_CDN_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  );
}

export function shopifyImageUrl(
  url: string,
  options: ShopifyImageOptions = {},
) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (!isShopifyImageHost(parsed.hostname)) return url;

  if (options.width) {
    parsed.searchParams.set('width', String(Math.round(options.width)));
  }
  if (options.height) {
    parsed.searchParams.set('height', String(Math.round(options.height)));
  }
  if (options.crop) parsed.searchParams.set('crop', options.crop);

  return parsed.toString();
}

function parseAspectRatio(aspectRatio?: string) {
  if (!aspectRatio) return undefined;
  const [ratioWidth, ratioHeight] = aspectRatio.split('/').map(Number);
  if (!ratioWidth || !ratioHeight) return undefined;
  return ratioWidth / ratioHeight;
}

type ImageProps = Omit<
  React.ComponentProps<'img'>,
  'width' | 'height' | 'src'
> & {
  data?: Pick<
    Partial<ImageType>,
    'url' | 'altText' | 'width' | 'height'
  > | null;
  src?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  crop?: Crop;
};

export function Image({
  data,
  src,
  alt,
  width,
  height,
  sizes,
  aspectRatio,
  crop = 'center',
  loading = 'lazy',
  style,
  ...rest
}: ImageProps) {
  const url = src ?? data?.url;
  if (!url) return null;

  const ratio =
    parseAspectRatio(aspectRatio) ??
    (width && height ? width / height : undefined);
  const altText = alt ?? data?.altText ?? '';

  if (width) {
    const fixedHeight =
      height ?? (ratio ? Math.round(width / ratio) : undefined);
    const params = {
      width,
      height: fixedHeight,
      crop: fixedHeight ? crop : undefined,
    };

    return (
      <img
        src={shopifyImageUrl(url, params)}
        srcSet={`${shopifyImageUrl(url, params)} 1x, ${shopifyImageUrl(url, {
          ...params,
          width: width * 2,
          height: fixedHeight ? fixedHeight * 2 : undefined,
        })} 2x`}
        width={width}
        height={fixedHeight}
        alt={altText}
        loading={loading}
        decoding="async"
        style={style}
        {...rest}
      />
    );
  }

  const srcSet = RESPONSIVE_WIDTHS.map((srcWidth) => {
    const srcHeight = ratio ? Math.round(srcWidth / ratio) : undefined;
    const sizedUrl = shopifyImageUrl(url, {
      width: srcWidth,
      height: srcHeight,
      crop: srcHeight ? crop : undefined,
    });
    return `${sizedUrl} ${srcWidth}w`;
  }).join(', ');

  const defaultWidth = RESPONSIVE_WIDTHS[1];

  return (
    <img
      src={shopifyImageUrl(url, {
        width: defaultWidth,
        height: ratio ? Math.round(defaultWidth / ratio) : undefined,
        crop: ratio ? crop : undefined,
      })}
      srcSet={srcSet}
      sizes={sizes ?? '100vw'}
      alt={altText}
      loading={loading}
      decoding="async"
      style={{width: '100%', aspectRatio, ...style}}
      {...rest}
    />
  );
}
