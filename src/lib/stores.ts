import { writable } from 'svelte/store'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

export const LogSchema = z.object({
  id: z
    .string()
    .min(1)
    .default(() => uuidv4()),
  date: z.coerce.date(),
  content: z.string().min(1).trim()
})

export const StudentSchema = z.object({
  name: z.string().min(1).trim(),
  logs: z.array(LogSchema),
  pinned: z.boolean().default(false).optional()
})

export const StudentArraySchema = z.array(StudentSchema)

export type Log = z.infer<typeof LogSchema>
export type Student = z.infer<typeof StudentSchema>

export const dataLoaded = writable(false)
export const data = writable<Student[]>([])

export function parseData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): z.SafeParseReturnType<unknown, T> {
  return schema.safeParse(data)
}

// 편의를 위한 타입별 파서 함수들
export const parseLog = (data: unknown) => parseData(LogSchema, data)
export const parseStudent = (data: unknown) => parseData(StudentSchema, data)
export const parseStudentArray = (data: unknown) => parseData(StudentArraySchema, data)

// 툴팁 표시 여부를 localStorage에서 불러오고 저장하기
const storedShowTooltip =
  typeof localStorage !== 'undefined' ? localStorage.getItem('showTooltip') : null
export const showTooltip = writable(
  storedShowTooltip === null ? true : storedShowTooltip === 'true'
)

showTooltip.subscribe((value) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('showTooltip', value.toString())
  }
})

// 행발 예시를 localStorage에서 불러오고 저장하기
const storedHangbalExample =
  typeof localStorage !== 'undefined' ? localStorage.getItem('hangbalExample') : null
export const hangbalOutputExample = writable(storedHangbalExample || '')

hangbalOutputExample.subscribe((value) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('hangbalExample', value)
  }
})
