import { ArrowUpRight, Map } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { revealOnScroll } from '../animations/scrollAnimations'

const subjects = [
  ['Mathematics', 'Numbers, patterns, geometry and more.', 'mathematics'],
  ['Physics', 'Understand how the physical world works.', 'physics'],
  ['Chemistry', 'Explore matter, reactions and structure.', 'chemistry'],
  ['History', 'Understand events, people and civilizations.', 'history'],
  ['Civics', 'Explore governments, rights and society.', 'civics'],
  ['Geography', 'Understand places, people and our planet.', 'geography'],
  ['Computer Science', 'Build intuition for computation and systems.', 'computer-science'],
  ['Artificial Intelligence', 'Explore how machines learn and reason.', 'artificial-intelligence'],
]

export default function SubjectsPage() {
  const page = useRef<HTMLElement>(null)
  useGSAP(() => {
    revealOnScroll(Array.from(page.current?.querySelectorAll('[data-subject-card]') ?? []), 0.08)
  }, { scope: page })

  return (
    <main ref={page} data-page-entrance className="page subjects-discovery px-5 pb-20 pt-32 md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="subjects-discovery-header">
          <div>
            <p data-motion="eyebrow" className="eyebrow">Explore</p>
            <h1 data-motion="title" className="hero-title mt-4 max-w-4xl">What are you curious about?</h1>
          </div>
        </header>
        <section data-motion="content" className="subjects-discovery-grid" aria-label="Subjects">
          {subjects.map(([name, description, id], index) => (
            <article key={id} data-subject-card className={`subject-discovery-card card card-hover group ${index === 0 ? 'subject-discovery-card-featured' : ''}`}>
              <div className="subject-discovery-topline"><span>{String(index + 1).padStart(2, '0')}</span><ArrowUpRight size={20} className="subject-discovery-arrow" /></div>
              <Link to={`/subjects/${id}`} className="subject-discovery-link"><h2>{name}</h2><p>{description}</p></Link>
              <Link to={`/roadmap/subject/${id}`} className="btn btn-secondary subject-roadmap-link"><Map size={15} /> View complete roadmap</Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
