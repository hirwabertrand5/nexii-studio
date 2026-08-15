import { useEffect, useMemo, useState, type ImgHTMLAttributes, type ReactEventHandler } from "react";
import { buildResponsiveSrcSet, isCloudinaryDeliveryUrl } from "@/shared/utils/image";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0cm9rZT0iI2RkZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4=";

export type NexiiImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  responsiveWidths?: number[];
  priority?: boolean;
  fallbackSrc?: string;
};

export function NexiiImage({
  src,
  alt,
  style,
  className,
  loading,
  decoding,
  sizes,
  fetchPriority,
  responsiveWidths = [320, 480, 640, 800, 1200, 1600],
  priority = false,
  fallbackSrc,
  onError,
  srcSet,
  ...rest
}: NexiiImageProps) {
  const [didError, setDidError] = useState(false);

  useEffect(() => {
    setDidError(false);
  }, [src]);

  const resolvedLoading = loading ?? (priority ? "eager" : "lazy");
  const resolvedDecoding = decoding ?? "async";
  const resolvedFetchPriority = fetchPriority ?? (priority ? "high" : undefined);
  const resolvedSizes = sizes ?? "(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw";
  const resolvedSrc = typeof src === "string" ? src : "";

  const computedSrcSet = useMemo(() => {
    if (srcSet) return srcSet;
    if (!resolvedSrc || !isCloudinaryDeliveryUrl(resolvedSrc)) return undefined;
    return buildResponsiveSrcSet(resolvedSrc, responsiveWidths);
  }, [responsiveWidths, resolvedSrc, srcSet]);

  const handleError: ReactEventHandler<HTMLImageElement> = (event) => {
    setDidError(true);
    onError?.(event);
  };

  const baseImgClasses = "block h-full w-full object-cover object-center";
  const finalClassName = [className, baseImgClasses].filter(Boolean).join(" ");

  if (didError) {
    return (
      <div
        className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-muted ${className ?? ""}`}
        style={style}
        aria-label={alt}
      >
        <img
          src={fallbackSrc ?? ERROR_IMG_SRC}
          alt={alt}
          className="h-full w-full object-contain p-4 opacity-80"
          loading="lazy"
          decoding="async"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={finalClassName}
      style={style}
      loading={resolvedLoading}
      decoding={resolvedDecoding}
      fetchPriority={resolvedFetchPriority}
      sizes={resolvedSizes}
      srcSet={computedSrcSet}
      onError={handleError}
      {...rest}
    />
  );
}

export function ImageWithFallback(props: NexiiImageProps) {
  return <NexiiImage {...props} />;
}
