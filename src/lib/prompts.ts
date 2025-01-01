import { formatStudentLogs } from './utils'
import dedent from 'dedent'
import type { Student } from './stores'

export const getHangbalPrompt = (student: Student, outputExample?: string) => dedent`
  행발을 작성하세요.

  # 기록
  
  ${formatStudentLogs(student.name, student.logs, {
  markdown: true,
  includeName: true
})}

  # 예시

  ${outputExample ? `## 사용자 입력 예시:\n\n${outputExample}` : ''}
`

