import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  ChevronRight,
  Lightbulb,
  LoaderCircle,
  Send,
  Sparkles,
} from 'lucide-react'

import {
  getConcept,
  type Concept,
} from '../services/api'

export default function TutorPage() {
  const { conceptId } = useParams<{ conceptId: string }>()

  const [concept, setConcept] = useState<Concept | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadConcept() {
      if (!conceptId) return

      try {
        setLoading(true)
        setError(null)

        const data = await getConcept(conceptId)
        setConcept(data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load concept'
        )
      } finally {
        setLoading(false)
      }
    }

    loadConcept()
  }, [conceptId])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="flex items-center gap-3 text-black/50">
          <LoaderCircle className="animate-spin" size={20} />
          Loading lesson...
        </div>
      </main>
    )
  }

  if (error || !concept) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#f7f7f5]">
        <h1 className="text-3xl font-semibold">
          We couldn't load this lesson.
        </h1>

        <p className="text-black/50">
          {error ?? 'Concept not found'}
        </p>

        <Link
          to="/learn"
          className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
        >
          Back to learning
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 pb-8 pt-28 md:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[1fr_380px]">

        {/* Learning content */}

        <section className="min-h-[calc(100vh-9rem)] rounded-3xl border border-black/10 bg-white p-6 md:p-10">

          <div className="mb-10 flex items-center justify-between">
            <Link
              to="/learn"
              className="flex items-center gap-2 text-sm text-black/45 transition hover:text-black"
            >
              <ArrowLeft size={16} />
              Back to learning
            </Link>

            <span className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
              Mathematics
            </span>
          </div>

          <div className="mx-auto max-w-3xl">

            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-black/35">
              {formatSection(concept.section)}
            </div>

            <h1 className="text-5xl font-semibold tracking-[-0.05em] md:text-6xl">
              {concept.title}
            </h1>

            <p className="mt-5 text-xl leading-8 text-black/50">
              {concept.theory.introduction}
            </p>

            <div className="my-12 h-px bg-black/10" />

            <article className="space-y-14">

              {concept.theory.sections.map((section) => (
                <section key={section.id}>

                  <h2 className="mb-6 text-3xl font-semibold tracking-tight">
                    {section.title}
                  </h2>

                  <div className="space-y-6">
                    {section.content.map((element, index) => (
                      <ContentBlock
                        key={element.id ?? `${section.id}-${index}`}
                        element={element}
                      />
                    ))}
                  </div>

                </section>
              ))}

              {concept.examples.length > 0 && (
                <Examples examples={concept.examples} />
              )}

              {concept.key_ideas.length > 0 && (
                <KeyIdeas ideas={concept.key_ideas} />
              )}

              {concept.misconceptions.length > 0 && (
                <Misconceptions
                  misconceptions={concept.misconceptions}
                />
              )}

            </article>

            <button className="mt-14 flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">
              Continue
              <ChevronRight size={16} />
            </button>

          </div>
        </section>

        {/* AI tutor */}

        <AiTutorPanel concept={concept} />

      </div>
    </main>
  )
}


/* ----------------------------- */
/* Content renderer */
/* ----------------------------- */

function ContentBlock({
  element,
}: {
  element: {
    type: string
    text?: string
    id?: string
    [key: string]: unknown
  }
}) {
  if (element.type === 'paragraph') {
    return (
      <p className="text-lg leading-9 text-black/65">
        {element.text}
      </p>
    )
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-[#f7f7f5] p-5 text-sm text-black/60">
      {element.text ?? JSON.stringify(element)}
    </div>
  )
}


/* ----------------------------- */
/* Examples */
/* ----------------------------- */

function Examples({
  examples,
}: {
  examples: {
    id: string
    question: string
    solution: string
  }[]
}) {
  return (
    <section>
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">
        Try thinking about it
      </h2>

      <div className="space-y-5">
        {examples.map((example, index) => (
          <details
            key={example.id}
            className="group rounded-3xl border border-black/10 bg-[#f7f7f5]"
          >
            <summary className="cursor-pointer list-none p-6">
              <div className="flex gap-4">
                <span className="text-sm font-semibold text-black/30">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <p className="font-medium leading-7">
                  {example.question}
                </p>
              </div>
            </summary>

            <div className="border-t border-black/10 px-6 py-5 text-black/55">
              {example.solution}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}


/* ----------------------------- */
/* Key ideas */
/* ----------------------------- */

function KeyIdeas({
  ideas,
}: {
  ideas: string[]
}) {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <Lightbulb size={21} />
        <h2 className="text-3xl font-semibold tracking-tight">
          Key ideas
        </h2>
      </div>

      <div className="grid gap-3">
        {ideas.map((idea) => (
          <div
            key={idea}
            className="rounded-2xl bg-[#f7f7f5] px-5 py-4 text-black/60"
          >
            {idea}
          </div>
        ))}
      </div>
    </section>
  )
}


/* ----------------------------- */
/* Misconceptions */
/* ----------------------------- */

function Misconceptions({
  misconceptions,
}: {
  misconceptions: string[]
}) {
  return (
    <section>
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">
        Watch out for these ideas
      </h2>

      <div className="space-y-3">
        {misconceptions.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-black/10 px-5 py-4 text-black/55"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  )
}


/* ----------------------------- */
/* AI panel */
/* ----------------------------- */

function AiTutorPanel({
  concept,
}: {
  concept: Concept
}) {
  return (
    <aside className="flex min-h-[calc(100vh-9rem)] flex-col rounded-3xl border border-black/10 bg-[#111] text-white">

      <div className="border-b border-white/10 p-6">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
            <Bot size={20} />
          </div>

          <div>
            <p className="font-semibold">
              AI Tutor
            </p>

            <p className="text-xs text-white/40">
              Ask anything about {concept.title}
            </p>
          </div>

        </div>

      </div>

      <div className="flex-1 p-6">

        <div className="mb-8 flex gap-3">

          <Sparkles
            className="mt-1 shrink-0 text-white/40"
            size={17}
          />

          <p className="text-sm leading-6 text-white/60">
            What can I help you understand about {concept.title}?
          </p>

        </div>

        <div className="space-y-2">

          {[
            'Explain this simpler',
            'Give me an example',
            'Why does this work?',
          ].map((action) => (
            <button
              key={action}
              className="w-full rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              {action}
            </button>
          ))}

        </div>

      </div>

      <div className="p-4">

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">

          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
            placeholder="Ask a doubt..."
          />

          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black">
            <Send size={15} />
          </button>

        </div>

      </div>

    </aside>
  )
}


/* ----------------------------- */
/* Helpers */
/* ----------------------------- */

function formatSection(section: string) {
  return section
    .split('-')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ')
}