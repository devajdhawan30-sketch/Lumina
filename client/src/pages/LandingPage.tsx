import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { revealOnScroll } from '../animations/scrollAnimations'

export default function LandingPage() {
  const page = useRef<HTMLElement>(null)

  useGSAP(() => {
    const sections = Array.from(page.current?.querySelectorAll('[data-scroll-reveal]') ?? [])
    revealOnScroll(sections)
  }, { scope: page })

  return (
    <main ref={page} data-page-entrance className="page landing-discovery overflow-hidden">
      <section className="landing-discovery-hero">
        <div className="landing-discovery-content">
          <div data-motion="eyebrow" className="landing-discovery-kicker"><Sparkles size={15} /> Learning without limits</div>
          <h1 data-motion="title" className="hero-title landing-discovery-title">LEARN <span>INFINITE.</span><br />THINK SMARTER.</h1>
          <p data-motion="description" className="lede landing-discovery-lede">A learning space that recognizes your pace, turns confusion into clarity, and helps you explore beyond what a textbook can show you.</p>
          <div data-motion="cta" className="landing-discovery-actions">
            <Link to="/subjects" className="btn btn-primary px-7 py-4">Start Learning <ArrowRight size={18} /></Link>
            <Link to="/subjects" className="btn btn-secondary px-7 py-4">Explore Subjects</Link>
          </div>
        </div>
      </section>
      <section data-scroll-reveal className="landing-discovery-idea">
        <div><p className="eyebrow">The idea</p><h2 className="section-title mt-5">Don't just learn the answer.<br /><span>Explore why it works.</span></h2></div>
        <p className="lede max-w-xl self-end">PATHVERSE turns learning into an interactive journey. Study a concept, ask why, visualize an idea, go deeper, and follow the connections to what comes next.</p>
      </section>
    </main>
  )
}
