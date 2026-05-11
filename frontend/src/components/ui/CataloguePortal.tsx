import React, { useState, useRef, useCallback } from 'react';

type CataloguePortalProps = {
  href?: string;
  itemCount?: number;
  onNavigate?: () => void;
};

const CATALOGUE_ITEMS = [
  { label: 'Stage Makeup Kit',     dot: '#e69d20' },
  { label: 'Prop Storage Set',     dot: '#4a9a5a' },
  { label: 'Lighting Rig',         dot: '#4746a3' },
  { label: 'Sound System A',       dot: '#4746a3' },
  { label: 'Featured Production',  dot: '#d85a30' },
];

const styles = `
  @keyframes catalogueCycleA {
    0%, 30% { opacity: 1; }
    35%, 95% { opacity: 0; }
    100%     { opacity: 1; }
  }
  @keyframes catalogueCycleB {
    0%, 30% { opacity: 0; }
    35%, 65% { opacity: 1; }
    70%, 100% { opacity: 0; }
  }
  @keyframes catalogueCycleC {
    0%, 65%  { opacity: 0; }
    70%, 95% { opacity: 1; }
    100%     { opacity: 0; }
  }

  .cp-card {
    transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease;
  }

  /* Fan-out on hover */
  .cp-wrap:hover .cp-card-a {
    transform: rotate(10deg) translateX(96px) translateY(8px) !important;
    box-shadow: 0 8px 28px rgba(0,0,0,0.15) !important;
  }
  .cp-wrap:hover .cp-card-b {
    transform: rotate(0deg) translateY(12px) !important;
    box-shadow: 0 10px 28px rgba(0,0,0,0.14) !important;
  }
  .cp-wrap:hover .cp-card-c {
    transform: rotate(-10deg) translateX(-96px) translateY(8px) !important;
    box-shadow: 0 8px 28px rgba(0,0,0,0.15) !important;
  }

  .cp-card-upper-0 { background: linear-gradient(135deg, #c8b89a, #e8d5b0); }
  .cp-card-upper-1 { background: linear-gradient(135deg, #a8c8a8, #c8e0c0); }
  .cp-card-upper-2 { background: linear-gradient(135deg, #b0a8d8, #d0c8f0); }
  .cp-card-upper-3 { background: linear-gradient(160deg, #b8d4e8, #d8eaf8); }
  .cp-card-upper-4 { background: linear-gradient(160deg, #e8c8a0, #f8dfc0); }

  .cp-label-bar { background: #ffffff; }
  .cp-card-label { color: #3a3934; }

  @media (prefers-color-scheme: dark) {
    .cp-card-upper-0 { background: linear-gradient(135deg, #7a6040, #9a7850); }
    .cp-card-upper-1 { background: linear-gradient(135deg, #3a6b42, #4e8858); }
    .cp-card-upper-2 { background: linear-gradient(135deg, #4040a0, #5555be); }
    .cp-card-upper-3 { background: linear-gradient(160deg, #2e6090, #3a7ab0); }
    .cp-card-upper-4 { background: linear-gradient(160deg, #8a6030, #aa7a40); }
    .cp-card-label { color: #c8c4b8; }
    .cp-label-bar { background: #1c1c1a; }
  }

  html.dark .cp-card-upper-0 { background: linear-gradient(135deg, #7a6040, #9a7850); }
  html.dark .cp-card-upper-1 { background: linear-gradient(135deg, #3a6b42, #4e8858); }
  html.dark .cp-card-upper-2 { background: linear-gradient(135deg, #4040a0, #5555be); }
  html.dark .cp-card-upper-3 { background: linear-gradient(160deg, #2e6090, #3a7ab0); }
  html.dark .cp-card-upper-4 { background: linear-gradient(160deg, #8a6030, #aa7a40); }
  html.dark .cp-card-label { color: #c8c4b8; }
  html.dark .cp-label-bar { background: #1c1c1a; }

  /* Pause cycling animation while hovering */
  .cp-wrap:hover .cp-cycle { animation-play-state: paused; }

  /* "Browse all" CTA reveal */
  .cp-wrap:hover .cp-cta     { opacity: 1; transform: translateX(-50%) translateY(0); }
  .cp-wrap:hover .cp-cta-line { width: 28px; }

  .cp-hint { transition: opacity 0.3s; }

  /* 3D tilt + magnetic wrapper — driven by JS, CSS only sets the transition */
  .cp-magnetic {
    transition: transform 0.25s cubic-bezier(0.23, 1, 0.32, 1);
    will-change: transform;
  }
  .cp-stack-tilt {
    transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1);
    will-change: transform;
    transform-style: preserve-3d;
  }
`;

