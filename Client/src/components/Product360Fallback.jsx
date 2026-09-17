import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, X, Play, Pause } from 'lucide-react';

/**
 * Product360Fallback
 * Amazon-grade 360° spin viewer built against a plain ordered URL array.
 *
 * Rendering strategy: frames are decoded once into Image objects and painted
 * onto a <canvas> with drawImage — never by swapping an <img src>. Swapping
 * src forces the browser to decode + layout + paint per frame, which is what
 * produced the visible "flipping between pictures" feel. Canvas blits are a
 * straight GPU-composited copy, so a frame change is a single fast draw call.
 *
 * Drag handling: pointer events are captured on the container and every
 * move only records the latest pointer position + timestamp in a ref. A
 * single requestAnimationFrame loop (running only while dragging) reads the
 * *total* distance travelled since drag start and computes the target frame
 * from that continuous value every tick. The previous implementation instead
 * updated frame state directly inside the mousemove/touchmove handler and
 * "snapped" its reference point every time a step fired — since those events
 * can fire faster than the screen can paint, and the reference point reset
 * introduced small clock skew, frames advanced in visible chunks instead of
 * one smooth pass. Deriving the frame fresh from total distance every
 * animation frame removes that drift and caps updates to display refresh
 * rate, which is what makes it read as rotation instead of a slideshow.
 */
