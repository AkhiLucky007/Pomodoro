import { useEffect, useRef, useState } from 'react';

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 1.75;

function clamp(v: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v));
}

function touchDistance(touches: TouchList): number {
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

// Pinch-to-zoom implemented purely in JS/CSS so it behaves identically on
// WebView2 (Windows), WebKitGTK (Linux), and WKWebView (macOS) - all three
// run the same web content, so there's no native per-platform API to wire
// up (that approach only ever covered one OS anyway). Two independent
// gesture sources are handled:
//  - trackpad pinch, which every major engine normalizes to `wheel` events
//    with `ctrlKey: true`
//  - genuine two-finger touch pinch, via the standard Touch Events API
export function usePinchZoom() {
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const next = clamp(zoomRef.current - e.deltaY * 0.01);
      zoomRef.current = next;
      setZoom(next);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStart.current = { dist: touchDistance(e.touches), zoom: zoomRef.current };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStart.current) {
        e.preventDefault();
        const ratio = touchDistance(e.touches) / pinchStart.current.dist;
        const next = clamp(pinchStart.current.zoom * ratio);
        zoomRef.current = next;
        setZoom(next);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchStart.current = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+0 resets zoom, matching the standard browser shortcut.
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        zoomRef.current = 1;
        setZoom(1);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return zoom;
}
