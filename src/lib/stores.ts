import { writable } from 'svelte/store'
import { z } from 'zod'

export const LogSchema = z.object({
  date: z.coerce.date(),
  content: z.string().min(1).trim()
})

export const StudentDataSchema = z.object({
  name: z.string().min(1).trim(),
  logs: z.array(LogSchema)
})

export const StudentDataArraySchema = z.array(StudentDataSchema)

export type Log = z.infer<typeof LogSchema>
export type StudentData = z.infer<typeof StudentDataSchema>

export const dataLoaded = writable(false)
export const data = writable<StudentData[]>([])

export function parseLog(data: unknown): z.SafeParseReturnType<unknown, Log> {
  return LogSchema.safeParse(data)
}

export function parseStudentData(data: unknown): z.SafeParseReturnType<unknown, StudentData> {
  return StudentDataSchema.safeParse(data)
}

export function parseStudentDataArray(
  data: unknown
): z.SafeParseReturnType<unknown, StudentData[]> {
  return StudentDataArraySchema.safeParse(data)
}
