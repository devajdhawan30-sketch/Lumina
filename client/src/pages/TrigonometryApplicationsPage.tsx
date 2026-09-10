import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Compass,
  Move3D,
  Navigation,
  Radar,
  Ruler,
  Sparkles,
  Waves,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Visualization } from '../components/ExplorationPopover'
import type { ExplorationId } from '../data/explorations'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { revealOnScroll } from '../animations/scrollAnimations'

const applicationLabs: {
  id: ExplorationId
  title: string
  eyebrow: string
  description: string
  question: string
  icon: typeof Ruler
}[] = [
  {
    id: 'visualize-tower-height',
    title: 'Measure a tower without climbing',
    eyebrow: 'INDIRECT MEASUREMENT',
    description:
      'Stand safely on the ground and use an angle of elevation to estimate the height of something you cannot physically reach.',
    question: 'How can an angle reveal a distance?',
    icon: Ruler,
  },
  {
    id: 'visualize-triangulation',
    title: 'Locate something you cannot reach',
    eyebrow: 'SURVEYING',
    description:
      'Two observation points and two angles can reveal the position of an inaccessible object.',
    question: 'Can two angles locate a hidden point?',
    icon: Radar,
  },
  {
    id: 'visualize-navigation-vector',
    title: 'Turn direction into movement',
    eyebrow: 'NAVIGATION',
    description:
      'A direction and distance can be separated into horizontal and vertical movement.',
    question: 'Where will the vehicle actually end up?',
    icon: Navigation,
  },
  {
    id: 'visualize-wave-motion',
    title: 'See a repeating signal',
    eyebrow: 'WAVES & SIGNALS',
    description:
      'Sound, vibrations and many other repeating phenomena can be represented using wave-like mathematical models.',
    question: 'Why does a wave keep repeating?',
    icon: Waves,
  },
  {
    id: 'visualize-unit-circle',
    title: 'Rotate around a circle',
    eyebrow: 'ROTATION',
    description:
      'Watch a point rotate continuously and see its position change with the angle.',
    question: 'Can rotation encode coordinates?',
    icon: Compass,
  },
  {
    id: 'visualize-sine-wave',
    title: 'Unroll a circle into a wave',
    eyebrow: 'PERIODIC MOTION',
    description:
      'Follow the vertical coordinate of a rotating point and watch it transform into a wave.',
    question: 'Where does the sine wave actually come from?',
    icon: Move3D,
  },
  {
    id: 'visualize-similar-triangles',
    title: 'Scale a structure without changing its shape',
    eyebrow: 'DESIGN & ENGINEERING',
    description:
      'See what happens when a triangular structure becomes larger while preserving its geometry.',
    question: 'What survives when a shape gets bigger?',
    icon: Building2,
  },
  {
    id: 'visualize-equation-intersections',
    title: 'Turn equations into pictures',
    eyebrow: 'MATHEMATICAL MODELING',
    description:
      'Instead of thinking of an equation only as symbols, see its solutions appear as intersections.',
    question: 'Can a graph solve an equation visually?',
    icon: Sparkles,
  },
]

export default function TrigonometryApplicationsPage() {
  const page = useRef<HTMLElement>(null)

  useGSAP(() => {
    const cards = Array.from(page.current?.querySelectorAll('[data-scroll-reveal]') ?? [])
    revealOnScroll(cards, 0.07)
  }, { scope: page })

  return (
    <main ref={page} data-page-entrance className="page min-h-screen px-5 pb-24 pt-28 md:px-10">
      <div className="mx-auto max-w-7xl">

        <Link
          to="/subjects"
          className="mb-10 inline-flex items-center gap-2 text-sm text-black/45 hover:text-black"
        >
          <ArrowLeft size={16} />
          Explore
        </Link>

        <header className="max-w-5xl">
          <p data-motion="eyebrow" className="eyebrow text-coral">
            Applications of Trigonometry
          </p>
           <br />
          <h1 data-motion="title" className="hero-title mt-5 max-w-5xl leading-[0.98]">
            What can an angle
            <br />
            actually do?
          </h1>
          <br />
          <p data-motion="description" className="lede mt-7 max-w-3xl md:text-xl">
            Before learning formulas, explore the problems that made trigonometry
            useful in the first place. Move the controls, watch the geometry change,
            and discover the hidden relationships yourself.
          </p>
        </header>

        <section data-motion="content" className="mt-16 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl bg-black p-6 text-white">
            <span className="text-4xl font-semibold">01</span>
            <p className="mt-8 text-sm leading-6 text-white/55">
              Measure things you cannot reach.
            </p>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6">
            <span className="text-4xl font-semibold">02</span>
            <p className="mt-8 text-sm leading-6 text-black/50">
              Understand movement, direction and rotation.
            </p>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6">
            <span className="text-4xl font-semibold">03</span>
            <p className="mt-8 text-sm leading-6 text-black/50">
              Model patterns that repeat in the real world.
            </p>
          </div>
        </section>

        <section className="mt-24">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/35">
              Interactive experiments
            </p>

            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Don't just read about it.
              <br />
              <span className="font-serif font-normal italic">
                Play with it.
              </span>
            </h2>
          </div>

          <div className="application-lab-grid">
            {applicationLabs.map((lab, index) => {
              const Icon = lab.icon

              return (
                <article
                  key={lab.id}
                  data-scroll-reveal
                  className={`application-lab-card ${
                    index < 2 ? 'application-lab-card-featured' : ''
                  }`}
                >
                  <div className="application-lab-copy">
                    <div className="flex items-center justify-between">
                      <span className="application-lab-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <Icon size={20} className="text-black/30" />
                    </div>

                    <p className="mt-8 text-[10px] font-bold tracking-[0.16em] text-[#ff695d]">
                      {lab.eyebrow}
                    </p>

                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                      {lab.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-black/50">
                      {lab.description}
                    </p>

                    <div className="mt-6 rounded-2xl bg-[#f7f7f5] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/30">
                        Think about this
                      </p>

                      <p className="mt-2 text-sm font-semibold">
                        {lab.question}
                      </p>
                    </div>
                  </div>

                  <div className="application-lab-visual">
                    <Visualization id={lab.id} />
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section data-scroll-reveal className="mt-24 overflow-hidden rounded-[32px] bg-black p-8 text-white md:p-12">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">
                Ready to understand the machinery?
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                Now learn the four modules behind these ideas.
              </h2>
            </div>

            <Link
              to="/topics/trigonometry"
              data-motion="cta"
              className="btn btn-secondary w-full shrink-0 px-5 py-3 text-sm sm:w-auto"
            >
              Study Trigonometry
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
