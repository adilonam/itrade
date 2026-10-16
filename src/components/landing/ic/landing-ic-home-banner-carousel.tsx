'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { landingHomeBannerCarouselItems, landingHomeBannerIntroVideoSrc } from '@/constants/data';
import { withAppName } from '@/lib/public-app-name';

const ROTATION_MS = 6000;

type LandingIcHomeBannerCarouselProps = {
  appName: string;
  ctaHref: string;
};

export function LandingIcHomeBannerCarousel({ appName, ctaHref }: LandingIcHomeBannerCarouselProps) {
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const rotationTimerRef = useRef<number | null>(null);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const slideVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const introFinishedRef = useRef(false);

  const stopRotation = useCallback(() => {
    if (rotationTimerRef.current !== null) {
      window.clearInterval(rotationTimerRef.current);
      rotationTimerRef.current = null;
    }
  }, []);

  const startRotation = useCallback(() => {
    stopRotation();

    rotationTimerRef.current = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % landingHomeBannerCarouselItems.length);
    }, ROTATION_MS);
  }, [stopRotation]);

  const finishIntro = useCallback((index = 0) => {
    if (introFinishedRef.current) return;
    introFinishedRef.current = true;
    introVideoRef.current?.pause();
    setShowIntroVideo(false);
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (!showIntroVideo) {
      startRotation();
    }

    return stopRotation;
  }, [showIntroVideo, startRotation, stopRotation]);

  useEffect(() => {
    if (showIntroVideo) return;

    slideVideoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === activeIndex) {
        void video.play();
      } else {
        video.pause();
      }
    });
  }, [activeIndex, showIntroVideo]);

  const goToSlide = useCallback(
    (index: number) => {
      if (showIntroVideo) {
        finishIntro(index);
        return;
      }

      setActiveIndex(index);
      startRotation();
    },
    [finishIntro, showIntroVideo, startRotation]
  );

  const dotActiveIndex = showIntroVideo ? 0 : activeIndex;

  return (
    <>
      {showIntroVideo ? (
        <video
          ref={introVideoRef}
          src={landingHomeBannerIntroVideoSrc}
          autoPlay
          muted
          playsInline
          onEnded={() => finishIntro(0)}
          className='absolute inset-0 size-full object-cover object-center'
        />
      ) : null}

      <div className={`pointer-events-none absolute inset-0 ${showIntroVideo ? 'invisible' : ''}`}>
        {landingHomeBannerCarouselItems.map((slide, index) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === activeIndex ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={index !== activeIndex}
          >
            {'isVideo' in slide && slide.isVideo ? (
              <video
                ref={(element) => {
                  slideVideoRefs.current[index] = element;
                }}
                src={slide.src}
                muted
                loop
                playsInline
                className='absolute inset-0 size-full object-cover object-center'
              />
            ) : (
              <Image
                src={slide.src}
                alt={withAppName(slide.alt, appName)}
                fill
                priority={index === 0}
                unoptimized={'unoptimized' in slide && slide.unoptimized === true}
                sizes='100vw'
                className='object-cover object-center'
              />
            )}
          </div>
        ))}
      </div>

      {!showIntroVideo
        ? landingHomeBannerCarouselItems.map((slide, index) => {
            if (!('heroCopy' in slide)) {
              return null;
            }

            const { heroCopy } = slide;
            const isActive = index === activeIndex;
            const isCenter = heroCopy.align === 'center';
            const href =
              'ctaHref' in heroCopy ? (heroCopy.ctaHref ?? ctaHref) : ctaHref;

            return (
              <div
                key={`hero-${slide.src}`}
                className={`pointer-events-none absolute inset-0 z-10 flex items-center transition-opacity duration-700 ease-in-out ${
                  isCenter ? 'justify-center px-6' : 'justify-start px-6 lg:px-12'
                } ${isActive ? 'opacity-100' : 'opacity-0'}`}
                aria-hidden={!isActive}
              >
                <div
                  className={`flex max-w-3xl flex-col space-y-4 ${
                    isCenter ? 'items-center text-center' : 'max-w-2xl items-start text-left'
                  }`}
                >
                  <h1
                    className={`text-4xl font-bold text-white md:text-5xl lg:text-6xl ${
                      isCenter ? '' : 'leading-tight whitespace-pre-line'
                    }`}
                  >
                    {heroCopy.headline}
                  </h1>
                  <p
                    className={`text-base md:text-lg ${
                      isCenter ? 'max-w-xl text-white' : 'max-w-lg text-slate-300'
                    }`}
                  >
                    {heroCopy.subheadline}
                  </p>
                  <Link
                    href={href}
                    className={`mt-2 rounded bg-[#00ff44] px-8 py-3 text-sm font-bold text-black transition hover:bg-[#00cc36] ${
                      isActive ? 'pointer-events-auto' : 'pointer-events-none'
                    }`}
                  >
                    {heroCopy.ctaLabel}
                  </Link>
                </div>
                {'disclaimer' in heroCopy && heroCopy.disclaimer ? (
                  <p className='absolute bottom-14 left-1/2 max-w-xl -translate-x-1/2 text-center text-[10px] text-white/70 md:text-xs'>
                    {heroCopy.disclaimer}
                  </p>
                ) : null}
              </div>
            );
          })
        : null}

      <div className='pointer-events-auto absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 gap-2 py-2'>
        {landingHomeBannerCarouselItems.map((slide, index) => (
          <button
            key={slide.src}
            type='button'
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === dotActiveIndex}
            onClick={() => goToSlide(index)}
            className={`h-1 rounded transition-all duration-300 ${
              index === dotActiveIndex ? 'w-8 bg-[#00ff44]' : 'w-8 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </>
  );
}
