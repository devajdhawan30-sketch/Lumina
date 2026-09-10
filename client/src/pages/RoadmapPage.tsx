import { ArrowLeft, ArrowRight, CheckCircle2, Circle, LoaderCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getRoadmap, type Roadmap } from '../services/api'

export default function RoadmapPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)

  useEffect(() => {
    if (!topicId) return

    getRoadmap(topicId)
      .then(setRoadmap)
      .catch(() => {
        const fallbackTitles: Record<string, string[]> = {
          calculus: ['Limits', 'Derivatives', 'Applications of Derivatives', 'Integrals', 'Applications of Integrals'],
          geometry: ['Points & Lines', 'Angles', 'Triangles', 'Circles', 'Geometric Proofs'],
          algebra: ['Expressions', 'Equations', 'Functions', 'Polynomials', 'Advanced Algebra'],
        }

        const titles = fallbackTitles[topicId] ?? ['Foundations', 'Core Concepts', 'Applications', 'Advanced Ideas']
        setRoadmap({
          topic: {
            id: topicId,
            title: topicId.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          },
          nodes: titles.map((title, index) => ({
            id: `${topicId}-demo-${index}`,
            title,
            difficulty: Math.min(5, index + 1),
          })),
          edges: titles.slice(0, -1).map((_, index) => ({
            from: `${topicId}-demo-${index}`,
            to: `${topicId}-demo-${index + 1}`,
            type: 'leads_to' as const,
          })),
        })
      })
      .finally(() => setLoading(false))
  }, [topicId])

  const orderedNodes = useMemo(() => {
    if (!roadmap) return []
    const incoming = new Map(roadmap.nodes.map((node) => [node.id, 0]))
    for (const edge of roadmap.edges) {
      if (edge.type !== 'related' && incoming.has(edge.to)) {
        incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1)
      }
    }

    const remaining = [...roadmap.nodes]
    const result: typeof remaining = []
    while (remaining.length) {
      const next = remaining.find((node) => (incoming.get(node.id) ?? 0) === 0) ?? remaining[0]
      result.push(next)
      remaining.splice(remaining.indexOf(next), 1)
      for (const edge of roadmap.edges.filter((e) => e.from === next.id && e.type !== 'related')) {
        if (incoming.has(edge.to)) incoming.set(edge.to, Math.max(0, (incoming.get(edge.to) ?? 0) - 1))
      }
    }
    return result
  }, [roadmap])

  if (loading) {
    return <main className="page flex min-h-screen items-center justify-center"><LoaderCircle className="animate-spin text-muted" /></main>
  }

  if (error || !roadmap) {
    return (
      <main className="page flex min-h-screen flex-col items-center justify-center gap-5">
        <h1 className="text-3xl font-semibold">Roadmap unavailable</h1>
        <p className="text-muted">{error}</p>
        <Link to="/subjects/mathematics" className="btn btn-primary px-6 py-3 text-sm">Back to topics</Link>
      </main>
    )
  }

  return (
    <main className="page min-h-screen px-5 pb-20 pt-32 md:px-10">
      <div className="mx-auto max-w-7xl">
        <Link to="/subjects/mathematics" className="btn-ghost inline-flex items-center gap-2 text-sm">
          <ArrowLeft size={16} /> Mathematics
        </Link>

        <div className="mt-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Learning roadmap</p>
            <h1 className="hero-title mt-3">{roadmap.topic.title}</h1>
            <p className="lede mt-4 max-w-2xl">
              Follow the concepts in sequence, or jump to any point when you are curious.
            </p>
          </div>
          <span className="count-pill count-pill-ink">{roadmap.nodes.length} concepts</span>
        </div>

        <div className="mt-14 overflow-x-auto pb-8">
          <div className="flex min-w-max items-center gap-3">
            {orderedNodes.map((node, index) => (
              <div key={node.id} className="flex items-center gap-3">
                <button
                  onClick={() => node.id.includes('-demo-') ? undefined : navigate(`/tutor/${node.id}`)}
                  className="card card-hover group w-64 p-5 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-widest text-faint">Step {index + 1}</span>
                    {index === 0 ? <CheckCircle2 size={17} /> : <Circle size={17} className="text-faint" />}
                  </div>
                  <h2 className="mt-10 min-h-14 text-xl font-semibold tracking-tight">{node.title}</h2>
                  <p className="mt-3 text-sm text-muted">Difficulty {node.difficulty}/5</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold">
                    {node.id.includes('-demo-') ? 'Coming soon' : <>Learn <ArrowRight size={14} /></>}
                  </div>
                </button>
                {index < orderedNodes.length - 1 && <ArrowRight className="shrink-0 text-faint" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
