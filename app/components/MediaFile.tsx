import {Image} from '~/components/Image';
import type {
  Media,
  MediaImage,
  Video as MediaVideo,
} from '@shopify/hydrogen/storefront-api-types';

type MediaFileProps = {
  data: Media | MediaImage | MediaVideo;
  className?: string;
  mediaOptions?: {
    image?: {
      crop?: string;
      sizes?: string;
      alt?: string;
      loading?: HTMLImageElement['loading'];
    };
    video?: {
      controls?: boolean;
      muted?: boolean;
      loop?: boolean;
      playsInline?: boolean;
      autoPlay?: boolean;
      previewImageOptions?: {src?: string};
    };
  };
};

export function MediaFile({data, className, mediaOptions}: MediaFileProps) {
  if (data.mediaContentType === 'IMAGE') {
    const media = data as MediaImage;
    if (!media.image) return null;
    return (
      <Image
        data={media.image}
        className={className}
        sizes={mediaOptions?.image?.sizes}
        loading={mediaOptions?.image?.loading}
        alt={mediaOptions?.image?.alt ?? media.alt ?? ''}
      />
    );
  }

  if (data.mediaContentType === 'VIDEO') {
    const video = data as MediaVideo;
    const opts = mediaOptions?.video ?? {};
    return (
      <video
        className={className}
        controls={opts.controls}
        muted={opts.muted}
        loop={opts.loop}
        playsInline={opts.playsInline}
        autoPlay={opts.autoPlay}
        poster={opts.previewImageOptions?.src}
      >
        {video.sources?.map((source) => (
          <source
            key={source.url}
            src={source.url}
            type={source.mimeType ?? undefined}
          />
        ))}
      </video>
    );
  }

  return null;
}
