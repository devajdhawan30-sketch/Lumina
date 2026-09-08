import { motion, useAnimationFrame } from 'motion/react'
import { useState } from 'react'
import { getExploration, type ExplorationId } from '../data/explorations'

function useLoopProgress(duration = 2600) {
  const [progress, setProgress] = useState(0)
  useAnimationFrame((time) => setProgress((time % duration) / duration))
  return progress
}

function pingPong(progress: number) {
  return progress < 0.5 ? progress * 2 : 2 - progress * 2
}

function sampledArc(centerX: number, centerY: number, start: number, end: number, radius: number) {
  return Array.from({ length: 18 }, (_, index) => {
    const angle = start + ((end - start) * index) / 17
    return `${index === 0 ? 'M' : 'L'}${centerX + radius * Math.cos(angle)} ${centerY - radius * Math.sin(angle)}`
  }).join(' ')
}

function AngleRotation() {
  const progress = useLoopProgress()
  const angle = pingPong(progress) * (Math.PI / 2.4)
  const radius = 58
  const point = { x: 130 + radius * Math.cos(angle), y: 118 - radius * Math.sin(angle) }
  const arc = Array.from({ length: 25 }, (_, index) => {
    const step = (angle * index) / 24
    return `${index === 0 ? 'M' : 'L'}${130 + radius * Math.cos(step)} ${118 - radius * Math.sin(step)}`
  }).join(' ')
  return <svg viewBox="0 0 260 150" role="img" aria-label="Synchronized animated angle rotation"><path d="M24 118H238M130 138V16" className="mini-axis" /><line x1="130" y1="118" x2="188" y2="118" className="mini-initial" /><path d={arc} className="mini-arc" /><line x1="130" y1="118" x2={point.x} y2={point.y} className="mini-ray" /><circle cx={point.x} cy={point.y} r="5" className="mini-point" /><text x="148" y="105" className="mini-label">θ</text><text x="184" y="112" className="mini-annotation">initial</text><text x={point.x - 12} y={point.y - 10} className="mini-annotation">terminal</text><text x="24" y="22" className="mini-value">{Math.round((angle * 180) / Math.PI)}° rotation</text></svg>
}

function UnitCircle() {
  const progress = useLoopProgress(4000)
  const angle = progress * Math.PI * 2
  const point = { x: 130 + 52 * Math.cos(angle), y: 75 - 52 * Math.sin(angle) }
  const arcRadius = 27
  const arc = Array.from({ length: 25 }, (_, index) => {
    const step = (angle * index) / 24
    return `${index === 0 ? 'M' : 'L'}${130 + arcRadius * Math.cos(step)} ${75 - arcRadius * Math.sin(step)}`
  }).join(' ')
  const labelAngle = Math.min(angle / 2, Math.PI * 1.75)
  const thetaLabel = { x: 130 + 36 * Math.cos(labelAngle), y: 75 - 36 * Math.sin(labelAngle) }
  return <svg viewBox="0 0 260 150" role="img" aria-label="Synchronized animated point moving around a unit circle"><path d="M24 75H238M130 138V12" className="mini-axis" /><circle cx="130" cy="75" r="52" className="mini-circle" /><line x1="130" y1="75" x2="188" y2="75" className="mini-initial" /><path d={arc} className="mini-arc" /><line x1="130" y1="75" x2={point.x} y2={point.y} className="mini-ray" /><line x1={point.x} y1={point.y} x2={point.x} y2="75" className="mini-guide" /><circle cx={point.x} cy={point.y} r="5" className="mini-point" /><text x={thetaLabel.x} y={thetaLabel.y} className="mini-theta">θ</text><text x="24" y="22" className="mini-value">θ = {Math.round((angle * 180) / Math.PI)}°</text><text x="142" y="138" className="mini-annotation">x = {Math.cos(angle).toFixed(2)}, y = {Math.sin(angle).toFixed(2)}</text></svg>
}

