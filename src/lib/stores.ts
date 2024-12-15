import { writable } from 'svelte/store'

export interface StudentData {
  name: string
  logs: Log[]
}

export interface Log {
  date: Date
  content: string
}

export const dataLoaded = writable(false)
export const data = writable<StudentData[]>([])

if (typeof localStorage !== 'undefined') {
  const storedData = JSON.parse(localStorage.getItem('data') || '[]')
  const parsedData = storedData.map((student: StudentData) => ({
    ...student,
    logs: student.logs.map((log: Log) => ({
      ...log,
      date: new Date(log.date) // 문자열 (2024-01-01T00:00:00.000Z)로 저장된 날짜를 Date 객체로 변환
    }))
  }))
  data.set(parsedData)
  dataLoaded.set(true)
}

data.subscribe((value) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('data', JSON.stringify(value))
  }
})
