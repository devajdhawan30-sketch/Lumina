const API_BASE_URL = '/api'

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}

export function getConcept(conceptId: string) {
  return request<Concept>(`/concepts/${conceptId}`)
}

export function getSubjects() {
  return request<{
    subjects: Subject[]
  }>('/subjects')
}

export function getTopics() {
  return request<{
    topics: Topic[]
  }>('/topics')
}

export interface Subject {
  id: string
  title: string
  conceptCount: number
}

export interface Topic {
  id: string
  title: string
  subject: string
  conceptCount: number
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