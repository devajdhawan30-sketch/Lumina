import { useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { MoveHorizontal } from 'lucide-react'
import { gsap, prefersReducedMotion } from '../animations/gsap'

type InteractiveLearningVisualProps = {
  concept?: 'vectors' | 'function' | 'fibonacci'
  className?: string
}

/**
 * A small, self-contained learning lab. New concepts can share its shell and
 * replace the canvas/feedback mapping without changing the home page.
 */
export default function InteractiveLearningVisual({
  concept = 'vectors',
  className = '',
}: InteractiveLearningVisualProps) {
  const [angle, setAngle] = useState(42)
  const canvas = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (prefersReducedMotion()) return
    const elements = canvas.current?.querySelectorAll('[data-lab-draw]')
    if (!elements?.length) return
    gsap.from(elements, { autoAlpha: 0, y: 10, duration: 0.55, stagger: 0.08, ease: 'power3.out' })
  }, { scope: canvas })

  const model = useMemo(() => {
    const radians = (angle * Math.PI) / 180
    const magnitude = 5
    const x = magnitude * Math.cos(radians)
    const y = magnitude * Math.sin(radians)
    return { x, y }
  }, [angle])

  const point = {
    x: 210 + model.x * 25,
    y: 210 - model.y * 25,
  }

  const updateFromPointer = (clientX: number, clientY: number) => {
    const rect = canvas.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((clientX - rect.left) / rect.width) * 420
    const y = ((clientY - rect.top) / rect.height) * 420
    const degrees = Math.atan2(210 - y, x - 210) * (180 / Math.PI)
    setAngle(Math.min(75, Math.max(12, Math.round(degrees))))
  }

  const feedback = angle < 30
    ? 'The horizontal component leads: the vector moves farther across than up.'
    : angle > 60
      ? 'The vertical component leads: the vector moves farther up than across.'
      : 'Both components are working together—compare their values in the formula.'

  if (concept === 'fibonacci') return <FibonacciLearningVisual className={className} />

  return (
    <section className={`interactive-learning-visual ${className}`} aria-labelledby="learning-lab-title">
      <div className="learning-lab-header">
        <div>
          <p className="learning-lab-kicker">Interactive lab</p>
          <h2 id="learning-lab-title">Make a vector move</h2>
        </div>
        <span className="learning-lab-concept">{concept === 'vectors' ? 'Geometry + Algebra' : 'Functions'}</span>
      </div>

      <div
        ref={canvas}
        className="learning-lab-canvas"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          updateFromPointer(event.clientX, event.clientY)
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromPointer(event.clientX, event.clientY)
        }}
        role="group"
        aria-label="Coordinate plane with a movable vector. Drag inside the graph or use the angle slider below."
      >
        <svg viewBox="0 0 420 420" aria-hidden="true">
          <defs>
            <marker id="learning-vector-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" className="learning-lab-arrow" /></marker>
          </defs>
          <g className="learning-lab-grid">
            {Array.from({ length: 9 }, (_, index) => 50 + index * 40).map((position) => <path key={`v-${position}`} d={`M${position} 30V390`} />)}
            {Array.from({ length: 9 }, (_, index) => 50 + index * 40).map((position) => <path key={`h-${position}`} d={`M30 ${position}H390`} />)}
          </g>
          <path data-lab-draw className="learning-lab-axis" d="M30 210H390M210 390V30" />
          <path data-lab-draw className="learning-lab-guide" d={`M${point.x} 210V${point.y}M210 ${point.y}H${point.x}`} />
          <path data-lab-draw className="learning-lab-vector" d={`M210 210L${point.x} ${point.y}`} markerEnd="url(#learning-vector-arrow)" />
          <path data-lab-draw className="learning-lab-angle" d={`M250 210 A40 40 0 0 0 ${210 + 40 * Math.cos((angle * Math.PI) / 180)} ${210 - 40 * Math.sin((angle * Math.PI) / 180)}`} />
          <circle data-lab-draw className="learning-lab-origin" cx="210" cy="210" r="5" />
          <circle data-lab-draw className="learning-lab-point" cx={point.x} cy={point.y} r="8" />
          <text x="375" y="202" className="learning-lab-label">x</text><text x="218" y="42" className="learning-lab-label">y</text>
          <text x="248" y="194" className="learning-lab-theta">{angle}°</text>
          <text x={(210 + point.x) / 2} y="230" className="learning-lab-value">x = {model.x.toFixed(1)}</text>
          <text x="218" y={(210 + point.y) / 2} className="learning-lab-value">y = {model.y.toFixed(1)}</text>
        </svg>
        <p className="learning-lab-drag"><MoveHorizontal size={15} /> Drag the point</p>
      </div>

      <label className="learning-lab-control">
        <span>Vector angle <strong>{angle}°</strong></span>
        <input type="range" min="12" max="75" value={angle} onChange={(event) => setAngle(Number(event.target.value))} aria-label="Vector angle" />
      </label>
      <div className="learning-lab-feedback" aria-live="polite">
        <span>Observe</span>
        <p>{feedback}</p>
        <code>v = ⟨{model.x.toFixed(1)}, {model.y.toFixed(1)}⟩</code>
      </div>
    </section>
  )
}

