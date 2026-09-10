const API_BASE_URL = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = `API request failed: ${response.status}`
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }

  return response.json()
}

export function getConcept(conceptId: string) {
  return request<Concept>(`/concepts/${conceptId}`)
}

export function getSubjects() {
  return request<{ subjects: Subject[] }>('/subjects')
}

export function getSubject(subjectId: string) {
  return request<SubjectDetail>(`/subjects/${subjectId}`)
}

export function getTopics() {
  return request<{ topics: Topic[] }>('/topics')
}

export function getTopic(topicId: string) {
  return request<TopicDetail>(`/topics/${topicId}`)
}

export function getRoadmap(topicId: string) {
  return request<Roadmap>(`/roadmap/${topicId}`)
}

export function askAI(payload: AIRequest) {
  return request<{ answer: string }>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface Subject {
  id: string
  title: string
  conceptCount: number
}

export interface SubjectDetail extends Subject {
  topics: {
    id: string
    title: string
    conceptCount: number
  }[]
}

export interface Topic {
  id: string
  title: string
  subject: string
  conceptCount: number
}

export interface TopicConcept {
  id: string
  title: string
  difficulty: number
}

export interface TopicDetail extends Topic {
  concepts: TopicConcept[]
}

export interface RoadmapNode {
  id: string
  title: string
  difficulty: number
}

export interface RoadmapEdge {
  from: string
  to: string
  type: 'prerequisite' | 'leads_to' | 'related'
}

export interface Roadmap {
  topic: {
    id: string
    title: string
  }
  nodes: RoadmapNode[]
  edges: RoadmapEdge[]
}

export interface AIMessage {
  role: 'user' | 'model'
  text: string
}

export interface AIRequest {
  conceptId: string
  contentId?: string
  mode?: string
  message: string
  history?: AIMessage[]
}

export interface Concept {
  id: string
  title: string
  subject: string
  topic: string
  section: string
  difficulty: number

  connections: {
    prerequisites: string[]
    leads_to: string[]
    related: string[]
  }

  theory: {
    introduction: string
    sections: TheorySection[]
  }

  formulas: unknown[]
  examples: Example[]
  key_ideas: string[]
  misconceptions: string[]
  explorations: unknown[]
  sources: unknown[]
}

export interface TheorySection {
  id: string
  title: string
  content: ContentElement[]
}

export interface ContentElement {
  type: string
  id?: string
  text?: string
  [key: string]: unknown
}

export interface Example {
  id: string
  question: string
  solution: string
}