function SineWave() {
  const progress = useLoopProgress(4000)
  const angle = progress * Math.PI * 2
  const circlePoint = { x: 47 + 29 * Math.cos(angle), y: 75 - 29 * Math.sin(angle) }
  const wavePoint = { x: 82 + progress * 160, y: 75 - 33 * Math.sin(angle) }
  return <svg viewBox="0 0 260 150" role="img" aria-label="Synchronized animated unit circle and sine wave"><circle cx="47" cy="75" r="29" className="mini-circle" /><line x1="47" y1="75" x2={circlePoint.x} y2={circlePoint.y} className="mini-ray" /><circle cx={circlePoint.x} cy={circlePoint.y} r="4" className="mini-point" /><text x="40" y="80" className="mini-theta">θ</text><path d="M82 75H242M82 42V108" className="mini-axis" /><path d="M82 75 C98 26 114 26 130 75 S162 124 178 75 S210 26 242 75" className="mini-wave" /><line x1={wavePoint.x} y1={wavePoint.y} x2={wavePoint.x} y2="75" className="mini-guide" /><circle cx={wavePoint.x} cy={wavePoint.y} r="4" className="mini-point" /><text x="24" y="22" className="mini-value">sin θ = {Math.sin(angle).toFixed(2)}</text><text x="84" y="138" className="mini-annotation">circle y-coordinate → wave</text></svg>
}

function SimilarTriangles() {
  const progress = useLoopProgress()
  const scale = 0.76 + pingPong(progress) * 0.28
  return <svg viewBox="0 0 260 150" role="img" aria-label="Synchronized animated similar triangles scaling together"><g transform={`translate(59 122) scale(${scale}) translate(-59 -122)`}><path d="M26 122H92V74Z" className="mini-triangle" /></g><g transform={`translate(172 122) scale(${scale}) translate(-172 -122)`}><path d="M124 122H220V52Z" className="mini-triangle" /></g><text x="28" y="140" className="mini-label">3 : 4 : 5</text><text x="143" y="140" className="mini-label">6 : 8 : 10</text><text x="48" y="113" className="mini-theta">θ</text><text x="24" y="22" className="mini-value">fixed angle θ; size changes</text></svg>
}

function TowerHeight() {
  const progress = useLoopProgress()
  const scale = 0.78 + pingPong(progress) * 0.34
  const towerTop = 124 - 76 * scale
  const towerAngle = Math.atan2(124 - towerTop, 125)
  const arcRadius = 20
  const arc = Array.from({ length: 20 }, (_, index) => {
    const step = (towerAngle * index) / 19
    return `${index === 0 ? 'M' : 'L'}${65 + arcRadius * Math.cos(step)} ${124 - arcRadius * Math.sin(step)}`
  }).join(' ')
  const height = Math.round(76 * scale)
  return <svg viewBox="0 0 260 150" role="img" aria-label="Synchronized animated tower height measurement"><path d="M22 124H238" className="mini-axis" /><rect x="190" y={towerTop} width="18" height={height} className="mini-tower" /><line x1="65" y1="124" x2="190" y2={towerTop} className="mini-sight" /><circle cx="65" cy="124" r="5" className="mini-point" /><path d={arc} className="mini-arc" /><text x="72" y="116" className="mini-label">θ</text><text x="94" y="138" className="mini-label">distance</text><text x="211" y={towerTop + 2} className="mini-label">height</text><text x="24" y="22" className="mini-value">height ≈ {height} units</text></svg>
}

function OneRadian() {
  const angle = 1
  const radius = 43
  const point = { x: 130 + radius * Math.cos(angle), y: 78 - radius * Math.sin(angle) }
  const arc = Array.from({ length: 25 }, (_, index) => {
    const step = (angle * index) / 24
    return `${index === 0 ? 'M' : 'L'}${130 + radius * Math.cos(step)} ${78 - radius * Math.sin(step)}`
  }).join(' ')
  const thetaLabel = { x: 130 + 23 * Math.cos(angle / 2), y: 78 - 23 * Math.sin(angle / 2) }
  return <svg viewBox="0 0 260 150" role="img" aria-label="One radian with arc length equal to radius"><circle cx="130" cy="78" r="43" className="mini-circle" /><line x1="130" y1="78" x2="173" y2="78" className="mini-initial" /><path d={arc} className="mini-arc" /><line x1="130" y1="78" x2={point.x} y2={point.y} className="mini-ray" /><circle cx={point.x} cy={point.y} r="4" className="mini-point" /><text x={thetaLabel.x} y={thetaLabel.y} className="mini-theta">θ</text><text x="24" y="22" className="mini-value">θ = 1 radian</text><text x="182" y="72" className="mini-annotation">s = r</text><text x="78" y="140" className="mini-annotation">arc length = radius</text></svg>
}

