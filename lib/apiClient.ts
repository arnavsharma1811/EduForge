
import { supabase } from './supabase'

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  console.log("🔐 Session in apiClient:", session)

  if (!session) {
    throw new Error("No active session")
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch((err) => {
      console.error("API parse error:", err.message || err)
      return {}
    })
    throw new Error(errorData.detail || `Request failed: ${response.status}`)
  }

  return response.json()
}

export const apiClient = {
  async uploadPDF(file: File, type: string = 'course') {
    const formData = new FormData()
    formData.append('file', file)
    return fetchWithAuth(`/upload/?type=${encodeURIComponent(type)}`, {
      method: 'POST',
      body: formData,
    })
  },

  async analyzePYQ(courseId: string) {
    return fetchWithAuth(`/pyq/${courseId}/analyze`, {
      method: 'POST',
    })
  },

  async getPYQ(courseId: string) {
    return fetchWithAuth(`/pyq/${courseId}`)
  },

  async generateCourse(courseId: string) {
    return fetchWithAuth(`/course/${courseId}/generate`, {
      method: 'POST',
    })
  },

  async getCourse(courseId: string) {
    return fetchWithAuth(`/course/${courseId}`)
  },

  async sendChatMessage(courseId: string, message: string) {
    return fetchWithAuth(`/chat/${courseId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
  },

  async generateQuiz(courseId: string, chapterIndex: number) {
    return fetchWithAuth(`/quiz/generate/${courseId}/${chapterIndex}`, {
      method: 'POST',
    })
  },

  async markLessonComplete(courseId: string, lessonId: string) {
    return fetchWithAuth(`/progress/${courseId}/${lessonId}`, {
      method: 'PUT',
    })
  },

  async getProgress(courseId: string) {
    return fetchWithAuth(`/progress/${courseId}`)
  },

  async searchCourses(query: string = '') {
    const encodedQuery = encodeURIComponent(query)
    return fetchWithAuth(`/search/?q=${encodedQuery}`)
  }
}