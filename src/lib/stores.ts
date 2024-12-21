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