export default function CataloguePortal({ href = '/catalogue', itemCount = 24, onNavigate }: CataloguePortalProps) {
  const [hintText, setHintText] = useState(`${itemCount} items in catalogue`);
  const wrapRef    = useRef<HTMLDivElement | null>(null); // outer magnetic wrapper
  const tiltRef    = useRef<HTMLDivElement | null>(null); // new — tilt shell only
  const frameRef   = useRef<number | null>(null); // rAF handle
  const isHovered  = useRef(false);

  // ─── Magnetic + Tilt logic ───────────────────────────────────────────────
  //
  // Inspired by Framer Marketplace "Tilt Card" and "Magnet" components:
  //
  //   Tilt Card  — rotates the element in 3D based on cursor position
  //                relative to the element's center, giving it the feel
  //                of a physical object responding to your hand.
  //
  //   Magnet     — translates the entire element slightly toward the cursor
  //                within a defined radius, creating a pull / attraction
  //                effect that makes the element feel alive and aware.
  //
  // Both effects reset with a spring-like ease when the cursor leaves.
  // ─────────────────────────────────────────────────────────────────────────

  const TILT_STRENGTH    = 14;   // max degrees of rotation (X or Y)
  const MAGNET_STRENGTH  = 0.18; // fraction of distance to pull toward cursor
  const MAGNET_RADIUS    = 120;  // px outside the element that triggers pull

  const animateTo = useCallback((magX: number, magY: number, rotX: number, rotY: number) => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      if (wrapRef.current) {
        wrapRef.current.style.transform = `translate(${magX}px, ${magY}px)`;
      }
      if (tiltRef.current) {
        tiltRef.current.style.transform =
          `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      }
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width  / 2;
    const centerY = rect.top  + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    // Is cursor inside the element?
    const inside = (
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top  && e.clientY <= rect.bottom
    );

    if (inside || isHovered.current) {
      // Tilt: map cursor offset → rotation, clamped to TILT_STRENGTH
      const halfW = rect.width  / 2;
      const halfH = rect.height / 2;
      const rotY  =  (dx / halfW) * TILT_STRENGTH;
      const rotX  = -(dy / halfH) * TILT_STRENGTH;

      // Magnet: pull element body toward cursor (subtle)
      const magX = inside ? dx * MAGNET_STRENGTH : 0;
      const magY = inside ? dy * MAGNET_STRENGTH : 0;

      animateTo(magX, magY, rotX, rotY);
    }
  }, [animateTo]);

  const handleMouseEnter = useCallback(() => {
    isHovered.current = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isHovered.current = false;
    // Spring back to neutral
    animateTo(0, 0, 0, 0);
  }, [animateTo]);

  // Attach listeners to the document so the magnet activates slightly
  // before the cursor reaches the element (within MAGNET_RADIUS).
  // We use document-level mousemove and only act when close enough.
  const handleDocMouseMove = useCallback((e: MouseEvent) => {
    const el = wrapRef.current;
    if (!el || isHovered.current) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width  / 2;
    const centerY = rect.top  + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < MAGNET_RADIUS) {
      // Soft pre-pull: weaker the further away
      const pull = (1 - dist / MAGNET_RADIUS) * MAGNET_STRENGTH * 0.5;
      animateTo(dx * pull, dy * pull, 0, 0);
    }
  }, [animateTo]);

  // Register/deregister document listener
  const wrapRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      wrapRef.current = node;
      document.addEventListener('mousemove', handleDocMouseMove, { passive: true });
    } else {
      document.removeEventListener('mousemove', handleDocMouseMove);
    }
  }, [handleDocMouseMove]);

  // ─── Click handler ────────────────────────────────────────────────────────

  function handleClick() {
    setHintText('Opening catalogue…');
    setTimeout(() => setHintText(`${itemCount} items in catalogue`), 1800);
    if (onNavigate) {
      onNavigate();
    } else {
      window.location.href = href;
    }
  }

  // ─── Shared cycling animation props ──────────────────────────────────────

  const cycleProps = [
    { className: 'cp-cycle', style: { animation: 'catalogueCycleA 6s infinite' } },
    { className: 'cp-cycle', style: { animation: 'catalogueCycleB 6s infinite', opacity: 0 } },
    { className: 'cp-cycle', style: { animation: 'catalogueCycleC 6s infinite', opacity: 0 } },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{styles}</style>

      {/* cp-magnetic: outer shell that moves toward the cursor (magnet) */}
      <div
        ref={wrapRefCallback}
        className="cp-magnetic"
        style={{ display: 'inline-flex', position: 'relative', zIndex: 29 }}
      >
        {/* cp-wrap: hover target, controls CSS fan-out classes */}
        <div
          className="cp-wrap"
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 6,
            cursor: 'pointer',
            userSelect: 'none',
          }}
          role="button"
          aria-label={`Browse catalogue — ${itemCount} items`}
          tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
        >
          {/* Hint label */}
          <span
            className="cp-hint"
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              color: '#8a897e',
              textTransform: 'uppercase',
            }}
          >
            {hintText}
          </span>

          {/* cp-stack-tilt: the card stack that tilts in 3D */}
          <div
            ref={tiltRef}
            className="cp-stack-tilt"
            style={{
              transition: 'transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
              willChange: 'transform',
              transformStyle: 'preserve-3d',
              transformOrigin: 'bottom center',
            }}
          >
            <div style={{ position: 'relative', width: 220, height: 124 }}>
              {/* Item count badge */}
              <span style={{
                position: 'absolute', top: -8, right: -8, zIndex: 10,
                background: '#1a1a18', color: '#efede6',
                fontSize: 10, fontWeight: 500, borderRadius: 20, padding: '3px 8px',
              }}>
                {itemCount}
              </span>

              {/* Back card (C) — fans left on hover, cycles through items in idle */}
              <div
                className="cp-card cp-card-c"
                style={{
                  position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                  transform: 'rotate(-4deg) translateX(4px) translateY(4px)', zIndex: 1,
                }}
              >
                {CATALOGUE_ITEMS.slice(0, 3).map((item, i) => (
                  <div
                    key={i}
                    className={cycleProps[i].className}
                    style={{ position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden', ...cycleProps[i].style }}
                  >
                    <div className={`cp-card-upper-${i}`} style={{ height: '68%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{
                        fontFamily: 'serif',
                        fontSize: 12,
                        color: i === 0 ? '#7a5a2a' : i === 1 ? '#2a5a3a' : '#3a3480',
                        opacity: 0.55,
                      }}>
                        {i === 0 ? 'Makeup & FX' : i === 1 ? 'Props & Sets' : 'Lighting'}
                      </span>
                    </div>
                    <div className="cp-label-bar" style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: '32%',
                      display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                      <span className="cp-card-label" style={{ fontSize: 9, fontWeight: 500 }}>
                        {item.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Middle card (B) — fans center on hover */}
              <div
                className="cp-card cp-card-b"
                style={{
                  position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                  transform: 'rotate(-2deg) translateX(2px) translateY(2px)', zIndex: 2,
                }}
              >
                <div className="cp-card-upper-3" style={{ height: '68%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'serif', fontSize: 12, color: '#3a5c8a', opacity: 0.55, letterSpacing: '0.02em' }}>Sound &amp; AV</span>
                </div>
                <div className="cp-label-bar" style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: '32%',
                  display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: CATALOGUE_ITEMS[3].dot, flexShrink: 0 }} />
                  <span className="cp-card-label" style={{ fontSize: 9, fontWeight: 500 }}>{CATALOGUE_ITEMS[3].label}</span>
                </div>
              </div>

              {/* Top card (A) — fans right on hover */}
              <div
                className="cp-card cp-card-a"
                style={{
                  position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                  transform: 'rotate(0deg)', zIndex: 3,
                }}
              >
                <div className="cp-card-upper-4" style={{
                  height: '68%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: 'serif', fontSize: 13, color: '#8a6840',
                    opacity: 0.7, textAlign: 'center', padding: 8, lineHeight: 1.3,
                  }}>
                    A Midsummer<br />Night's Dream
                  </span>
                </div>
                <div className="cp-label-bar" style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: '32%',
                  display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: CATALOGUE_ITEMS[4].dot, flexShrink: 0 }} />
                  <span className="cp-card-label" style={{ fontSize: 9, fontWeight: 500 }}>{CATALOGUE_ITEMS[4].label}</span>
                </div>
              </div>

              {/* "Browse all" CTA — appears on hover below the stack */}
              <div
                className="cp-cta"
                style={{
                  position: 'absolute', bottom: -34, left: '50%',
                  transform: 'translateX(-50%) translateY(4px)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s',
                  whiteSpace: 'nowrap', fontSize: 11, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#4746a3', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <span
                  className="cp-cta-line"
                  style={{ display: 'block', width: 18, height: 1, background: '#4746a3', transition: 'width 0.3s ease' }}
                />
                Browse all
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="#4746a3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
