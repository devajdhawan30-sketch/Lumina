import { ArrowLeft, ArrowRight, CheckCircle2, Circle, LoaderCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getRoadmap, type Roadmap } from '../services/api'

export default function RoadmapPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]"><LoaderCircle className="animate-spin text-black/40" /></main>
  }

  if (error || !roadmap) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#f7f7f5]">
        <h1 className="text-3xl font-semibold">Roadmap unavailable</h1>
        <p className="text-black/45">{error}</p>
        <Link to="/subjects/mathematics" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">Back to topics</Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-5 pb-20 pt-32 md:px-10">
      <div className="mx-auto max-w-7xl">
        <Link to="/subjects/mathematics" className="inline-flex items-center gap-2 text-sm text-black/45 hover:text-black">
          <ArrowLeft size={16} /> Mathematics
        </Link>

        <div className="mt-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">Learning roadmap</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.05em] md:text-7xl">{roadmap.topic.title}</h1>
            <p className="mt-4 max-w-2xl leading-7 text-black/45">
              Follow the concepts in sequence, or jump to any point when you are curious.
            </p>
          </div>
          <span className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">{roadmap.nodes.length} concepts</span>
        </div>

        <div className="mt-14 overflow-x-auto pb-8">
          <div className="flex min-w-max items-center gap-3">
            {orderedNodes.map((node, index) => (
              <div key={node.id} className="flex items-center gap-3">
                <button
                  onClick={() => node.id.includes('-demo-') ? undefined : navigate(`/tutor/${node.id}`)}
                  className="group w-64 rounded-3xl border border-black/10 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-widest text-black/30">Step {index + 1}</span>
                    {index === 0 ? <CheckCircle2 size={17} /> : <Circle size={17} className="text-black/25" />}
                  </div>
                  <h2 className="mt-10 min-h-14 text-xl font-semibold tracking-tight">{node.title}</h2>
                  <p className="mt-3 text-sm text-black/40">Difficulty {node.difficulty}/5</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold">
                    {node.id.includes('-demo-') ? 'Coming soon' : <>Learn <ArrowRight size={14} /></>}
                  </div>
                </button>
                {index < orderedNodes.length - 1 && <ArrowRight className="shrink-0 text-black/20" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
