import { ArrowLeft, ArrowUpRight, Map } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getSubject, type SubjectDetail } from '../services/api'
import { LoaderCircle } from 'lucide-react'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { revealOnScroll } from '../animations/scrollAnimations'

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
  const page = useRef<HTMLElement>(null)

  useGSAP(() => {
    revealOnScroll(Array.from(page.current?.querySelectorAll('[data-topic-card]') ?? []), 0.09)
  }, { scope: page, dependencies: [loading] })

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
      <main className="page flex min-h-screen items-center justify-center">
        <LoaderCircle className="animate-spin text-black/40" />
      </main>
    )
  }

  if (!subject) {
    return (
      <main className="page flex min-h-screen flex-col items-center justify-center gap-5">
        <h1 className="text-3xl font-semibold">Subject not found</h1>
        <Link to="/subjects" className="btn btn-primary px-6 py-3 text-sm">
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
    <main ref={page} data-page-entrance className="page subject-topics-discovery px-5 pb-20 pt-32 md:px-10">
      <div className="mx-auto max-w-7xl">
        <Link to="/subjects" className="btn-ghost mb-10 inline-flex items-center gap-2 text-sm">
          <ArrowLeft size={16} /> All subjects
        </Link>

        <div className="subject-topics-hero flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p data-motion="eyebrow" className="eyebrow">Subject</p>
            <h1 data-motion="title" className="hero-title mt-3">{subject.title}</h1>
            <p data-motion="description" className="lede mt-5">
              Choose a topic and see the learning path behind it.
            </p>
          </div>
          <div data-motion="cta" className="card card-compact subject-topics-count text-sm text-muted">
            {subject.conceptCount} concepts in the current library
          </div>
        </div>

        <div data-motion="content" className="subject-topics-grid mt-16 grid gap-4 md:grid-cols-2">
          {topicCatalog.map((topic, index) => {
            const available = topic.available
            const href = available ? `/topics/${topic.id}` : '#'

            return (
              <Link
                key={topic.id}
                to={href}
                onClick={(e) => !available && e.preventDefault()}
                data-topic-card
                className={`subject-topic-card card card-feature group ${
                  available ? 'card-hover' : 'cursor-default opacity-55'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm text-black/30">{String(index + 1).padStart(2, '0')}</span>
                  {available ? <ArrowUpRight size={20} className="text-black/25 group-hover:text-black" /> : <span className="text-xs uppercase tracking-widest text-black/30">Soon</span>}
                </div>

                <div className="pb-4 pt-16">
                  <h2 className="text-3xl font-semibold tracking-tight">{topic.title}</h2>
                  <p className="mt-3 max-w-md leading-7 text-muted">{topic.description ?? `${topic.title} concepts`}</p>
                </div>

                {available && (
  <div className="mt-5 flex flex-wrap items-center gap-2">
    <span className="btn btn-secondary pointer-events-none !min-h-0 px-4 py-2.5 text-sm">
      <Map size={15} />
      View roadmap
    </span>

    {topic.id === 'trigonometry' && (
      <Link
        to="/explore/applications/trigonometry"
        onClick={(e) => e.stopPropagation()}
        className="btn btn-accent !min-h-0 px-4 py-2.5 text-sm"
      >
        <ArrowUpRight size={15} />
        Explore applications
      </Link>
    )}
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
