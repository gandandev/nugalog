import type { StudentData, Log } from '$lib/stores'
import type { SupabaseClient } from '@supabase/supabase-js'
import { saveDataToDb } from './db'

export type ConflictData = {
  previousLocal: StudentData[]
  database: StudentData[]
  newLocal: StudentData[]
}

function areLogsEqual(log1: Log, log2: Log): boolean {
  return log1.date.getTime() === log2.date.getTime() && log1.content === log2.content
}

function areStudentsEqual(student1: StudentData, student2: StudentData): boolean {
  if (student1.name !== student2.name || student1.logs.length !== student2.logs.length) {
    return false
  }

  return student1.logs.every((log1, index) => {
    const log2 = student2.logs[index]
    return areLogsEqual(log1, log2)
  })
}

function areStudentArraysEqual(arr1: StudentData[], arr2: StudentData[]): boolean {
  if (arr1.length !== arr2.length) return false

  return arr1.every((student1, index) => {
    const student2 = arr2[index]
    return areStudentsEqual(student1, student2)
  })
}

export function checkForConflicts(
  previous: StudentData[],
  database: StudentData[],
  current: StudentData[]
): boolean {
  // DB가 이전 로컬 상태와 다르고
  // 현재 데이터가 이전 데이터 및 DB와 모두 다르다면
  // 충돌이 발생한 것으로 간주
  return (
    !areStudentArraysEqual(database, previous) &&
    !areStudentArraysEqual(current, database) &&
    !areStudentArraysEqual(current, previous)
  )
}

export async function handleCancelChanges(
  conflictData: ConflictData,
  setData: (data: StudentData[]) => void
) {
  setData(conflictData.database)
}

export async function handleOverwrite(supabase: SupabaseClient, conflictData: ConflictData) {
  await saveDataToDb(supabase, conflictData.newLocal)
}

export async function handleMerge(
  conflictData: ConflictData,
  setData: (data: StudentData[]) => void
) {
  const { database, newLocal } = conflictData

  // 학생 이름을 기준으로 병합
  const mergedMap = new Map<string, StudentData>()

  // DB 데이터를 먼저 추가
  database.forEach((student) => {
    mergedMap.set(student.name, { ...student })
  })

  // 로컬 데이터를 병합
  newLocal.forEach((localStudent) => {
    if (mergedMap.has(localStudent.name)) {
      const dbStudent = mergedMap.get(localStudent.name)
      // 로그 병합 (중복 제거 및 날짜 순 정렬)
      const mergedLogs = [
        ...(dbStudent?.logs || []),
        ...localStudent.logs.filter(
          (log) =>
            !dbStudent?.logs.some(
              (dbLog) =>
                dbLog.date.getTime() === log.date.getTime() && dbLog.content === log.content
            )
        )
      ].sort((a, b) => a.date.getTime() - b.date.getTime())

      mergedMap.set(localStudent.name, { ...localStudent, logs: mergedLogs })
    } else {
      mergedMap.set(localStudent.name, { ...localStudent })
    }
  })

  const mergedData = Array.from(mergedMap.values())

  setData(mergedData)
}
