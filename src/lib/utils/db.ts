import type { SupabaseClient } from '@supabase/supabase-js'
import type { StudentData, Log } from '$lib/stores'

// DB에서 데이터 가져오기
export async function loadDataFromDb(supabase: SupabaseClient): Promise<StudentData[] | null> {
  // 로그인 여부 확인
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) throw new Error('Not logged in')

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
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return

  const { error } = await supabase.from('classes').upsert(
    {
      students: dataToSave,
      user_id: user.id
    },
    { onConflict: 'user_id' }
  )
  if (error) {
    console.error('저장 중 오류:', error)
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
