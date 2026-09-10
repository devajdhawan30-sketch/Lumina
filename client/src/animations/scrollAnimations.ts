import { gsap, motionEase, prefersReducedMotion } from './gsap'

const revealOptions = {
  autoAlpha: 0,
  y: 32,
  duration: 0.68,
  ease: motionEase,
}

export function revealOnScroll(elements: Element[], stagger = 0.08) {
  if (prefersReducedMotion() || elements.length === 0) return

  gsap.from(elements, {
    ...revealOptions,
    stagger,
    scrollTrigger: {
      trigger: elements[0],
      start: 'top 82%',
      once: true,
    },
  })
}

export function drawSvgLines(lines: SVGLineElement[]) {
  if (prefersReducedMotion() || lines.length === 0) return

  lines.forEach((line) => {
    const length = line.getTotalLength()
    gsap.set(line, { strokeDasharray: length, strokeDashoffset: length })
  })

  gsap.to(lines, {
    strokeDashoffset: 0,
    duration: 0.7,
    ease: motionEase,
    stagger: 0.05,
    scrollTrigger: {
      trigger: lines[0].ownerSVGElement ?? lines[0],
      start: 'top 78%',
      once: true,
    },
  })
}
