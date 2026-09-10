import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [menuOpen, setMenuOpen] = useState(false)
  const expanded = !isHome

  const links = [
    { label: 'Learn', path: '/learn' },
    { label: 'Subjects', path: '/subjects' },
    { label: 'Roadmap', path: '/roadmap' },
    { label: 'Explore', path: '/explore/applications/trigonometry' },
  ]

  return (
    <header className="absolute left-0 right-0 top-0 z-50 px-5 py-5 md:px-8">
      <nav aria-label="Primary navigation" className={`site-nav mx-auto flex max-w-7xl items-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-5 py-3 shadow-[var(--shadow-xs)] backdrop-blur-xl ${expanded ? 'site-nav-expanded' : ''}`}>
        <Link to="/" className="text-xl font-black tracking-[-0.05em] text-ink">
          PATHVERSE<span className="text-[var(--yellow)]">∞</span>
        </Link>

        <div className="site-nav-links hidden items-center gap-7 lg:gap-8 md:flex">
          {links.map((link) => {
            const active = location.pathname.startsWith(link.path)

            return (
              <Link
                key={link.path}
                to={link.path}
                data-nav-item
                className={`text-sm transition ${
                  active
                    ? 'font-semibold text-ink'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {!expanded ? (
          <Link to="/learn" className="btn btn-primary !min-h-0 px-5 py-2.5 text-sm">
            Get Started <ArrowUpRight size={15} />
          </Link>
        ) : <>
          <button type="button" className="site-nav-menu md:hidden" aria-label="Toggle navigation menu" aria-expanded={menuOpen} aria-controls="primary-navigation-items" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <div id="primary-navigation-items" className={`site-nav-mobile md:hidden ${menuOpen ? 'is-open' : ''}`}>
            {links.map((link) => <Link key={link.path} data-nav-item to={link.path} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}
          </div>
        </>}
      </nav>
    </header>
  )
}
