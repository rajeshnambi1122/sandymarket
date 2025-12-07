import { ImgHTMLAttributes, useState } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
}

/**
 * OptimizedImage component that uses WebP with automatic fallback
 * Usage: <OptimizedImage src="/images/pizza1.jpg" alt="Pizza" />
 * It will automatically try to load pizza1.webp first, then fallback to pizza1.jpg
 */
export const OptimizedImage = ({ 
  src, 
  alt, 
  fallbackSrc, 
  ...props 
}: OptimizedImageProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Convert .jpg/.png to .webp
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const actualFallback = fallbackSrc || src;

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(actualFallback);
    }
  };

  // Use WebP if supported and available, otherwise use original
  const finalSrc = hasError ? actualFallback : webpSrc;

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        {...props}
        src={finalSrc}
        alt={alt}
        onError={handleError}
      />
    </picture>
  );
};

export default OptimizedImage;

