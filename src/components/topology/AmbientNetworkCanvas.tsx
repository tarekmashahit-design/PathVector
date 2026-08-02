import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
}

interface Edge {
  a: number;
  b: number;
  active: boolean;
  packets: number[]; // 0-1 positions along the edge
  speed: number;
}

/**
 * Decorative, non-interactive network graph used behind hero/login sections.
 * Procedurally generated (not tied to real topology data) — nodes drift
 * slowly and packets travel along a subset of "active" links continuously.
 */
export function AmbientNetworkCanvas({ className, density = 26 }: { className?: string; density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let raf = 0;
    let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGraph();
    }

    function buildGraph() {
      nodes = Array.from({ length: density }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        r: 2 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
      }));

      edges = [];
      nodes.forEach((n, i) => {
        // connect each node to its 1-2 nearest neighbors for an organic mesh
        const dists = nodes
          .map((o, j) => ({ j, d: Math.hypot(n.x - o.x, n.y - o.y) }))
          .filter((d) => d.j !== i)
          .sort((a, b) => a.d - b.d)
          .slice(0, 2);
        dists.forEach(({ j }) => {
          if (!edges.some((e) => (e.a === i && e.b === j) || (e.a === j && e.b === i))) {
            const active = Math.random() > 0.55;
            edges.push({
              a: i,
              b: j,
              active,
              speed: 0.15 + Math.random() * 0.25,
              packets: active ? [Math.random(), Math.random() > 0.5 ? Math.random() : -1].filter((p) => p >= 0) : [],
            });
          }
        });
      });
    }

    function step(t: number) {
      ctx!.clearRect(0, 0, width, height);

      if (!reduced) {
        nodes.forEach((n) => {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < -20 || n.x > width + 20) n.vx *= -1;
          if (n.y < -20 || n.y > height + 20) n.vy *= -1;
        });
      }

      // edges
      edges.forEach((e) => {
        const a = nodes[e.a];
        const b = nodes[e.b];
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.strokeStyle = e.active ? 'rgba(56,189,248,0.16)' : 'rgba(148,163,184,0.08)';
        ctx!.lineWidth = 1;
        ctx!.stroke();

        if (e.active && !reduced) {
          e.packets.forEach((p0, idx) => {
            const p = (p0 + t * 0.00006 * e.speed * 10) % 1;
            const px = a.x + (b.x - a.x) * p;
            const py = a.y + (b.y - a.y) * p;
            ctx!.beginPath();
            ctx!.arc(px, py, 1.8, 0, Math.PI * 2);
            ctx!.fillStyle = 'rgba(56,189,248,0.95)';
            ctx!.shadowColor = 'rgba(56,189,248,0.8)';
            ctx!.shadowBlur = 6;
            ctx!.fill();
            ctx!.shadowBlur = 0;
          });
        }
      });

      // nodes
      nodes.forEach((n) => {
        const pulse = reduced ? 1 : 0.75 + Math.sin(t * 0.0012 + n.phase) * 0.25;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(148,163,184,0.5)';
        ctx!.fill();
      });

      raf = requestAnimationFrame(step);
    }

    resize();
    raf = requestAnimationFrame(step);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [density]);

  return <canvas ref={canvasRef} className={className} />;
}
