'use client';

import { useEffect, useState } from 'react';

export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        @keyframes water-ripple-1 {
          0% {
            transform: scale(1);
            border-radius: 64% 36% 47% 53% / 55% 48% 52% 45%;
          }
          14% {
            border-radius: 46% 54% 50% 50% / 50% 60% 40% 50%;
          }
          28% {
            border-radius: 58% 42% 55% 45% / 48% 45% 55% 52%;
          }
          42% {
            border-radius: 40% 60% 42% 58% / 53% 65% 35% 47%;
          }
          57% {
            border-radius: 55% 45% 61% 39% / 42% 50% 50% 58%;
          }
          71% {
            border-radius: 48% 52% 38% 62% / 60% 38% 62% 40%;
          }
          85% {
            border-radius: 62% 38% 52% 48% / 46% 55% 45% 54%;
          }
          100% {
            transform: scale(1);
            border-radius: 64% 36% 47% 53% / 55% 48% 52% 45%;
          }
        }

        @keyframes water-ripple-2 {
          0% {
            transform: scale(1);
            border-radius: 38% 62% 56% 44% / 49% 56% 44% 51%;
          }
          12% {
            border-radius: 52% 48% 38% 62% / 62% 35% 65% 38%;
          }
          25% {
            border-radius: 44% 56% 48% 52% / 40% 61% 39% 60%;
          }
          37% {
            border-radius: 61% 39% 55% 45% / 56% 48% 52% 44%;
          }
          50% {
            border-radius: 35% 65% 42% 58% / 45% 70% 30% 55%;
          }
          62% {
            border-radius: 50% 50% 60% 40% / 58% 42% 58% 42%;
          }
          75% {
            border-radius: 58% 42% 45% 55% / 38% 55% 45% 62%;
          }
          87% {
            border-radius: 42% 58% 53% 47% / 51% 60% 40% 49%;
          }
          100% {
            transform: scale(1);
            border-radius: 38% 62% 56% 44% / 49% 56% 44% 51%;
          }
        }

        @keyframes water-ripple-3 {
          0% {
            transform: scale(1);
            border-radius: 56% 44% 41% 59% / 61% 42% 58% 39%;
          }
          16% {
            border-radius: 41% 59% 65% 35% / 44% 68% 32% 56%;
          }
          33% {
            border-radius: 63% 37% 48% 52% / 57% 38% 62% 43%;
          }
          50% {
            border-radius: 37% 63% 59% 41% / 35% 60% 40% 65%;
          }
          66% {
            border-radius: 54% 46% 35% 65% / 52% 47% 53% 48%;
          }
          83% {
            border-radius: 46% 54% 52% 48% / 68% 55% 45% 32%;
          }
          100% {
            transform: scale(1);
            border-radius: 56% 44% 41% 59% / 61% 42% 58% 39%;
          }
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Blob 1 - Electric blue gradient, top-right */}
        <div
          className="absolute -top-12 -right-12 w-[380px] h-[380px] bg-linear-to-br from-[#60A5FA] to-[#3B82F6] opacity-[0.15] dark:from-[#60A5FA] dark:to-[#2563EB] dark:opacity-[0.40]"
          style={{ animation: 'water-ripple-1 18s ease-in-out infinite' }}
        />

        {/* Blob 2 - Vibrant purple gradient, bottom-left */}
        <div
          className="absolute -bottom-16 -left-16 w-[420px] h-[420px] bg-linear-to-tr from-[#C084FC] to-[#A855F7] opacity-[0.18] dark:from-[#C084FC] dark:to-[#9333EA] dark:opacity-[0.45]"
          style={{ animation: 'water-ripple-2 20s ease-in-out infinite' }}
        />

        {/* Blob 3 - Cyan gradient, top center */}
        <div
          className="absolute -top-8 left-1/3 w-[340px] h-[340px] bg-linear-to-bl from-[#22D3EE] to-[#06B6D4] opacity-[0.16] dark:from-[#22D3EE] dark:to-[#0891B2] dark:opacity-[0.35]"
          style={{ animation: 'water-ripple-3 16s ease-in-out infinite' }}
        />
      </div>
    </>
  );
}
