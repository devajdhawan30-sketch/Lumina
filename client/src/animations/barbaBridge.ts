/**
 * Barba's router owns and replaces page containers, which is incompatible with
 * React Router's mounted route tree. Keep this boundary explicit: the package
 * is available for future non-routing transition helpers, but it is never
 * initialized against React-owned DOM.
 */
export const barbaTransitionStrategy = 'react-router-overlay' as const

// Deliberately do not call barba.init(): that would take over links and replace
// React Router's mounted containers. Referencing the package here keeps the
// compatibility decision localized and makes that boundary explicit.
export const isBarbaAvailable = () => Boolean(barba.hooks)
import barba from '@barba/core'