function ClockRotation() {
  const progress = useLoopProgress(5000)
  const minuteAngle = progress * Math.PI * 2
  const hourAngle = progress * Math.PI * 2 / 12
  const hand = (angle: number, length: number) => ({ x: 130 + length * Math.sin(angle), y: 76 - length * Math.cos(angle) })
  const minute = hand(minuteAngle, 39)
  const hour = hand(hourAngle, 26)
  return <svg viewBox="0 0 260 150" role="img" aria-label="Animated clock hands showing continuous rotation"><circle cx="130" cy="76" r="48" className="mini-circle" /><path d="M130 23V30M130 122V129M77 76H84M176 76H183" className="mini-axis" /><line x1="130" y1="76" x2={hour.x} y2={hour.y} className="mini-hour-hand" /><line x1="130" y1="76" x2={minute.x} y2={minute.y} className="mini-ray" /><circle cx="130" cy="76" r="4" className="mini-point" /><text x="24" y="22" className="mini-value">θ = {Math.round((minuteAngle * 180) / Math.PI)}°</text><text x="24" y="143" className="mini-annotation">hour hand moves 12× slower</text></svg>
}

function TangentRatio() {
  const progress = useLoopProgress(3000)
  const angle = (20 + pingPong(progress) * 50) * Math.PI / 180
  const adjacent = 72
  const opposite = adjacent * Math.tan(angle)
  const top = 120 - Math.min(opposite, 78)
  return <svg viewBox="0 0 260 150" role="img" aria-label="Animated tangent opposite over adjacent ratio"><path d={`M48 120H${48 + adjacent}V${top}Z`} className="mini-triangle" /><path d="M48 120h10v-10" className="mini-right-angle" /><text x="70" y="138" className="mini-label">adjacent = {adjacent}</text><text x="128" y={top + 4} className="mini-label">opposite = {opposite.toFixed(1)}</text><text x="24" y="22" className="mini-value">tan θ = {Math.tan(angle).toFixed(2)}</text><text x="50" y="111" className="mini-theta">{Math.round((angle * 180) / Math.PI)}°</text></svg>
}

function EquationIntersections() {
  const progress = useLoopProgress(3400)
  const target = 0.25 + pingPong(progress) * 0.5
  const graph = Array.from({ length: 49 }, (_, index) => {
    const theta = (index / 48) * Math.PI * 2
    return `${30 + index * 4},${78 - Math.sin(theta) * 36}`
  }).join(' ')
  const first = Math.asin(target)
  const second = Math.PI - first
  const x1 = 30 + (first / (Math.PI * 2)) * 192
  const x2 = 30 + (second / (Math.PI * 2)) * 192
  const y = 78 - target * 36
  return <svg viewBox="0 0 260 150" role="img" aria-label="Animated sine equation intersections"><path d="M24 78H238M30 34V122" className="mini-axis" /><polyline points={graph} className="mini-wave" /><line x1="30" y1={y} x2="222" y2={y} className="mini-sight" /><circle cx={x1} cy={y} r="5" className="mini-point" /><circle cx={x2} cy={y} r="5" className="mini-point" /><text x="24" y="22" className="mini-value">sin(x) = {target.toFixed(2)}</text><text x="84" y="140" className="mini-annotation">each dot is a solution</text></svg>
}

