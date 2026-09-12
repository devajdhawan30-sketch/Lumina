import 'katex/dist/katex.min.css'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import renderMathInElement from 'katex/contrib/auto-render'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  ChevronRight,
  Lightbulb,
  LoaderCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import ExplorationPopover from '../components/ExplorationPopover'
import type { ExplorationId } from '../data/explorations'
import {
  askAI,
  getConcept,
  type AIMessage,
  type Concept,
  type ContentElement,
} from '../services/api'

type Highlight = {
  id?: string
  text: string
  explorationId?: ExplorationId
  actions?: string[]
}

/*
 * MathText
 *
 * Renders normal text while also converting LaTeX such as:
 * $x^2 + y^2 = r^2$
 * \(x^2 + y^2 = r^2\)
 * $$x^2 + y^2 = r^2$$
 * \[x^2 + y^2 = r^2\]
 *
 * This component can now be used inside headings, paragraphs,
 * cards, examples, key ideas, misconceptions, etc.
 */
function MathText({
  children,
  as: Component = 'span',
  className,
}: {
  children: string
  as?: 'span' | 'div'
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current) return

    // Reset the element before rendering again.
    ref.current.textContent = children

    renderMathInElement(ref.current, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
      strict: false,
    })
  }, [children])

  return (
    <Component
      ref={ref as React.RefObject<any>}
      className={className}
    />
  )
}

