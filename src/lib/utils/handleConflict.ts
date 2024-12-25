import type { StudentData } from '$lib/stores'
import type { SupabaseClient } from '@supabase/supabase-js'
import { saveDataToDb } from './db'

export type ConflictData = {
  previousLocal: StudentData[]
  database: StudentData[]
  newLocal: StudentData[]
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
    JSON.stringify(database) !== JSON.stringify(previous) &&
    JSON.stringify(current) !== JSON.stringify(database) &&
    JSON.stringify(current) !== JSON.stringify(previous)
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
