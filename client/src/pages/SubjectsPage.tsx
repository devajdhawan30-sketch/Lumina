import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const subjects = [
  ['Mathematics', 'Numbers, patterns, geometry and more.'],
  ['Physics', 'Understand how the physical world works.'],
  ['Chemistry', 'Explore matter, reactions and structure.'],
  ['History', 'Understand events, people and civilizations.'],
  ['Civics', 'Explore governments, rights and society.'],
  ['Geography', 'Understand places, people and our planet.'],
  ['Computer Science', 'Build intuition for computation and systems.'],
  ['Artificial Intelligence', 'Explore how machines learn and reason.'],
]

export default function SubjectsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] px-5 pb-20 pt-32 md:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">
          Explore
        </p>

        <h1 className="mt-4 max-w-3xl text-6xl font-semibold tracking-[-0.06em] md:text-8xl">
          What do you want to understand?
        </h1>

        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {subjects.map(([name, description], index) => (
            <Link
              key={name}
              to={name === 'Mathematics' ? '/tutor/angles' : '/learn'}
              className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <span className="text-sm text-black/30">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <ArrowUpRight
                  size={20}
                  className="text-black/25 transition group-hover:text-black"
                />
              </div>

              <div className="pb-8 pt-16">
                <h2 className="text-3xl font-semibold tracking-tight">
                  {name}
                </h2>

                <p className="mt-3 max-w-md leading-7 text-black/45">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}