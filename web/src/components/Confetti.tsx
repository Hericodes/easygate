"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const COLORS = ["#6d4aff", "#a63cf2", "#ff4fa3", "#ff8a3d", "#c6f432", "#38bdf8"];
const FRAMES = 230; // ~4 seconds at 60fps

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  wobble: number;
  color: string;
};

/**
 * One celebratory confetti burst from both bottom corners.
 * `clearParam` removes that query param afterwards, so a refresh doesn't replay it.
 * Skipped entirely when the user prefers reduced motion.
 */
export default function Confetti({ clearParam }: { clearParam?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (clearParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete(clearParam);
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const pieces: Piece[] = [];
    const burst = (x: number, dir: 1 | -1) => {
      for (let i = 0; i < 90; i++) {
        const angle = -Math.PI / 2 + dir * (0.15 + Math.random() * 0.55);
        const speed = 15 + Math.random() * 12;
        pieces.push({
          x,
          y: window.innerHeight + 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          w: 6 + Math.random() * 6,
          h: 8 + Math.random() * 8,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          wobble: Math.random() * Math.PI * 2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    };
    burst(0, 1);
    burst(window.innerWidth, -1);

    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const alpha = frame < FRAMES - 60 ? 1 : Math.max(0, (FRAMES - frame) / 60);
      for (const p of pieces) {
        p.vy = (p.vy + 0.3) * 0.965;
        p.vx *= 0.965;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.wobble += 0.15;
        const flutter = Math.abs(Math.cos(p.wobble));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, (-p.h / 2) * flutter, p.w, p.h * flutter);
        ctx.restore();
      }
      if (frame < FRAMES) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [mounted, clearParam]);

  if (!mounted) return null;
  return createPortal(
    <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-50 h-full w-full" />,
    document.body,
  );
}
