import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f5]">
      <section className="relative flex min-h-screen items-center justify-center px-6 pt-28">
        {/* Background decoration */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-black/60 shadow-sm">
            <Sparkles size={15} />
            Learning without limits
          </div>

          <h1 className="mx-auto max-w-5xl text-[clamp(3.5rem,9vw,8rem)] font-semibold leading-[0.88] tracking-[-0.07em]">
            LEARN
            <br />
            <span className="text-black/25">INFINITE.</span>
            <br />
            THINK SMARTER.
          </h1>

          <p className="mx-auto mt-9 max-w-2xl text-lg leading-8 text-black/55 md:text-xl">
            A learning space that recognizes your pace, turns confusion into
            clarity, and helps you explore beyond what a textbook can show you.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/learn"
              className="group flex items-center gap-3 rounded-full bg-black px-7 py-4 font-semibold text-white transition hover:scale-[1.02]"
            >
              Start Learning
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

            <Link
              to="/subjects"
              className="rounded-full border border-black/15 bg-white px-7 py-4 font-semibold transition hover:bg-black/5"
            >
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/40">
            The idea
          </p>

          <div className="mt-6 grid gap-12 md:grid-cols-2">
            <h2 className="text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">
              Don't just learn the answer.
              <br />
              <span className="text-black/30">Explore why it works.</span>
            </h2>

            <p className="max-w-xl self-end text-lg leading-8 text-black/55">
              INFINIX turns learning into an interactive journey. Study a
              concept, ask why, visualize an idea, go deeper, and follow the
              connections to what comes next.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}