export default function TutorPage() {
  const { conceptId } = useParams<{ conceptId: string }>()
  const navigate = useNavigate()
  const [concept, setConcept] = useState<Concept | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [selectionPosition, setSelectionPosition] = useState({ top: 0, left: 0 })
  const [selectedContentId, setSelectedContentId] = useState<string | undefined>()
  const [showSelectionAction, setShowSelectionAction] = useState(false)
  const [tutorPrompt, setTutorPrompt] = useState<string | undefined>()

  useEffect(() => {
    async function loadConcept() {
      if (!conceptId) return

      try {
        setLoading(true)
        setError(null)
        setSelectedText('')
        setShowSelectionAction(false)
        setTutorPrompt(undefined)
        setConcept(await getConcept(conceptId))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load concept')
      } finally {
        setLoading(false)
      }
    }

    loadConcept()
  }, [conceptId])

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()

      if (!selection || !text || selection.rangeCount === 0) {
        setShowSelectionAction(false)
        return
      }

      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer

      const node =
        container.nodeType === Node.TEXT_NODE
          ? container.parentElement
          : (container as Element)

      const article = (node as HTMLElement | null)?.closest(
        '[data-learning-article="true"]',
      )

      if (!article) {
        setShowSelectionAction(false)
        return
      }

      const rect = range.getBoundingClientRect()

      setSelectedText(text)
      setSelectionPosition({
        top: Math.max(82, rect.bottom + 8),
        left: Math.min(
          Math.max(16, rect.left + rect.width / 2),
          window.innerWidth - 90,
        ),
      })

      const contentElement = (node as HTMLElement | null)?.closest(
        '[data-content-id]',
      )

      setSelectedContentId(
        contentElement?.getAttribute('data-content-id') ?? undefined,
      )

      setShowSelectionAction(true)
    }

    document.addEventListener('selectionchange', handleSelection)

    return () =>
      document.removeEventListener('selectionchange', handleSelection)
  }, [])

  const nextConceptId = concept?.connections.leads_to?.[0]

  const continueToNext = async () => {
    if (!concept) return

    if (!nextConceptId) {
      navigate(`/topics/${concept.topic}`)
      return
    }

    try {
      await getConcept(nextConceptId)
      navigate(`/tutor/${nextConceptId}`)
    } catch {
      navigate(`/topics/${concept.topic}`)
    }
  }

  const askAboutSelection = () => {
    if (!selectedText) return

    setTutorPrompt(`Explain this to me: "${selectedText}"`)
    setShowSelectionAction(false)
  }

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
          to="/subjects/mathematics"
          className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
        >
          Back to topics
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 pb-8 pt-28 md:px-8">
      {showSelectionAction && (
        <button
          onMouseDown={(event) => event.preventDefault()}
          onClick={askAboutSelection}
          style={{
            top: selectionPosition.top,
            left: selectionPosition.left,
          }}
          className="fixed z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-semibold text-white shadow-2xl transition hover:scale-105"
        >
          <Bot size={14} />
          Ask Tutor
        </button>
      )}

      <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[1fr_380px]">
        <section className="min-h-[calc(100vh-9rem)] rounded-3xl border border-black/10 bg-white p-6 md:p-10">
          <div className="mb-10 flex items-center justify-between">
            <Link
              to={`/topics/${concept.topic}`}
              className="flex items-center gap-2 text-sm text-black/45 transition hover:text-black"
            >
              <ArrowLeft size={16} />
              Back to roadmap
            </Link>

            <span className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
              {formatSection(concept.subject)}
            </span>
          </div>

          <div className="mx-auto max-w-3xl">
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-black/35">
              <MathText>{formatSection(concept.section)}</MathText>
            </div>

            <h1 className="text-5xl font-semibold tracking-[-0.05em] md:text-6xl">
              <MathText>{concept.title}</MathText>
            </h1>

            <p className="mt-5 text-xl leading-8 text-black/50">
              <MathText>{concept.theory.introduction}</MathText>
            </p>

            <div className="my-12 h-px bg-black/10" />

            <article
              data-learning-article="true"
              className="space-y-14"
            >
              {concept.theory.sections.map((section) => (
                <section key={section.id}>
                  <h2 className="mb-6 text-3xl font-semibold tracking-tight">
                    <MathText>{section.title}</MathText>
                  </h2>

                  <div className="space-y-6">
                    {section.content.map((element, index) => (
                      <ContentBlock
                        key={element.id ?? `${section.id}-${index}`}
                        element={element}
                        onAskTutor={(prompt) => setTutorPrompt(prompt)}
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

            <div className="mt-14 flex items-center gap-3">
              {nextConceptId ? (
                <button
                  onClick={continueToNext}
                  className="flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Continue
                  <ChevronRight size={16} />
                </button>
              ) : (
                <Link
                  to={`/topics/${concept.topic}`}
                  className="flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
                >
                  Back to roadmap
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </section>

        <AiTutorPanel
          concept={concept}
          selectedText={selectedText}
          selectedContentId={selectedContentId}
          initialPrompt={tutorPrompt}
          onInitialPromptConsumed={() => setTutorPrompt(undefined)}
          onClearSelection={() => setSelectedText('')}
        />
      </div>
    </main>
  )
}

function ContentBlock({
  element,
  onAskTutor,
}: {
  element: ContentElement
  onAskTutor: (prompt: string) => void
}) {
  if (element.type === 'paragraph') {
    return (
      <HighlightedParagraph
        contentId={element.id}
        text={element.text ?? ''}
        highlights={element.highlights as Highlight[] | undefined}
        onAskTutor={onAskTutor}
      />
    )
  }

  return (
    <div
      data-content-id={element.id}
      className="rounded-2xl border border-black/10 bg-[#f7f7f5] p-5 text-sm text-black/60"
    >
      <MathText>{element.text ?? JSON.stringify(element)}</MathText>
    </div>
  )
}

function HighlightedParagraph({
  contentId,
  text,
  highlights,
  onAskTutor,
}: {
  contentId?: string
  text: string
  highlights?: Highlight[]
  onAskTutor: (prompt: string) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  if (!highlights?.length) {
    return (
      <p
        data-content-id={contentId}
        className="text-lg leading-9 text-black/65"
      >
        <MathText>{text}</MathText>
      </p>
    )
  }

  const validHighlights = highlights
    .filter(
      (highlight) =>
        highlight.text && highlight.explorationId,
    )
    .map((highlight, index) => ({
      ...highlight,
      key: highlight.id ?? `${highlight.text}-${index}`,
    }))

  if (!validHighlights.length) {
    return (
      <p
        data-content-id={contentId}
        className="text-lg leading-9 text-black/65"
      >
        <MathText>{text}</MathText>
      </p>
    )
  }

  const matches = validHighlights
    .map((highlight) => ({
      highlight,
      start: text.indexOf(highlight.text),
    }))
    .filter((item) => item.start >= 0)
    .sort((a, b) => a.start - b.start)

  if (!matches.length) {
    return (
      <p
        data-content-id={contentId}
        className="text-lg leading-9 text-black/65"
      >
        <MathText>{text}</MathText>
      </p>
    )
  }

  const pieces: ReactNode[] = []
  let cursor = 0

  matches.forEach(({ highlight, start }) => {
    if (start < cursor) return

    pieces.push(
      <MathText key={`text-${highlight.key}`}>
        {text.slice(cursor, start)}
      </MathText>,
    )

    const isActive = activeId === highlight.key

    pieces.push(
      <span
        key={`highlight-${highlight.key}`}
        className="relative inline-block"
        onMouseEnter={() => setActiveId(highlight.key)}
        onMouseLeave={() => setActiveId(null)}
      >
        <button
          type="button"
          className="content-highlight"
          onFocus={() => setActiveId(highlight.key)}
          onBlur={() => setActiveId(null)}
          aria-label={`Explore ${highlight.text}`}
        >
          {highlight.text}
        </button>

        {isActive && highlight.explorationId && (
          <ExplorationPopover
            id={highlight.explorationId}
            actions={highlight.actions}
            onAskTutor={() => {
              onAskTutor(
                `Explain this to me: "${highlight.text}"`,
              )
              setActiveId(null)
            }}
            onWhy={() => {
              onAskTutor(
                `Why is "${highlight.text}" important here? Explain the reasoning behind it.`,
              )
              setActiveId(null)
            }}
          />
        )}
      </span>,
    )

    cursor = start + highlight.text.length
  })

  pieces.push(
    <MathText key="text-tail">
      {text.slice(cursor)}
    </MathText>,
  )

  return (
    <p
      data-content-id={contentId}
      className="text-lg leading-9 text-black/65"
    >
      {pieces}
    </p>
  )
}

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
        <MathText>Try thinking about it</MathText>
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
                  <MathText>{example.question}</MathText>
                </p>
              </div>
            </summary>

            <div className="border-t border-black/10 px-6 py-5 text-black/55">
              <MathText>{example.solution}</MathText>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

function KeyIdeas({ ideas }: { ideas: string[] }) {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <Lightbulb size={21} />

        <h2 className="text-3xl font-semibold tracking-tight">
          <MathText>Key ideas</MathText>
        </h2>
      </div>

      <div className="grid gap-3">
        {ideas.map((idea) => (
          <div
            key={idea}
            className="rounded-2xl bg-[#f7f7f5] px-5 py-4 text-black/60"
          >
            <MathText>{idea}</MathText>
          </div>
        ))}
      </div>
    </section>
  )
}

function Misconceptions({
  misconceptions,
}: {
  misconceptions: string[]
}) {
  return (
    <section>
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">
        <MathText>Watch out for these ideas</MathText>
      </h2>

      <div className="space-y-3">
        {misconceptions.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-black/10 px-5 py-4 text-black/55"
          >
            <MathText>{item}</MathText>
          </div>
        ))}
      </div>
    </section>
  )
}

function AiTutorPanel({
  concept,
  selectedText,
  selectedContentId,
  initialPrompt,
  onInitialPromptConsumed,
  onClearSelection,
}: {
  concept: Concept
  selectedText: string
  selectedContentId?: string
  initialPrompt?: string
  onInitialPromptConsumed: () => void
  onClearSelection: () => void
}) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'normal' | 'socratic'>('normal')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!initialPrompt) return

    setInput(initialPrompt)
    onInitialPromptConsumed()

    requestAnimationFrame(() => inputRef.current?.focus())
  }, [initialPrompt, onInitialPromptConsumed])

  const sendMessage = async (messageOverride?: string) => {
    const message = (messageOverride ?? input).trim()

    if (!message || sending) return

    setSending(true)
    setError('')

    const history = messages

    setMessages((current) => [
      ...current,
      {
        role: 'user',
        text: message,
      },
    ])

    setInput('')

    try {
      const result = await askAI({
        conceptId: concept.id,
        contentId: selectedContentId,
        mode,
        message,
        history,
      })

      setMessages((current) => [
        ...current,
        {
          role: 'model',
          text: result.answer,
        },
      ])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'AI tutor failed to respond',
      )
    } finally {
      setSending(false)
    }
  }

  const quickActions =
    mode === 'socratic'
      ? [
          // ['Start a Socratic check', `I will now start explaining ${concept.title}. Assess .`],
          // ['Test me with a question', 'Ask me one conceptual question about this topic. Do not reveal the answer until you have evaluated my response.'],
          // ['Assess my grasp', 'Based on my explanations so far, assess my grasp using Strong / Developing / Needs work, explain what I understand, what is shaky, and my next step.'],
        ]
      : [
          [
            'Explain this simpler',
            'Explain the current concept in simpler words.',
          ],
          [
            'Give me an example',
            'Give me a clear example of the current concept.',
          ],
          [
            'Why does this work?',
            'Why does this work? Explain the reasoning.',
          ],
        ]

  return (
    <aside className="sticky top-24 flex min-h-[calc(100vh-9rem)] max-h-[calc(100vh-6rem)] flex-col rounded-3xl border border-black/10 bg-[#111] text-white">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
            <Bot size={20} />
          </div>

          <div className="min-w-0">
            <p className="font-semibold">AI Tutor</p>

            <p className="truncate text-xs text-white/40">
              Ask, explore, or test your understanding
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setMode('normal')}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              mode === 'normal'
                ? 'bg-white text-black'
                : 'text-white/45 hover:text-white'
            }`}
          >
            Tutor
          </button>

          <button
            type="button"
            onClick={() => setMode('socratic')}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              mode === 'socratic'
                ? 'bg-white text-black'
                : 'text-white/45 hover:text-white'
            }`}
          >
            Socratic Mode
          </button>
        </div>

        {mode === 'socratic' && (
          <p className="mt-3 rounded-xl bg-white/5 p-3 text-xs leading-5 text-white/50">
            You explain the idea. The AI asks probing questions, checks your
            reasoning, and gives you a grasp assessment.
          </p>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        {selectedText && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/35">
              Selected text

              <button
                onClick={onClearSelection}
                aria-label="Clear selected text"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-sm leading-6 text-white/75">
              “{selectedText}”
            </p>
          </div>
        )}

        {messages.length === 0 && (
          <>
            <div className="flex gap-3">
              <Sparkles
                className="mt-1 shrink-0 text-white/40"
                size={17}
              />

              <p className="text-sm leading-6 text-white/60">
                {mode === 'socratic'
                  ? 'Explain the concept in your own words. I will question your reasoning instead of giving away the answer.'
                  : 'Select text in the lesson and ask me about it, or type a question below.'}
              </p>
            </div>

            <div className="space-y-2">
              {quickActions.map(([label, prompt]) => (
                <button
                  key={label}
                  onClick={() => sendMessage(prompt)}
                  className="w-full rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === 'user'
                ? 'ml-6 rounded-2xl bg-white px-4 py-3 text-sm text-black'
                : 'mr-4 rounded-2xl bg-white/5 px-4 py-3 text-sm leading-6 text-white/75'
            }
          >
            {message.role === 'user' ? (
              message.text
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {message.text}
              </ReactMarkdown>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-sm text-white/40">
            <LoaderCircle
              size={15}
              className="animate-spin"
            />
            Thinking...
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">
            {error}
          </p>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                sendMessage()
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
            placeholder={
              mode === 'socratic'
                ? 'Explain your thinking...'
                : 'Ask a doubt...'
            }
            disabled={sending}
          />

          <button
            onClick={() => sendMessage()}
            disabled={sending || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black disabled:opacity-30"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function formatSection(section: string) {
  return section
    .split('-')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')
}