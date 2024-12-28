import { writable } from 'svelte/store'
import { z } from 'zod'

export const LogSchema = z.object({
  date: z.coerce.date(),
  content: z.string().min(1).trim()
})

export const StudentSchema = z.object({
  name: z.string().min(1).trim(),
  logs: z.array(LogSchema)
})

export const StudentArraySchema = z.array(StudentSchema)

export type Log = z.infer<typeof LogSchema>
export type Student = z.infer<typeof StudentSchema>

export const dataLoaded = writable(false)
export const data = writable<Student[]>([])

export function parseData<T>(schema: z.ZodSchema<T>, data: unknown): z.SafeParseReturnType<unknown, T> {
  return schema.safeParse(data)
}

// 편의를 위한 타입별 파서 함수들
export const parseLog = (data: unknown) => parseData(LogSchema, data)
export const parseStudent = (data: unknown) => parseData(StudentSchema, data)
export const parseStudentArray = (data: unknown) => parseData(StudentArraySchema, data)
