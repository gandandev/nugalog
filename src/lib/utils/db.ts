import type { SupabaseClient } from '@supabase/supabase-js'
import { StudentArraySchema, type Student } from '$lib/stores'

// DB에서 데이터 가져오기
export async function loadDataFromDb(supabase: SupabaseClient): Promise<Student[] | null> {
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
    const parseResult = StudentArraySchema.safeParse(dbResult.students)
    if (!parseResult.success) {
      console.error('Invalid data format in DB:', parseResult.error)
      return null
    }
    return parseResult.data
  }
  return null // 데이터 없음
}

// DB에 데이터 저장하기
export async function saveDataToDb(
  supabase: SupabaseClient,
  dataToSave: Student[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError) return { success: false, error: 'Authentication failed: ' + authError.message }
    if (!userData?.user) return { success: false, error: 'User not authenticated' }

    // Validate data before saving
    const parseResult = StudentArraySchema.safeParse(dataToSave)
    if (!parseResult.success) {
      return { success: false, error: 'Invalid data format: ' + parseResult.error.message }
    }

    const { error: saveError } = await supabase.from('classes').upsert(
      {
        students: parseResult.data,
        user_id: userData.user.id
      },
      { onConflict: 'user_id' }
    )

    if (saveError) {
      console.error('Error while saving data to DB:', saveError)
      return { success: false, error: 'Failed to save to database: ' + saveError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// localStorage에서 데이터 불러오기
export function loadDataFromLocalStorage(): { data: Student[] | null; error?: string } {
  if (typeof localStorage === 'undefined') {
    return { data: null, error: 'localStorage is not available' }
  }

  try {
    const rawData = localStorage.getItem('data')
    if (!rawData) return { data: [] }

    const parseResult = StudentArraySchema.safeParse(JSON.parse(rawData))
    if (!parseResult.success) {
      return {
        data: null,
        error: 'Invalid data format in localStorage: ' + parseResult.error.message
      }
    }

    return { data: parseResult.data }
  } catch (error) {
    console.error('Error loading data from localStorage:', error)
    return { data: null, error: 'Failed to load data from localStorage' }
  }
}

export async function handleInitialDataConflict(
  supabase: SupabaseClient,
  dbData: Student[],
  localData: Student[]
): Promise<Student[]> {
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

function mergeData(dbData: Student[], localData: Student[]): Student[] {
  const mergedMap = new Map<string, Student>()

  // DB 데이터를 먼저 추가
  dbData.forEach((student) => {
    mergedMap.set(student.name, { ...student })
  })

  // 로컬 데이터를 병합
  localData.forEach((localStudent) => {
    if (mergedMap.has(localStudent.name)) {
      const dbStudent = mergedMap.get(localStudent.name)!
      // 로그 병합 (중복 제거 및 날짜 순 정렬)
      const mergedLogs = [
        ...dbStudent.logs,
        ...localStudent.logs.filter(
          (log) =>
            !dbStudent.logs.some(
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

  return Array.from(mergedMap.values())
}
