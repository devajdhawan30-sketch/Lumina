import { ArrowLeft, ArrowRight, BookOpen, Map } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import RoadmapPage from './RoadmapPage'
import { trigonometryModules } from '../data/topicModules'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, motionEase, prefersReducedMotion } from '../animations/gsap'

export default function TrigonometryLandingPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const page = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from('.motion-module-card', {
      autoAlpha: 0,
      y: 28,
      duration: 0.64,
      ease: motionEase,
      stagger: 0.09,
      delay: 0.34,
    })
  }, { scope: page })

  if (topicId !== 'trigonometry') {
    return <RoadmapPage />
  }

  return (
    <main ref={page} data-page-entrance className="page min-h-screen px-5 pb-24 pt-28 md:px-10">
      <div className="mx-auto max-w-6xl">

        <Link
          to="/subjects/mathematics"
          className="btn-ghost inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft size={16} />
          Mathematics
        </Link>

        <header className="mt-12 max-w-4xl">
          <p data-motion="eyebrow" className="eyebrow flex items-center gap-2">
            <Map size={14} />
            Learning path
          </p>
           <br />
          <h1 data-motion="title" className="hero-title mt-4 mb-8 max-w-4xl leading-[0.98]">
            Trigonometry
          </h1>
           <br />
          <p data-motion="description" className="lede max-w-3xl">
            Three connected modules take you from the geometry of angles to
            trigonometric functions, equations, and real-world applications.
          </p>
        </header>

        <div data-motion="cta" className="card card-editorial mt-12 md:mt-14">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="eyebrow">
                Before you begin
              </p>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Curious about where these ideas are used? Explore the interactive
                applications first.
              </p>
            </div>

            <Link
              to="/explore/applications/trigonometry"
              className="btn btn-accent shrink-0 px-5 py-3 text-sm"
            >
              Explore applications
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <section data-motion="content" className="mt-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="eyebrow">
                Study
              </p>

              <h2 className="section-title mt-3">
                Three modules. One story.
              </h2>
            </div>

            <span className="count-pill count-pill-ink">
              {trigonometryModules.length} modules
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {trigonometryModules.map((module, index) => (
              <Link
                key={module.id}
                to={`/topics/trigonometry/module/${module.id}`}
                className="motion-module-card card card-hover group p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-faint">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <ArrowRight
                    size={18}
                    className="text-faint transition group-hover:translate-x-1 group-hover:text-ink"
                  />
                </div>

                <div className="mt-14">
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {module.title}
                  </h3>

                  <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
                    {module.description}
                  </p>

                  <div className="mt-7 flex items-center gap-2 text-xs font-semibold text-faint">
                    <BookOpen size={14} />
                    {module.conceptIds.length} topics
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
