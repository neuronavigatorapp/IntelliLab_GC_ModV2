import { useState, useCallback } from 'react';

/**
 * Hook to handle image fallback from PNG to JPG format
 * 
 * @param primarySrc - The primary image source (PNG)
 * @param fallbackSrc - The fallback image source (JPG)
 * @returns The current image source to use
 * 
 * @example
 * ```tsx
 * const logoSrc = useImageWithFallback(
 *   '/IntelliLab_GC_logo.png',
 *   '/IntelliLab_GC_logo.jpg'
 * );
 * 
 * return <img src={logoSrc} alt="Logo" onError={handleError} />;
 * ```
 */
export const useImageWithFallback = (
  primarySrc: string,
  fallbackSrc: string
): string => {
  const [currentSrc, setCurrentSrc] = useState(primarySrc);
  const [hasFallenBack, setHasFallenBack] = useState(false);

  const handleError = useCallback(() => {
    if (!hasFallenBack && currentSrc === primarySrc) {
      setCurrentSrc(fallbackSrc);
      setHasFallenBack(true);
    }
  }, [currentSrc, fallbackSrc, hasFallenBack, primarySrc]);

  return currentSrc;
};

/**
 * Hook that returns both the current source and error handler
 * for easier integration with img elements
 */
export const useImageWithFallbackHandler = (
  primarySrc: string,
  fallbackSrc: string
): { src: string; onError: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void } => {
  const [currentSrc, setCurrentSrc] = useState(primarySrc);
  const [hasFallenBack, setHasFallenBack] = useState(false);

  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasFallenBack && currentSrc === primarySrc) {
      setCurrentSrc(fallbackSrc);
      setHasFallenBack(true);
    }
  }, [currentSrc, fallbackSrc, hasFallenBack, primarySrc]);

  return {
    src: currentSrc,
    onError: handleError
  };
};
