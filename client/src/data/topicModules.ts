export type TopicModule = {
  id: string
  title: string
  description: string
  conceptIds: string[]
}

export const trigonometryModules: TopicModule[] = [
  {
    id: 'introduction-to-trigonometry',
    title: 'Introduction to Trigonometry',
    description: 'Build the geometric language of angles, rotation, radians, circles, and right triangles.',
    conceptIds: [
      'angles',
      'angle-measurement',
      'degrees-and-radians',
      'angles-on-a-circle',
      'clock-and-rotation',
      'right-triangles',
      'similar-triangles',
      'bridge-to-trig-ratios',
    ],
  },
  {
    id: 'trigonometric-ratios',
    title: 'Trigonometric Ratios & Functions',
    description: 'Move from triangle ratios to sine, cosine, tangent, and their function-based viewpoint.',
    conceptIds: [
      'trigonometric-ratios',
      'reciprocal-trigonometric-ratios',
      'trigonometric-ratios-any-angle',
      'exact-trigonometric-values',
      'tangent-function',
      'sine-function',
      'cosine-function',
      'trigonometric-functions',
      'reciprocal-trigonometric-functions',
    ],
  },
  {
    id: 'trigonometric-equations',
    title: 'Trigonometric Equations',
    description: 'Learn the toolkit for solving, checking, and describing trigonometric equations.',
    conceptIds: [
      'trig-equations-01',
      'trig-equations-02',
      'trig-equations-03',
      'trig-equations-04',
      'trig-equations-05',
      'trig-equations-06',
      'trig-equations-07',
      'trig-equations-08',
      'trig-equations-09',
      'trig-equations-10',
      'trig-equations-11',
    ],
  },
]
