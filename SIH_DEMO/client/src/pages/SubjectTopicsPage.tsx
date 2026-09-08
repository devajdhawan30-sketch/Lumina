import { ArrowLeft, ArrowUpRight, Map } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getSubject, type SubjectDetail } from '../services/api'
import { LoaderCircle } from 'lucide-react'

const demoTopics = [
  {
    id: 'trigonometry',
    title: 'Trigonometry',
    description: 'Angles, triangles, ratios, functions and equations.',
    available: true,
  },
  {
    id: 'calculus',
    title: 'Calculus',
    description: 'Limits, derivatives, integrals and change.',
    available: false,
  },
  {
    id: 'geometry',
    title: 'Geometry',
    description: 'Shapes, space, proofs and geometric reasoning.',
    available: false,
  },
  {
    id: 'algebra',
    title: 'Algebra',
    description: 'Expressions, equations, functions and patterns.',
    available: false,
  },
]

export default function SubjectTopicsPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const [subject, setSubject] = useState<SubjectDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!subjectId) return
    getSubject(subjectId)
      .then(setSubject)
      .catch(() =>
        setSubject({
          id: subjectId,
          title: subjectId.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          conceptCount: 0,
          topics: [],
        }),
      )
      .finally(() => setLoading(false))
  }, [subjectId])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <LoaderCircle className="animate-spin text-black/40" />
      </main>
    )
  }

  if (!subject) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#f7f7f5]">
        <h1 className="text-3xl font-semibold">Subject not found</h1>
        <Link to="/subjects" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">
          Back to subjects
        </Link>
      </main>
    )
  }

  const isMaths = subject.id === 'mathematics'
  const topicCatalog = isMaths
    ? demoTopics
    : [
        { id: 'foundations', title: 'Foundations', description: `Core ideas in ${subject.title}.`, available: false },
        { id: 'advanced-topics', title: 'Advanced Topics', description: `Go deeper into ${subject.title}.`, available: false },
        { id: 'applications', title: 'Applications', description: `See ${subject.title} in the real world.`, available: false },
      ]

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-5 pb-20 pt-32 md:px-10">
      <div className="mx-auto max-w-7xl">
        <Link to="/subjects" className="mb-10 inline-flex items-center gap-2 text-sm text-black/45 hover:text-black">
          <ArrowLeft size={16} /> All subjects
        </Link>

        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">Subject</p>
            <h1 className="mt-3 text-6xl font-semibold tracking-[-0.06em] md:text-8xl">{subject.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-black/50">
              Choose a topic and see the learning path behind it.
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-black/50">
            {subject.conceptCount} concepts in the current library
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {topicCatalog.map((topic, index) => {
            const available = topic.available
            const href = available ? `/topics/${topic.id}` : '#'

            return (
              <Link
                key={topic.id}
                to={href}
                onClick={(e) => !available && e.preventDefault()}
                className={`group rounded-3xl border border-black/10 bg-white p-7 transition ${
                  available ? 'hover:-translate-y-1 hover:shadow-xl' : 'cursor-default opacity-55'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm text-black/30">{String(index + 1).padStart(2, '0')}</span>
                  {available ? <ArrowUpRight size={20} className="text-black/25 group-hover:text-black" /> : <span className="text-xs uppercase tracking-widest text-black/30">Soon</span>}
                </div>

                <div className="pb-4 pt-16">
                  <h2 className="text-3xl font-semibold tracking-tight">{topic.title}</h2>
                  <p className="mt-3 max-w-md leading-7 text-black/45">{topic.description ?? `${topic.title} concepts`}</p>
                </div>

                {available && (
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold">
                    <Map size={15} /> View roadmap
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
