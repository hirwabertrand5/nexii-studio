import React, { useEffect, useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  useEffect(() => {
    setDidError(false)
  }, [props.src])

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, loading, decoding, sizes, fetchPriority, ...rest } = props
  const resolvedLoading = loading ?? 'lazy'
  const resolvedDecoding = decoding ?? 'async'
  const resolvedSizes = sizes ?? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  // default classes to ensure images always fill the reserved tile and behave consistently
  const baseImgClasses = 'block h-full w-full object-cover object-center transition-transform duration-300 ease-out transform-gpu'
  const finalClassName = [className, baseImgClasses].filter(Boolean).join(' ')

  return didError ? (
    <div
      className={`inline-block h-full w-full overflow-hidden bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex h-full w-full items-center justify-center">
        <img
          src={ERROR_IMG_SRC}
          alt="Error loading image"
          className={baseImgClasses}
          loading={resolvedLoading}
          decoding={resolvedDecoding}
          sizes={resolvedSizes}
          {...rest}
          data-original-url={src}
        />
      </div>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className={finalClassName}
      style={style}
      loading={resolvedLoading}
      decoding={resolvedDecoding}
      sizes={resolvedSizes}
      {...rest}
      onError={handleError}
    />
  )
}
