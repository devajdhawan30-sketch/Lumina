import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()

  const links = [
    { label: 'Explore', path: '/subjects' },
    
    { label: 'AI Tutor', path: '/tutor/angles' },
  ]

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-5 py-5 md:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-black/10 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-xl">
        <Link to="/" className="text-xl font-black tracking-[-0.05em]">
          INFINIX<span className="text-black/30">∞</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const active = location.pathname.startsWith(link.path)

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm transition ${
                  active
                    ? 'font-semibold text-black'
                    : 'text-black/50 hover:text-black'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <Link
          to="/subjects"
          className="flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]"
        >
          Get Started
          <ArrowUpRight size={15} />
        </Link>
      </nav>
    </header>
  )
}