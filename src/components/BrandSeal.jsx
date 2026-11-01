/* eslint-disable react/prop-types */
// Round seal for the menu header: the café's leaf + wheat mark with its two
// promises set on a circle, like a stamp on a paper bag. The ring turns very
// slowly (stops under reduced motion). Decorative only.
import { cx } from './ui'

const RING_TEXT = 'Café de especialidad · Brunch mexicano · Apaxco · '

export const BrandSeal = ({ className = '' }) => (
  <div className={cx('relative aspect-square', className)} aria-hidden="true">
    <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 h-full w-full">
      <defs>
        <path id="seal-ring" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
      </defs>
      <circle cx="100" cy="100" r="97" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 5" />
      <text fill="currentColor" style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, letterSpacing: '0.18em', fontStretch: '125%' }}>
        <textPath href="#seal-ring" textLength="486" lengthAdjust="spacing">{RING_TEXT.toUpperCase()}</textPath>
      </text>
    </svg>
    <img src="/logo.svg" alt="" width="96" height="96" className="absolute inset-[27%] h-[46%] w-[46%]" />
  </div>
)