const Product360Fallback = ({ images = [], onClose, productName = 'Product' }) => {
  const frameCount = images.length;
  const [frame, setFrame] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showHint, setShowHint] = useState(true);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });

  const dragState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    frameAtStart: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    panStart: { x: 0, y: 0 },
  });

  const rafRef = useRef(null);
  const momentumRafRef = useRef(null);
  const autoplayRef = useRef(null);
  const preloaded = useRef([]);

  useEffect(() => {
    if (frameCount === 0) return;
    let cancelled = false;
    let count = 0;
    preloaded.current = new Array(frameCount);

    images.forEach((src, i) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      const onDone = () => {
        if (cancelled) return;
        count += 1;
        preloaded.current[i] = img;
        setLoadedCount(count);
        if (count === frameCount) setReady(true);
      };
      if (img.decode) {
        img.decode().then(onDone).catch(onDone);
      } else {
        img.onload = img.onerror = onDone;
      }
    });

    return () => { cancelled = true; };
  }, [images, frameCount]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const img = preloaded.current[frameRef.current];
    if (!img || !img.width) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const scale = Math.max(cw / img.width, ch / img.height) * zoomRef.current;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const dx = (cw - drawW) / 2 + panRef.current.x;
    const dy = (ch - drawH) / 2 + panRef.current.y;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, dx, dy, drawW, drawH);
  }, []);

  useEffect(() => { frameRef.current = frame; draw(); }, [frame, draw]);
  useEffect(() => { zoomRef.current = zoom; draw(); }, [zoom, draw]);
  useEffect(() => { panRef.current = panOffset; draw(); }, [panOffset, draw]);
  useEffect(() => { if (ready) draw(); }, [ready, draw]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    if (!ready || !autoplay || isDragging || frameCount < 2) return;
    let ticks = 0;
    const interval = 160 / playbackSpeed;
    autoplayRef.current = setInterval(() => {
      if (ticks >= frameCount - 1) {
        setAutoplay(false);
        return;
      }
      ticks += 1;
      setFrame(f => (f + 1) % frameCount);
    }, interval);
    return () => clearInterval(autoplayRef.current);
  }, [ready, autoplay, isDragging, frameCount, playbackSpeed]);

  const stopAutoplay = useCallback(() => {
    setAutoplay(false);
    clearInterval(autoplayRef.current);
  }, []);

  const PX_PER_FRAME = Math.max(6, Math.round(300 / frameCount));

  const trackLoop = useCallback(() => {
    if (!dragState.current.active) return;
    const totalDeltaX = dragState.current.lastX - dragState.current.startX;
    const steps = Math.trunc(totalDeltaX / PX_PER_FRAME);
    let next = (dragState.current.frameAtStart - steps) % frameCount;
    if (next < 0) next += frameCount;
    setFrame(prev => (prev === next ? prev : next));
    rafRef.current = requestAnimationFrame(trackLoop);
  }, [frameCount, PX_PER_FRAME]);

  const handlePointerDown = (e) => {
    if (!ready) return;
    stopAutoplay();
    setShowHint(false);
    if (momentumRafRef.current) cancelAnimationFrame(momentumRafRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    containerRef.current?.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      frameAtStart: frameRef.current,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: performance.now(),
      velocity: 0,
      panStart: { ...panRef.current },
    };
    rafRef.current = requestAnimationFrame(trackLoop);
  };

  const handlePointerMove = (e) => {
    if (!dragState.current.active) return;
    const now = performance.now();
    const dt = now - dragState.current.lastT;
    const dxSinceLast = e.clientX - dragState.current.lastX;

    if (zoomRef.current > 1) {
      setPanOffset({
        x: dragState.current.panStart.x + (e.clientX - dragState.current.startX),
        y: dragState.current.panStart.y + (e.clientY - dragState.current.startY),
      });
    } else if (dt > 0) {
      dragState.current.velocity = (-dxSinceLast / PX_PER_FRAME) * (16 / dt) * 0.65;
    }

    dragState.current.lastX = e.clientX;
    dragState.current.lastY = e.clientY;
    dragState.current.lastT = now;
  };

  const applyMomentum = useCallback(() => {
    const decay = () => {
      dragState.current.velocity *= 0.9;
      if (Math.abs(dragState.current.velocity) < 0.15) {
        momentumRafRef.current = null;
        return;
      }
      setFrame(f => {
        const step = dragState.current.velocity;
        let next = Math.round(f + step) % frameCount;
        if (next < 0) next += frameCount;
        return next;
      });
      momentumRafRef.current = requestAnimationFrame(decay);
    };
    momentumRafRef.current = requestAnimationFrame(decay);
  }, [frameCount]);

  const handlePointerUp = (e) => {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    containerRef.current?.releasePointerCapture?.(e.pointerId);
    setIsDragging(false);
    if (zoomRef.current === 1 && Math.abs(dragState.current.velocity) > 0.3) applyMomentum();
  };

  const handleWheel = (e) => {
    e.preventDefault();
    stopAutoplay();
    setZoom(z => Math.min(3, Math.max(1, z - e.deltaY * 0.0015)));
  };

  const ZOOM_STEP = 0.5;

  const zoomIn = () => {
    stopAutoplay();
    setZoom(z => Math.min(3, z + ZOOM_STEP));
  };

  const zoomOut = () => {
    stopAutoplay();
    setZoom(z => {
      const next = Math.max(1, z - ZOOM_STEP);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (momentumRafRef.current) cancelAnimationFrame(momentumRafRef.current);
    clearInterval(autoplayRef.current);
  }, []);

  const progress = frameCount ? Math.round((loadedCount / frameCount) * 100) : 0;

  return (
    <div className="relative w-full h-full bg-neutral-50 select-none overflow-hidden rounded-lg">
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-brand-text text-[10px] font-bold px-2.5 py-1 tracking-wider uppercase flex items-center gap-1.5 rounded-full border border-neutral-200 z-20 shadow-sm">
        <RotateCcw size={11} className={ready && !isDragging ? '' : 'animate-spin'} />
        360° View
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white hover:bg-neutral-100 text-brand-text p-1.5 rounded-full shadow border border-neutral-200 z-20"
          aria-label="Close 360 view"
        >
          <X size={14} />
        </button>
      )}

      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-neutral-50">
          <div className="w-40 h-1 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-gold transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-brand-grey uppercase tracking-widest font-medium">
            Loading 360° view — {progress}%
          </span>
        </div>
      )}

      <div
        ref={containerRef}
        className={`relative w-full h-full touch-none ${ready ? (zoom > 1 ? 'cursor-move' : 'cursor-grab active:cursor-grabbing') : 'cursor-wait'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{ opacity: ready ? 1 : 0 }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full pointer-events-none block"
          aria-label={`${productName} — 360 degree view, frame ${frame + 1} of ${frameCount}`}
        />

        {ready && showHint && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/0">
            <div className="bg-white/95 px-4 py-2.5 rounded-full shadow-lg border border-neutral-200 flex items-center gap-2 animate-pulse">
              <RotateCcw size={13} className="text-brand-gold" />
              <span className="text-[11px] font-medium text-brand-text tracking-wide">Drag to rotate</span>
            </div>
          </div>
        )}
      </div>

      {ready && frameCount > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-neutral-200 rounded-full overflow-hidden z-20">
          <div
            className="h-full bg-brand-gold transition-all duration-75"
            style={{ width: `${((frame + 1) / frameCount) * 100}%` }}
          />
        </div>
      )}

      {ready && (
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 z-20">
          <button
            onClick={zoomOut}
            className="bg-white hover:bg-neutral-100 text-brand-text p-1.5 rounded-full shadow border border-neutral-200"
            aria-label="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={zoomIn}
            className="bg-white hover:bg-neutral-100 text-brand-text p-1.5 rounded-full shadow border border-neutral-200"
            aria-label="Zoom in"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={() => setPlaybackSpeed(s => s === 0.5 ? 1.0 : s === 1.0 ? 1.5 : s === 1.5 ? 2.0 : 0.5)}
            className="bg-white hover:bg-neutral-100 text-brand-text text-[10px] font-bold px-2 py-1.5 rounded-full shadow border border-neutral-200 transition-colors min-w-[36px] text-center"
            aria-label="Change spin speed"
          >
            {playbackSpeed}x
          </button>
          <button
            onClick={() => setAutoplay(a => !a)}
            className="bg-white hover:bg-neutral-100 text-brand-text p-1.5 rounded-full shadow border border-neutral-200"
            aria-label={autoplay ? 'Pause autoplay' : 'Play autoplay'}
          >
            {autoplay ? <Pause size={13} /> : <Play size={13} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default Product360Fallback;