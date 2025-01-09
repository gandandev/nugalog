import dedent from 'dedent'

export const formatStudentLogs = (
  name: string,
  logs: { date: Date; content: string }[],
  options: {
    markdown?: boolean
    includeName?: boolean
  } = {
    markdown: false,
    includeName: true
  }
) => dedent`
    ${options.includeName ? `${name} 학생` : ''}

    ${logs
      .map((log) => {
        const date = log.date
        return dedent`
          ${options.markdown ? '**' : ''}${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${['일', '월', '화', '수', '목', '금', '토'][date.getDay()]})${options.markdown ? '**' : ''}
          ${log.content}
        `
      })
      .join('\n\n')}
  `

export const formatAllStudentLogs = (
  students: { name: string; logs: { date: Date; content: string }[] }[]
) =>
  students
    .filter((student) => student.logs.length > 0)
    .map((student) => formatStudentLogs(student.name, student.logs))
    .join('\n\n---\n\n')
