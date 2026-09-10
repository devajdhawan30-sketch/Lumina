export type ExplorationId =
  | 'visualize-angle-rotation'
  | 'visualize-unit-circle'
  | 'visualize-sine-wave'
  | 'visualize-similar-triangles'
  | 'visualize-tower-height'
  | 'visualize-one-radian'
  | 'visualize-clock-rotation'
  | 'visualize-tangent-ratio'
  | 'visualize-equation-intersections'
  | 'visualize-triangulation'
  | 'visualize-navigation-vector'
  | 'visualize-wave-motion'
  | 'visualize-shadow-measurement'

type Trigger = {
  conceptId: string
  contentId: string
  highlightId: string
}

export type ExplorationDefinition = {
  id: ExplorationId
  type: 'visualization'
  title: string
  eyebrow: string
  purpose: string
  trigger: Trigger
  visualization: {
    component: ExplorationId
    interactive: boolean
  }
}

export const explorations: ExplorationDefinition[] = [
  {
    id: 'visualize-angle-rotation',
    type: 'visualization',
    title: 'See an angle as rotation',
    eyebrow: 'Rotation lab',
    purpose: 'Show that an angle measures how far the terminal ray rotates from the initial ray.',
    trigger: {
      conceptId: 'angles',
      contentId: 'dynamic-angle',
      highlightId: 'angle-as-rotation',
    },
    visualization: { component: 'visualize-angle-rotation', interactive: true },
  },
  {
    id: 'visualize-unit-circle',
    type: 'visualization',
    title: 'Read coordinates from a circle',
    eyebrow: 'Unit circle',
    purpose: 'Connect a rotating angle to its live coordinates and the signs of sine and cosine.',
    trigger: {
      conceptId: 'angles',
      contentId: 'terminal-side-determines-position',
      highlightId: 'unit-circle-coordinate',
    },
    visualization: { component: 'visualize-unit-circle', interactive: true },
  },
  {
    id: 'visualize-sine-wave',
    type: 'visualization',
    title: 'Unroll the circle into a wave',
    eyebrow: 'Periodic motion',
    purpose: 'Show how the y-coordinate of a point moving around the unit circle becomes the sine graph.',
    trigger: {
      conceptId: 'sine-function',
      contentId: 'sine-as-y-coordinate',
      highlightId: 'sine-circle-to-wave',
    },
    visualization: { component: 'visualize-sine-wave', interactive: true },
  },
  {
    id: 'visualize-similar-triangles',
    type: 'visualization',
    title: 'Scale a triangle, keep the ratio',
    eyebrow: 'Similarity lab',
    purpose: 'Demonstrate that changing the size of a right triangle does not change the trigonometric ratio for a fixed angle.',
    trigger: {
      conceptId: 'similar-triangles',
      contentId: 'ratio-invariance',
      highlightId: 'constant-ratio',
    },
    visualization: { component: 'visualize-similar-triangles', interactive: true },
  },
  {
    id: 'visualize-tower-height',
    type: 'visualization',
    title: 'Measure a tower without climbing',
    eyebrow: 'Indirect measurement',
    purpose: 'Show how a ground distance and an angle of elevation reveal an inaccessible height.',
    trigger: {
      conceptId: 'applications-of-trigonometry',
      contentId: 'trigonometry-as-a-tool-paragraph-1',
      highlightId: 'tower-height-indirect',
    },
    visualization: { component: 'visualize-tower-height', interactive: true },
  },
  {
    id: 'visualize-one-radian',
    type: 'visualization',
    title: 'Build one radian',
    eyebrow: 'Radian lab',
    purpose: 'Show one radian as the central angle whose arc length equals the circle radius.',
    trigger: { conceptId: 'degrees-and-radians', contentId: 'one-radian-definition', highlightId: 'one-radian-arc' },
    visualization: { component: 'visualize-one-radian', interactive: true },
  },
  {
    id: 'visualize-clock-rotation',
    type: 'visualization',
    title: 'Watch a clock measure rotation',
    eyebrow: 'Clock motion',
    purpose: 'Connect elapsed time to the continuously changing angle of a rotating clock hand.',
    trigger: { conceptId: 'clock-and-rotation', contentId: 'rotation-over-time', highlightId: 'continuous-rotation' },
    visualization: { component: 'visualize-clock-rotation', interactive: true },
  },
  {
    id: 'visualize-tangent-ratio',
    type: 'visualization',
    title: 'See tangent as a ratio',
    eyebrow: 'Tangent lab',
    purpose: 'Make tangent visible by changing the angle while tracking opposite divided by adjacent.',
    trigger: { conceptId: 'trigonometric-ratios', contentId: 'tangent-paragraph-2', highlightId: 'tangent-opposite-adjacent' },
    visualization: { component: 'visualize-tangent-ratio', interactive: true },
  },
  {
    id: 'visualize-equation-intersections',
    type: 'visualization',
    title: 'Find solutions where graphs meet',
    eyebrow: 'Equation graph',
    purpose: 'Show that every intersection of y = sin(x) and a horizontal target line is a solution.',
    trigger: { conceptId: 'trig-equations-01', contentId: 'graphical-meaning-solution', highlightId: 'graph-intersection-solution' },
    visualization: { component: 'visualize-equation-intersections', interactive: true },
  },
  {
    id: 'visualize-triangulation',
    type: 'visualization',
    title: 'Locate a point by triangulation',
    eyebrow: 'Surveying lab',
    purpose: 'Show how two measured sightlines create a triangle that locates an otherwise unreachable point.',
    trigger: { conceptId: 'applications-of-trigonometry', contentId: 'surveying-paragraph-2', highlightId: 'surveying-triangulation' },
    visualization: { component: 'visualize-triangulation', interactive: true },
  },
  {
    id: 'visualize-navigation-vector',
    type: 'visualization',
    title: 'Decompose a navigation vector',
    eyebrow: 'Navigation lab',
    purpose: 'Show how a direction and distance split into horizontal and vertical movement to locate an endpoint.',
    trigger: { conceptId: 'applications-of-trigonometry', contentId: 'navigation-paragraph-2', highlightId: 'navigation-components' },
    visualization: { component: 'visualize-navigation-vector', interactive: true },
  },
  {
    id: 'visualize-wave-motion',
    type: 'visualization',
    title: 'See a repeating signal',
    eyebrow: 'Wave motion',
    purpose: 'Show how a repeating quantity rises and falls through time as a sine-like wave.',
    trigger: { conceptId: 'applications-of-trigonometry', contentId: 'waves-paragraph-1', highlightId: 'repeating-wave-pattern' },
    visualization: { component: 'visualize-wave-motion', interactive: true },
  },
  {
  id: 'visualize-shadow-measurement',
  type: 'visualization',
  title: 'Measure a tree using its shadow',
  eyebrow: 'REAL-WORLD GEOMETRY',
  purpose:
    'Change the height of a tree and the Sun angle to discover how an inaccessible measurement can be connected to an angle.',
  trigger: {
    conceptId: 'right-triangles',
    contentId: 'height-measurement',
    highlightId: 'shadow-measurement',
  },
  visualization: {
    component: 'visualize-shadow-measurement',
    interactive: true,
  },
},
]

export function getExploration(id: ExplorationId) {
  return explorations.find((exploration) => exploration.id === id)
}