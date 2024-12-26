import type { SupabaseClient } from '@supabase/supabase-js'
import type { StudentData, Log } from '$lib/stores'

// DB에서 데이터 가져오기
export async function loadDataFromDb(supabase: SupabaseClient): Promise<StudentData[] | null> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return null

  const { data: dbResult, error } = await supabase
    .from('classes')
    .select('id, created_at, students, user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error

  if (dbResult?.students) {
    return dbResult.students.map((student: StudentData) => ({
      ...student,
      logs: student.logs.map((log: Log) => ({
        ...log,
        date: new Date(log.date)
      }))
    }))
  }
  return null // 데이터 없음
}

// DB에 데이터 저장하기
export async function saveDataToDb(supabase: SupabaseClient, dataToSave: StudentData[]) {
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const { error } = await supabase.from('classes').upsert(
      {
        students: dataToSave,
        user_id: userData.user.id
      },
      { onConflict: 'user_id' }
    )
    if (error) {
      console.error('Error while saving data to DB:', error)
    }
  } catch (error) {
    console.error('Auth check failed:', error)
  }
}

// localStorage에서 데이터 불러오기
export function loadDataFromLocalStorage(): StudentData[] {
  if (typeof localStorage === 'undefined') throw new Error('localStorage is not available')

  const storedData = JSON.parse(localStorage.getItem('data') || '[]') as StudentData[]
  return storedData.map((student) => ({
    ...student,
    logs: student.logs.map((log) => ({ ...log, date: new Date(log.date) }))
  }))
}

export async function handleInitialDataConflict(
  supabase: SupabaseClient,
  dbData: StudentData[],
  localData: StudentData[]
): Promise<StudentData[]> {
  return new Promise((resolve) => {
    // Create a custom event to handle the user's choice
    const handler = (e: CustomEvent<string>) => {
      window.removeEventListener('initialDataConflict' as any, handler)

      switch (e.detail) {
        case 'useLocal':
          saveDataToDb(supabase, localData)
          resolve(localData)
          break
        case 'useDB':
          localStorage.setItem('data', JSON.stringify(dbData))
          resolve(dbData)
          break
        case 'merge':
          const mergedData = mergeData(dbData, localData)
          saveDataToDb(supabase, mergedData)
          localStorage.setItem('data', JSON.stringify(mergedData))
          resolve(mergedData)
          break
      }
    }

    window.addEventListener('initialDataConflict' as any, handler)

    // Dispatch event to show dialog
    window.dispatchEvent(
      new CustomEvent('showInitialDataConflict', {
        detail: { dbData, localData }
      })
    )
  })
}

function mergeData(dbData: StudentData[], localData: StudentData[]): StudentData[] {
  const mergedMap = new Map<string, StudentData>()

  // Add DB data first
  dbData.forEach((student) => {
    mergedMap.set(student.name, { ...student })
  })

  // Merge local data
  localData.forEach((localStudent) => {
    if (mergedMap.has(localStudent.name)) {
      const dbStudent = mergedMap.get(localStudent.name)!
      const mergedLogs = [...dbStudent.logs]

      // Add new logs from local that don't exist in DB
      localStudent.logs.forEach((localLog) => {
        const exists = dbStudent.logs.some(
          (dbLog) =>
            dbLog.date.getTime() === localLog.date.getTime() &&
            dbLog.content === localLog.content
        )
        if (!exists) mergedLogs.push(localLog)
      })

      mergedMap.set(localStudent.name, {
        ...localStudent,
        logs: mergedLogs.sort((a, b) => a.date.getTime() - b.date.getTime())
      })
    } else {
      mergedMap.set(localStudent.name, localStudent)
    }
  })

  return Array.from(mergedMap.values())
}