function Triangulation() {
  const progress = useLoopProgress(3200)
  const pointX = 164 + pingPong(progress) * 24
  const leftAngle = Math.atan2(72, pointX - 45)
  const rightAngle = Math.PI - Math.atan2(72, 215 - pointX)
  const leftArc = sampledArc(45, 120, 0, leftAngle, 18)
  const rightArc = sampledArc(215, 120, Math.PI, rightAngle, 18)
  return <svg viewBox="0 0 260 150" role="img" aria-label="Animated triangulation from two sightlines"><path d="M35 120H225" className="mini-axis" /><circle cx="45" cy="120" r="5" className="mini-point" /><circle cx="215" cy="120" r="5" className="mini-point" /><circle cx={pointX} cy="48" r="5" className="mini-point" /><line x1="45" y1="120" x2={pointX} y2="48" className="mini-sight" /><line x1="215" y1="120" x2={pointX} y2="48" className="mini-sight" /><path d={leftArc} className="mini-arc" /><path d={rightArc} className="mini-arc" /><text x="56" y="111" className="mini-theta">θ₁</text><text x="190" y="111" className="mini-theta">θ₂</text><text x="24" y="22" className="mini-value">two angles → one location</text><text x="82" y="140" className="mini-annotation">measured baseline</text></svg>
}

function NavigationVector() {
  const progress = useLoopProgress(3000)
  const angle = (25 + pingPong(progress) * 35) * Math.PI / 180
  const length = 68
  const end = { x: 60 + length * Math.cos(angle), y: 116 - length * Math.sin(angle) }
  const arc = sampledArc(60, 116, 0, angle, 20)
  const thetaLabel = { x: 60 + 29 * Math.cos(angle / 2), y: 116 - 29 * Math.sin(angle / 2) }
  return <svg viewBox="0 0 260 150" role="img" aria-label="Animated navigation vector split into components"><path d="M38 116H230M60 132V26" className="mini-axis" /><path d={arc} className="mini-arc" /><line x1="60" y1="116" x2={end.x} y2={end.y} className="mini-ray" /><line x1={end.x} y1={end.y} x2={end.x} y2="116" className="mini-guide" /><line x1="60" y1="116" x2={end.x} y2="116" className="mini-component-x" /><line x1={end.x} y1="116" x2={end.x} y2={end.y} className="mini-component-y" /><circle cx={end.x} cy={end.y} r="5" className="mini-point" /><text x={thetaLabel.x} y={thetaLabel.y} className="mini-theta">θ</text><text x="24" y="22" className="mini-value">direction = {Math.round((angle * 180) / Math.PI)}°</text><text x="92" y="138" className="mini-annotation">horizontal + vertical components</text></svg>
}

function WaveMotion() {
  const progress = useLoopProgress(3000)
  const shift = progress * 28
  const wave = Array.from({ length: 49 }, (_, index) => `${24 + index * 4},${78 - Math.sin((index / 48) * Math.PI * 4 + shift / 12) * 34}`).join(' ')
  return <svg viewBox="0 0 260 150" role="img" aria-label="Animated repeating wave pattern"><path d="M24 78H238M24 38V118" className="mini-axis" /><polyline points={wave} className="mini-wave" /><circle cx={24 + progress * 180} cy={78 - Math.sin(progress * Math.PI * 4 + shift / 12) * 34} r="5" className="mini-point" /><text x="24" y="22" className="mini-value">repeating signal</text><text x="82" y="140" className="mini-annotation">time →</text></svg>
}

function Visualization({ id }: { id: ExplorationId }) {
  if (id === 'visualize-angle-rotation') return <AngleRotation />
  if (id === 'visualize-unit-circle') return <UnitCircle />
  if (id === 'visualize-sine-wave') return <SineWave />
  if (id === 'visualize-similar-triangles') return <SimilarTriangles />
  if (id === 'visualize-tower-height') return <TowerHeight />
  if (id === 'visualize-one-radian') return <OneRadian />
  if (id === 'visualize-clock-rotation') return <ClockRotation />
  if (id === 'visualize-tangent-ratio') return <TangentRatio />
  if (id === 'visualize-equation-intersections') return <EquationIntersections />
  if (id === 'visualize-triangulation') return <Triangulation />
  if (id === 'visualize-navigation-vector') return <NavigationVector />
  return <WaveMotion />
}

export default function ExplorationPopover({ id }: { id: ExplorationId }) {
  const exploration = getExploration(id)
  if (!exploration) return null

  return <motion.div className="exploration-popover" role="dialog" aria-label={exploration.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
    <span className="popover-eyebrow">{exploration.eyebrow}</span>
    <strong>{exploration.title}</strong>
    <div className="mini-visualization"><Visualization id={id} /></div>
    <span className="popover-purpose">{exploration.purpose}</span>
  </motion.div>
}
