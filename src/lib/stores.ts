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

export function parseLog(data: unknown): z.SafeParseReturnType<unknown, Log> {
  return LogSchema.safeParse(data)
}

export function parseStudent(data: unknown): z.SafeParseReturnType<unknown, Student> {
  return StudentSchema.safeParse(data)
}

export function parseStudentArray(
  data: unknown
): z.SafeParseReturnType<unknown, Student[]> {
  return StudentArraySchema.safeParse(data)
}
