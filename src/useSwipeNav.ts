import { useEffect, useRef } from 'react';

const WHEEL_THRESHOLD = 60; // cumulative horizontal deltaX before triggering a section change
const TOUCH_THRESHOLD = 70; // px of finger travel before triggering
const COOLDOWN_MS = 450; // roughly matches the slide transition duration - prevents double-triggers mid-animation

// Horizontal swipe/trackpad-scroll navigation between sections. Deliberately
// does nothing once you're already at the first/last section instead of
// letting the gesture fall through to the OS/webview's own overscroll
// bounce (which is what was revealing blank white edges before).
export function useSwipeNav(onSwipe: (dir: 'prev' | 'next') => void, enabled: boolean) {
  const accum = useRef(0);
  const decayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFired = useRef(0);
  const touchStartX = useRef<number | null>(null);
  const touchFired = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const fire = (dir: 'prev' | 'next') => {
      const now = Date.now();
      if (now - lastFired.current < COOLDOWN_MS) return;
      lastFired.current = now;
      onSwipe(dir);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // that's pinch-zoom, handled separately
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return; // mostly-vertical scroll, ignore
      accum.current += e.deltaX;
      if (Math.abs(accum.current) > WHEEL_THRESHOLD) {
        fire(accum.current > 0 ? 'next' : 'prev');
        accum.current = 0;
      }
      if (decayTimer.current) clearTimeout(decayTimer.current);
      decayTimer.current = setTimeout(() => { accum.current = 0; }, 250);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX.current = e.touches[0].clientX;
        touchFired.current = false;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchFired.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      if (Math.abs(dx) > TOUCH_THRESHOLD) {
        touchFired.current = true;
        // Dragging a finger left reveals the section to the left, and vice versa.
        fire(dx < 0 ? 'prev' : 'next');
      }
    };
    const onTouchEnd = () => {
      touchStartX.current = null;
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (decayTimer.current) clearTimeout(decayTimer.current);
    };
  }, [enabled, onSwipe]);
}
