import { useGSAP } from '@gsap/react'
import type { PropsWithChildren } from 'react'
import { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, motionEase, prefersReducedMotion } from '../animations/gsap'

export default function PageMotion({ children }: PropsWithChildren) {
  const container = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useGSAP(() => {
    const page = container.current?.querySelector<HTMLElement>('[data-page-entrance], main')
    if (!page || prefersReducedMotion()) return

    const sequence = [
      '[data-motion="eyebrow"]',
      '[data-motion="title"]',
      '[data-motion="description"]',
      '[data-motion="cta"]',
      '[data-motion="content"]',
    ]
    const timeline = gsap.timeline({ defaults: { ease: motionEase } })

    timeline.from(page, { autoAlpha: 0, duration: 0.18 })
    sequence.forEach((selector, index) => {
      const targets = page.querySelectorAll(selector)
      if (targets.length) {
        timeline.from(targets, {
          autoAlpha: 0,
          y: index === 4 ? 24 : 18,
          duration: index === 4 ? 0.58 : 0.52,
          stagger: 0.08,
        }, index === 0 ? '-=0.04' : '-=0.36')
      }
    })
  }, { scope: container, dependencies: [location.key] })

  return <div ref={container}>{children}</div>
}
