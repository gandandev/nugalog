import { writable } from 'svelte/store'

export interface StudentData {
  name: string
  logs: Log[]
}

export interface Log {
  date: Date
  content: string
}

const storedData = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('data') || '[]') : []

export const data = writable<StudentData[]>(storedData.map((d: any) => ({
  ...d,
  logs: d.logs.map((l: any) => ({
    ...l,
    date: new Date(l.date)
  }))
})))

data.subscribe((value) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('data', JSON.stringify(value))
  }
})
