export type RoadmapNode = {
  id: string
  title: string
  subtitle: string
  description: string
  kind: 'foundational' | 'core' | 'application' | 'advanced'
  topicId?: string
  lessons?: string[]
  position: { x: number; y: number }
}

export type RoadmapEdge = { from: string; to: string }

export type SubjectRoadmap = {
  subjectId: string
  title: string
  subtitle: string
  nodes: RoadmapNode[]
  edges: RoadmapEdge[]
}

const mathematics: SubjectRoadmap = {
  subjectId: 'mathematics',
  title: 'Mathematics',
  subtitle: 'From foundational ideas to the power of calculus.',
  nodes: [
    { id:'number-sense', title:'Number Sense & Basic Arithmetic', subtitle:'The language of numbers', description:'The foundation for manipulating quantities, patterns, and operations.', kind:'foundational', lessons:['Numbers and place value','Arithmetic operations','Fractions, decimals and percentages'], position:{x:50,y:7} },
    { id:'algebra-1', title:'Algebra 1', subtitle:'Expressions & Equations', description:'Work with unknowns and learn the language of algebra.', kind:'core', lessons:['Variables','Simplifying expressions','Linear equations','Inequalities','Word problems','Introduction to factorization'], position:{x:25,y:27} },
    { id:'geometry-1', title:'Geometry 1', subtitle:'Shapes & Space', description:'Understand the world in 2D and 3D.', kind:'core', lessons:['Points, lines and angles','Triangles and quadrilaterals','Area and volume','Transformations'], position:{x:75,y:27} },
    { id:'algebra-2', title:'Algebra 2', subtitle:'Functions & Polynomials', description:'Patterns, functions, and generalization.', kind:'core', lessons:['Functions','Polynomials','Quadratics','Sequences and patterns'], position:{x:18,y:49} },
    { id:'coordinate-geometry', title:'Coordinate Geometry', subtitle:'Bridging algebra and geometry', description:'Use coordinates and equations to reason about geometric objects.', kind:'core', lessons:['Coordinate plane','Distance and midpoint','Lines and slopes','Circles in coordinates'], position:{x:50,y:49} },
    { id:'geometry-2', title:'Geometry 2', subtitle:'Proofs & Advanced Concepts', description:'Reasoning, proof, and deeper geometric structure.', kind:'application', lessons:['Congruence and similarity','Proof strategies','Circles','Advanced constructions'], position:{x:82,y:49} },
    { id:'trigonometry', title:'Trigonometry', subtitle:'Periodic phenomena', description:'Angles, triangles, ratios, functions, equations, and applications.', kind:'application', topicId:'trigonometry', position:{x:18,y:71} },
    { id:'sequences-series', title:'Sequences, Series & Induction', subtitle:'Patterns over infinity', description:'Understand recursive patterns, summation, and induction.', kind:'application', lessons:['Sequences','Series','Arithmetic and geometric sums','Mathematical induction'], position:{x:50,y:71} },
    { id:'vectors-matrices', title:'Vectors & Matrices', subtitle:'Tools for higher mathematics', description:'Represent directions, transformations, and systems compactly.', kind:'application', lessons:['Vectors','Dot products','Matrices','Systems of equations'], position:{x:82,y:71} },
    { id:'functions-graphs', title:'Functions & Graphs', subtitle:'Understanding change', description:'Build the language used to describe relationships and change.', kind:'core', lessons:['Function notation','Graph transformations','Inverse functions','Composite functions'], position:{x:34,y:76} },
    { id:'limits-continuity', title:'Limits & Continuity', subtitle:'The foundation of calculus', description:'Understand approaching values and continuous behavior.', kind:'core', lessons:['Limits','One-sided limits','Continuity','Limit laws'], position:{x:66,y:76} },
    { id:'calculus', title:'Calculus', subtitle:'Differentiation & Integration', description:'Change, accumulation, and beyond.', kind:'advanced', lessons:['Derivatives','Applications of derivatives','Integrals','Applications of integrals'], position:{x:50,y:91} },
  ],
  edges: [
    {from:'number-sense',to:'algebra-1'},{from:'number-sense',to:'geometry-1'},
    {from:'algebra-1',to:'algebra-2'},{from:'algebra-1',to:'coordinate-geometry'},
    {from:'geometry-1',to:'coordinate-geometry'},{from:'geometry-1',to:'geometry-2'},
    {from:'coordinate-geometry',to:'trigonometry'},{from:'coordinate-geometry',to:'sequences-series'},{from:'coordinate-geometry',to:'vectors-matrices'},
    {from:'algebra-2',to:'functions-graphs'},{from:'sequences-series',to:'functions-graphs'},{from:'vectors-matrices',to:'functions-graphs'},
    {from:'functions-graphs',to:'limits-continuity'},{from:'limits-continuity',to:'calculus'}
  ]
}

const generic = (subjectId: string, title: string, descriptions: string[]): SubjectRoadmap => {
  const titles = ['Foundations','Core Concepts','Methods & Models','Applications','Advanced Ideas','Projects & Practice']
  const kinds: RoadmapNode['kind'][] = ['foundational','core','core','application','advanced','advanced']
  return {
    subjectId,title,subtitle:`A guided path through ${title.toLowerCase()}, from first principles to applications.`,
    nodes: titles.map((nodeTitle,i)=>({
      id:`${subjectId}-${i+1}`, title:nodeTitle, subtitle: descriptions[i] ?? 'Build the next layer of understanding',
      description:`Explore ${descriptions[i]?.toLowerCase() ?? 'the key ideas'} in ${title}.`,
      kind:kinds[i], lessons:[`Key ideas in ${descriptions[i] ?? nodeTitle}`, 'Worked examples', 'Practice and applications'],
      position:{x:[50,25,75,35,65,50][i],y:[10,30,30,53,53,78][i]}
    })),
    edges:[{from:`${subjectId}-1`,to:`${subjectId}-2`},{from:`${subjectId}-1`,to:`${subjectId}-3`},{from:`${subjectId}-2`,to:`${subjectId}-4`},{from:`${subjectId}-3`,to:`${subjectId}-4`},{from:`${subjectId}-3`,to:`${subjectId}-5`},{from:`${subjectId}-4`,to:`${subjectId}-6`},{from:`${subjectId}-5`,to:`${subjectId}-6`}]
  }
}

export const subjectRoadmaps: Record<string, SubjectRoadmap> = {
  mathematics,
  physics: generic('physics','Physics',['Motion & Forces','Energy & Momentum','Waves & Fields','Real-world systems','Modern physics']),
  chemistry: generic('chemistry','Chemistry',['Matter & Atomic Structure','Bonding & Reactions','Quantitative Chemistry','Organic Chemistry','Applications']),
  history: generic('history','History',['Historical Thinking','Ancient Civilizations','Medieval Worlds','Modern History','Contemporary World']),
  civics: generic('civics','Civics',['Government & Institutions','Rights & Duties','Democracy','Public Policy','Society & Citizenship']),
  geography: generic('geography','Geography',['Maps & Earth','Physical Geography','Human Geography','Environment','Geospatial Applications']),
  'computer-science': generic('computer-science','Computer Science',['Computational Thinking','Programming','Data Structures','Algorithms & Systems','Projects']),
  'artificial-intelligence': generic('artificial-intelligence','Artificial Intelligence',['Math & Foundations','Machine Learning','Deep Learning','Generative AI','AI Systems & Projects']),
}
