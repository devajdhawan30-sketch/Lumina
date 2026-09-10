import { useGSAP } from '@gsap/react'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { gsap, motionEase, prefersReducedMotion } from '../animations/gsap'

function isInternalNavigation(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  if (anchor.target || anchor.hasAttribute('download')) return false
  const destination = new URL(anchor.href, window.location.href)
  return destination.origin === window.location.origin && destination.pathname + destination.search !== window.location.pathname + window.location.search
}

export default function PageTransition() {
  const overlay = useRef<HTMLDivElement>(null)
  const navigating = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()

  useGSAP(() => {
    gsap.set(overlay.current, { xPercent: 100 })
  }, { scope: overlay })

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest<HTMLAnchorElement>('a[href]')
      if (!anchor || !isInternalNavigation(anchor, event) || prefersReducedMotion()) return

      event.preventDefault()
      if (navigating.current) return
      navigating.current = true
      const destination = new URL(anchor.href, window.location.href)

      gsap.to(overlay.current, {
        xPercent: 0,
        duration: 0.28,
        ease: motionEase,
        onComplete: () => navigate(`${destination.pathname}${destination.search}${destination.hash}`),
      })
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [navigate])

  useEffect(() => {
    if (!navigating.current || prefersReducedMotion()) return
    gsap.to(overlay.current, {
      xPercent: -100,
      duration: 0.3,
      ease: motionEase,
      onComplete: () => {
        gsap.set(overlay.current, { xPercent: 100 })
        navigating.current = false
      },
    })
  }, [location.key])

  return <div ref={overlay} className="page-transition-overlay" aria-hidden="true" />
}