function FibonacciLearningVisual({ className }: Pick<InteractiveLearningVisualProps, 'className'>) {
  const [terms, setTerms] = useState(7)
  const values = useMemo(() => {
    const sequence = [0, 1]
    while (sequence.length < terms) sequence.push(sequence.at(-1)! + sequence.at(-2)!)
    return sequence
  }, [terms])
  const path = useMemo(() => {
    const turns = 1.7 + terms * .24
    return Array.from({ length: 140 }, (_, index) => {
      const t = (index / 139) * turns * Math.PI * 2
      const radius = 3.1 * Math.exp(.23 * t)
      const x = 210 + Math.cos(t) * radius
      const y = 210 + Math.sin(t) * radius
      return `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(' ')
  }, [terms])

  return (
    <section className={`interactive-learning-visual fibonacci-learning-visual ${className ?? ''}`} aria-labelledby="fibonacci-lab-title">
      <div className="learning-lab-header"><div><p className="learning-lab-kicker">Interactive pattern lab</p><h2 id="fibonacci-lab-title">Grow the Fibonacci sequence</h2></div><span className="learning-lab-concept">Patterns + Nature</span></div>
      <div className="learning-lab-canvas fibonacci-canvas">
        <svg viewBox="0 0 420 420" aria-hidden="true">
          <g className="learning-lab-grid">{Array.from({ length: 9 }, (_, i) => 50 + i * 40).map((p) => <path key={`v${p}`} d={`M${p} 30V390M30 ${p}H390`} />)}</g>
          <circle cx="210" cy="210" r="145" className="fibonacci-ring" />
          <circle cx="210" cy="210" r="89" className="fibonacci-ring fibonacci-ring-inner" />
          <path d={path} className="fibonacci-spiral" />
          {values.slice(1).map((value, index) => <circle key={`${value}-${index}`} cx={78 + index * 43} cy={345 - Math.min(value, 13) * 13} r="7" className="fibonacci-node" />)}
          <text x="44" y="50" className="learning-lab-label">Each term = previous two terms</text>
        </svg>
        <p className="learning-lab-drag">Add terms to grow the spiral</p>
      </div>
      <label className="learning-lab-control"><span>Terms to explore <strong>{terms}</strong></span><input type="range" min="4" max="12" value={terms} onChange={(event) => setTerms(Number(event.target.value))} aria-label="Number of Fibonacci terms" /></label>
      <div className="learning-lab-feedback" aria-live="polite"><span>Discover</span><p>The newest number, <strong>{values.at(-1)}</strong>, is made by adding {values.at(-2)} + {values.at(-3)}.</p><code>{values.join(', ')}</code></div>
    </section>
  )
}
