import { ArrowLeft, ArrowRight, BookOpen, LoaderCircle, Map } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getTopic, type TopicDetail } from '../services/api'
import { trigonometryModules } from '../data/topicModules'

export default function TopicModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const module = trigonometryModules.find((item) => item.id === moduleId)
  const [topic, setTopic] = useState<TopicDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!module) {
      setLoading(false)
      return
    }
    setLoading(true)
    getTopic('trigonometry')
      .then(setTopic)
      .catch(() => setTopic(null))
      .finally(() => setLoading(false))
  }, [module])

  const concepts = useMemo(() => {
    if (!module || !topic) return []
    const allowed = new Set(module.conceptIds)
    return topic.concepts.filter((concept) => allowed.has(concept.id))
  }, [module, topic])

  if (!module) {
    return (
      <main className="page flex min-h-screen flex-col items-center justify-center gap-5">
        <h1 className="text-3xl font-semibold">Module not found</h1>
        <Link to="/topics/trigonometry" className="btn btn-primary px-6 py-3 text-sm">
          Back to Trigonometry
        </Link>
      </main>
    )
  }

  return (
    <main className="page min-h-screen px-5 pb-24 pt-28 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Link to="/subjects/mathematics" className="hover:text-ink">Mathematics</Link>
          <span>/</span>
          <Link to="/topics/trigonometry" className="hover:text-ink">Trigonometry</Link>
          <span>/</span>
          <span className="text-ink-soft">{module.title}</span>
        </div>

        <header className="mt-12 max-w-4xl">
          <p className="eyebrow flex items-center gap-2">
            <Map size={14} /> Module
          </p>
          <h1 className="hero-title mt-4">{module.title}</h1>
          <p className="lede mt-5">{module.description}</p>
        </header>

        <div className="mt-14 flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div>
            <p className="eyebrow">Topics in this module</p>
            <p className="mt-2 text-sm text-muted">
              Choose a topic to open its lesson.
            </p>
          </div>
          <span className="count-pill">
            {loading ? '…' : concepts.length} topics
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <LoaderCircle className="animate-spin text-muted" />
          </div>
        ) : concepts.length === 0 ? (
          <div className="card card-feature mt-8 text-muted">
            Topics for this module are not available yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {concepts.map((concept, index) => (
              <Link
                key={concept.id}
                to={`/tutor/${concept.id}`}
                className="card card-hover group flex items-center gap-5 p-5"
              >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mist text-xs font-bold text-faint">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold tracking-tight">{concept.title}</h2>
                  <div className="mt-2 flex items-center gap-2 text-xs text-faint">
                    <BookOpen size={13} />
                    Difficulty {concept.difficulty}/5
                  </div>
                </div>
                <ArrowRight size={17} className="shrink-0 text-faint transition group-hover:translate-x-1 group-hover:text-ink" />
              </Link>
            ))}
          </div>
        )}

        <Link to="/topics/trigonometry" className="btn-ghost mt-10 inline-flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft size={15} /> Back to Trigonometry
        </Link>
      </div>
    </main>
  )
}
