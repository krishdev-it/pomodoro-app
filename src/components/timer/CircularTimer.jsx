import { useMemo } from 'react'
import { formatMMSS } from '../../utils/time'

const SIZE = 380
const STROKE = 16
const CENTER = SIZE / 2
const R = CENTER - STROKE / 2 - 8
const CIRCUMFERENCE = 2 * Math.PI * R

const MODE_CONFIG = {
  focus:       { label: 'Focus',       bright: [224, 92, 75],   dim: [80, 30, 24]  },
  short_break: { label: 'Short Break', bright: [75, 205, 224],  dim: [28, 75, 88]  },
  long_break:  { label: 'Long Break',  bright: [123, 104, 238], dim: [45, 38, 95]  },
}

function lerpColor(c1, c2, t) {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t)
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t)
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t)
  return `rgb(${r},${g},${b})`
}

export function CircularTimer({ secondsLeft, totalSecs, mode, isRunning }) {
  const ratio = totalSecs > 0 ? secondsLeft / totalSecs : 1
  const offset = CIRCUMFERENCE * (1 - ratio)

  const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.focus

  // Quadratic easing: color change is slow at start, accelerates toward end
  const easedT = (1 - ratio) * (1 - ratio)

  const ringColor = useMemo(
    () => lerpColor(cfg.bright, cfg.dim, easedT),
    [easedT, cfg]
  )

  const glowColor = `rgba(${cfg.bright.join(',')}, ${(0.06 + ratio * 0.28).toFixed(2)})`

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        inset: 24,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${glowColor} 0%, transparent 68%)`,
        transition: 'background 2s ease',
        pointerEvents: 'none',
      }} />

      <svg
        width={SIZE}
        height={SIZE}
        style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 1 }}
      >
        {/* Track */}
        <circle
          cx={CENTER} cy={CENTER} r={R}
          fill="none"
          stroke="var(--clr-bg-3)"
          strokeWidth={STROKE}
        />
        {/* Progress ring — stroke must be in style (not SVG attr) for CSS transition to work */}
        <circle
          cx={CENTER} cy={CENTER} r={R}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{
            stroke: ringColor,
            transition: isRunning
              ? 'stroke-dashoffset 1s linear, stroke 2s ease, filter 2s ease'
              : 'stroke 0.4s ease, filter 0.4s ease',
            filter: `drop-shadow(0 0 ${6 + ratio * 10}px ${ringColor})`,
          }}
        />
      </svg>

      {/* Center content */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 72,
          fontWeight: 600,
          color: 'var(--clr-text-primary)',
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}>
          {formatMMSS(secondsLeft)}
        </span>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: ringColor,
          marginTop: 14,
          transition: 'color 1.5s ease',
        }}>
          {cfg.label}
        </span>
      </div>
    </div>
  )
}
