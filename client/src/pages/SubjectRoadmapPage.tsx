import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Circle, Map } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { subjectRoadmaps, type RoadmapNode } from '../data/subjectRoadmaps'
import { trigonometryModules } from '../data/topicModules'
import { useGSAP } from '@gsap/react'
import { gsap, motionEase, prefersReducedMotion } from '../animations/gsap'

export default function SubjectRoadmapPage() {
  const { subjectId = 'mathematics' } = useParams<{ subjectId: string }>()
  const roadmap = subjectRoadmaps[subjectId] ?? subjectRoadmaps.mathematics
  const [selectedNode, setSelectedNode] = useState<RoadmapNode>(roadmap.nodes[0])
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const page = useRef<HTMLElement>(null)
  const isTrigonometry = selectedNode.topicId === 'trigonometry'

  useEffect(() => {
    setSelectedNode(roadmap.nodes[0])
  }, [roadmap])

  const edgePaths = useMemo(
    () =>
      roadmap.edges.map((edge) => {
        const from = roadmap.nodes.find((node) => node.id === edge.from)
        const to = roadmap.nodes.find((node) => node.id === edge.to)
        if (!from || !to) return null

        return {
          key: `${edge.from}-${edge.to}`,
          from: edge.from,
          to: edge.to,
          x1: `${from.position.x}%`,
          y1: `${from.position.y}%`,
          x2: `${to.position.x}%`,
          y2: `${to.position.y}%`,
        }
      }).filter(Boolean),
    [roadmap],
  )

  const lessons = selectedNode.lessons ?? []
  const canLearn = Boolean(selectedNode.topicId)
  const activeNodeId = hoveredNodeId ?? selectedNode.id

  useGSAP(() => {
    const canvas = page.current?.querySelector<HTMLElement>('.subject-roadmap-canvas')
    if (!canvas || prefersReducedMotion()) return

    const lines = Array.from(canvas.querySelectorAll<SVGLineElement>('.subject-roadmap-edge'))
    const nodes = Array.from(canvas.querySelectorAll<HTMLElement>('.subject-roadmap-node'))
    const labels = Array.from(canvas.querySelectorAll<HTMLElement>('.node-number'))

    lines.forEach((line) => {
      const length = line.getTotalLength()
      gsap.set(line, { strokeDasharray: length, strokeDashoffset: length })
    })

    gsap.timeline({
      scrollTrigger: {
        trigger: canvas,
        start: 'top 78%',
        once: true,
      },
    })
      .from(canvas, { autoAlpha: 0, y: 20, duration: 0.42, ease: motionEase })
      .to(lines, { strokeDashoffset: 0, duration: 0.62, stagger: 0.05, ease: motionEase }, '-=0.12')
      .from(nodes, { autoAlpha: 0, scale: 0.96, duration: 0.38, stagger: 0.06, ease: motionEase }, '-=0.14')
      .from(labels, { autoAlpha: 0, y: 6, duration: 0.25, stagger: 0.035, ease: motionEase }, '-=0.12')
  }, { scope: page, dependencies: [roadmap] })

  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from('.roadmap-detail', {
      autoAlpha: 0,
      x: 16,
      duration: 0.36,
      ease: motionEase,
    })
    gsap.from('.roadmap-lesson', {
      autoAlpha: 0,
      y: 10,
      duration: 0.3,
      stagger: 0.045,
      ease: motionEase,
      delay: 0.08,
    })
  }, { scope: page, dependencies: [selectedNode.id] })

  return (
    <main ref={page} data-page-entrance className="subject-roadmap min-h-screen bg-[#f4f6fa] px-4 pb-16 pt-28 text-[#18213b] md:px-8">
      <div className="mx-auto max-w-[1500px]">
        <Link to="/subjects" className="mb-6 inline-flex items-center gap-2 text-sm text-black/45 hover:text-black">
          <ArrowLeft size={16} /> All Subjects
        </Link>

        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p data-motion="eyebrow" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#687590]">
              <Map size={14} /> Complete subject roadmap
            </p>
            <h1 data-motion="title" className="mt-3 font-serif text-5xl font-semibold tracking-[-0.04em] md:text-7xl">
              {roadmap.title} Roadmap
            </h1>
            <p data-motion="description" className="mt-3 max-w-2xl text-base leading-7 text-[#69748b]">
              {roadmap.subtitle}
            </p>
          </div>
          <Link
            to={`/subjects/${roadmap.subjectId}`}
            data-motion="cta"
            className="btn btn-secondary px-5 py-3 text-sm"
          >
            Explore topics <ArrowRight size={15} />
          </Link>
        </div>

        <div data-motion="content" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
          <section className="roadmap-desktop overflow-x-auto rounded-[30px]">
            <div className="subject-roadmap-canvas">
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <marker id="roadmap-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                    <path d="M0,0 L5,2.5 L0,5 z" fill="#93a4c0" />
                  </marker>
                </defs>
                {edgePaths.map((edge) =>
                  edge ? (
                    <line
                      key={edge.key}
                      x1={edge.x1}
                      y1={edge.y1}
                      x2={edge.x2}
                      y2={edge.y2}
                      className={`subject-roadmap-edge ${edge.from === activeNodeId || edge.to === activeNodeId ? 'is-related' : ''}`}
                    />
                  ) : null,
                )}
              </svg>

              {roadmap.nodes.map((node, index) => {
                const active = selectedNode.id === node.id
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedNode(node)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    className={`subject-roadmap-node ${node.kind} ${active ? 'active' : ''}`}
                    style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
                  >
                    <span className="node-number">{String(index + 1).padStart(2, '0')} · {node.kind}</span>
                    <h3>{node.title}</h3>
                    <p>{node.subtitle}</p>
                  </button>
                )
              })}

              <div className="absolute bottom-5 left-5 rounded-2xl border border-black/10 bg-white/90 p-4 text-xs shadow-sm backdrop-blur">
                <p className="mb-2 font-bold">Node types</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-black/55">
                  <span>🟢 Foundational</span>
                  <span>🔵 Core</span>
                  <span>🟡 Application</span>
                  <span>🔴 Advanced</span>
                </div>
              </div>
            </div>
          </section>

          <section className="roadmap-mobile" aria-label={`${roadmap.title} learning path`}>
            <ol>
              {roadmap.nodes.map((node, index) => {
                const active = selectedNode.id === node.id
                return (
                  <li key={node.id} className={active ? 'active' : ''}>
                    <button type="button" onClick={() => setSelectedNode(node)}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{node.title}</strong>
                      <small>{node.subtitle}</small>
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>

          <aside className="roadmap-detail rounded-[28px] border border-[#dfe4ec] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b7690]">Selected node</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight">{selectedNode.title}</h2>
              </div>
              {selectedNode.kind === 'foundational' ? <CheckCircle2 className="mt-1 text-emerald-600" /> : <Circle className="mt-1 text-[#8da0bd]" />}
            </div>

            <p className="mt-4 text-sm leading-6 text-[#69748b]">{selectedNode.description}</p>

            <div className="mt-6 rounded-2xl border border-[#e1e6ee] bg-[#f7f9fc] p-4">
              <div className="flex items-center gap-2 font-semibold">
                <BookOpen size={17} /> {isTrigonometry ? 'Modules' : "What you'll learn"}
              </div>

              {isTrigonometry ? (
                <div className="mt-4 space-y-2">
                  {trigonometryModules.map((module, index) => (
                    <Link
                      key={module.id}
                      to={`/topics/trigonometry/module/${module.id}`}
                      className="roadmap-lesson group flex items-center gap-3 transition hover:-translate-y-0.5 hover:bg-white"
                    >
                      <span className="font-semibold text-[#8a96aa]">{index + 1}.</span>
                      <span className="flex-1">{module.title}</span>
                      <ArrowRight size={14} className="text-black/20 transition group-hover:translate-x-1 group-hover:text-black" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {lessons.map((lesson, index) => (
                    <div key={`${lesson}-${index}`} className="roadmap-lesson flex gap-3 text-sm text-[#4f5b72]">
                      <span className="font-semibold text-[#8a96aa]">{index + 1}.</span>
                      <span>{lesson}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {canLearn && (
              <Link
                to={`/topics/${selectedNode.topicId}`}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25324a] px-5 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                {isTrigonometry ? 'Explore applications' : 'Open node roadmap'} <ArrowRight size={16} />
              </Link>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}
