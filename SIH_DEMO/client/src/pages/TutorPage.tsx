import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
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

import {
  askAI,
  getConcept,
  type AIMessage,
  type Concept,
  type ContentElement,
} from '../services/api'

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
      const node = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element
      const article = (node as HTMLElement | null)?.closest('[data-learning-article="true"]')

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

      const contentElement = (node as HTMLElement | null)?.closest('[data-content-id]')
      setSelectedContentId(contentElement?.getAttribute('data-content-id') ?? undefined)
      setShowSelectionAction(true)
    }

    document.addEventListener('selectionchange', handleSelection)
    return () => document.removeEventListener('selectionchange', handleSelection)
  }, [])

  const nextConceptId = concept?.connections.leads_to?.[0]

  const continueToNext = async () => {
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
          <LoaderCircle className="animate-spin" size={20} /> Loading lesson...
        </div>
      </main>
    )
  }

  if (error || !concept) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#f7f7f5]">
        <h1 className="text-3xl font-semibold">We couldn't load this lesson.</h1>
        <p className="text-black/50">{error ?? 'Concept not found'}</p>
        <Link to="/subjects/mathematics" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">
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
          style={{ top: selectionPosition.top, left: selectionPosition.left }}
          className="fixed z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-semibold text-white shadow-2xl transition hover:scale-105"
        >
          <Bot size={14} /> Ask Tutor
        </button>
      )}

      <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[1fr_380px]">
        <section className="min-h-[calc(100vh-9rem)] rounded-3xl border border-black/10 bg-white p-6 md:p-10">
          <div className="mb-10 flex items-center justify-between">
            <Link to={`/topics/${concept.topic}`} className="flex items-center gap-2 text-sm text-black/45 transition hover:text-black">
              <ArrowLeft size={16} /> Back to roadmap
            </Link>
            <span className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">{formatSection(concept.subject)}</span>
          </div>

          <div className="mx-auto max-w-3xl">
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-black/35">
              {formatSection(concept.section)}
            </div>

            <h1 className="text-5xl font-semibold tracking-[-0.05em] md:text-6xl">{concept.title}</h1>

            <p className="mt-5 text-xl leading-8 text-black/50">{concept.theory.introduction}</p>

            <div className="my-12 h-px bg-black/10" />

            <article data-learning-article="true" className="space-y-14">
              {concept.theory.sections.map((section) => (
                <section key={section.id}>
                  <h2 className="mb-6 text-3xl font-semibold tracking-tight">{section.title}</h2>
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

              {concept.examples.length > 0 && <Examples examples={concept.examples} />}
              {concept.key_ideas.length > 0 && <KeyIdeas ideas={concept.key_ideas} />}
              {concept.misconceptions.length > 0 && <Misconceptions misconceptions={concept.misconceptions} />}
            </article>

            <div className="mt-14 flex items-center gap-3">
              {nextConceptId ? (
                <button
                  onClick={continueToNext}
                  className="flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <Link
                  to={`/topics/${concept.topic}`}
                  className="flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
                >
                  Back to roadmap <ArrowRight size={16} />
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

function ContentBlock({ element }: { element: ContentElement }) {
  if (element.type === 'paragraph') {
    return (
      <p
        data-content-id={element.id}
        className="text-lg leading-9 text-black/65 selection:bg-black selection:text-white"
      >
        {element.text}
      </p>
    )
  }

  return (
    <div
      data-content-id={element.id}
      className="rounded-2xl border border-black/10 bg-[#f7f7f5] p-5 text-sm text-black/60"
    >
      {element.text ?? JSON.stringify(element)}
    </div>
  )
}

function Examples({ examples }: { examples: { id: string; question: string; solution: string }[] }) {
  return (
    <section>
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">Try thinking about it</h2>
      <div className="space-y-5">
        {examples.map((example, index) => (
          <details key={example.id} className="group rounded-3xl border border-black/10 bg-[#f7f7f5]">
            <summary className="cursor-pointer list-none p-6">
              <div className="flex gap-4">
                <span className="text-sm font-semibold text-black/30">{String(index + 1).padStart(2, '0')}</span>
                <p className="font-medium leading-7">{example.question}</p>
              </div>
            </summary>
            <div className="border-t border-black/10 px-6 py-5 text-black/55">{example.solution}</div>
          </details>
        ))}
      </div>
    </section>
  )
}

function KeyIdeas({ ideas }: { ideas: string[] }) {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3"><Lightbulb size={21} /><h2 className="text-3xl font-semibold tracking-tight">Key ideas</h2></div>
      <div className="grid gap-3">
        {ideas.map((idea) => <div key={idea} className="rounded-2xl bg-[#f7f7f5] px-5 py-4 text-black/60">{idea}</div>)}
      </div>
    </section>
  )
}

function Misconceptions({ misconceptions }: { misconceptions: string[] }) {
  return (
    <section>
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">Watch out for these ideas</h2>
      <div className="space-y-3">
        {misconceptions.map((item) => <div key={item} className="rounded-2xl border border-black/10 px-5 py-4 text-black/55">{item}</div>)}
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
    setMessages((current) => [...current, { role: 'user', text: message }])
    setInput('')

    try {
      const result = await askAI({
        conceptId: concept.id,
        contentId: selectedContentId,
        mode: 'normal',
        message,
        history,
      })
      setMessages((current) => [...current, { role: 'model', text: result.answer }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI tutor failed to respond')
    } finally {
      setSending(false)
    }
  }

  const quickActions = [
    ['Explain this simpler', 'Explain the current concept in simpler words.'],
    ['Give me an example', 'Give me a clear example of the current concept.'],
    ['Why does this work?', 'Why does this work? Explain the reasoning.'],
  ]

  return (
    <aside className="sticky top-24 flex min-h-[calc(100vh-9rem)] max-h-[calc(100vh-6rem)] flex-col rounded-3xl border border-black/10 bg-[#111] text-white">
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black"><Bot size={20} /></div>
          <div>
            <p className="font-semibold">AI Tutor</p>
            <p className="text-xs text-white/40">Ask anything about {concept.title}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        {selectedText && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/35">
              Selected text
              <button onClick={onClearSelection} aria-label="Clear selected text"><X size={14} /></button>
            </div>
            <p className="text-sm leading-6 text-white/75">“{selectedText}”</p>
          </div>
        )}

        {messages.length === 0 && (
          <>
            <div className="flex gap-3">
              <Sparkles className="mt-1 shrink-0 text-white/40" size={17} />
              <p className="text-sm leading-6 text-white/60">Select text in the lesson and ask me about it, or type a question below.</p>
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
          <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'ml-6 rounded-2xl bg-white px-4 py-3 text-sm text-black' : 'mr-4 rounded-2xl bg-white/5 px-4 py-3 text-sm leading-6 text-white/75'}>
            {message.text}
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-sm text-white/40"><LoaderCircle size={15} className="animate-spin" /> Thinking...</div>
        )}

        {error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">{error}</p>}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') sendMessage() }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
            placeholder="Ask a doubt..."
            disabled={sending}
          />
          <button onClick={() => sendMessage()} disabled={sending || !input.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black disabled:opacity-30">
            <Send size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function formatSection(section: string) {
  return section.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}
