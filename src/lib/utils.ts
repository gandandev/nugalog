import dedent from 'dedent'

export function focusOnElement(node: HTMLElement) {
  node.focus()
}

type OnClickOutsideOptions = {
  callback: () => void
  exclude?: (HTMLElement | null)[]
}

export function onClickOutside(node: HTMLElement, options: OnClickOutsideOptions) {
  const { callback, exclude = [] } = options
  let isClickInside = false

  const onmousedown = (e: MouseEvent) => {
    const target = e.target
    if (!target || !(target instanceof Node)) return

    isClickInside = node.contains(target) || exclude.some((el) => el && el.contains(target))
  }

  const onclick = (e: MouseEvent) => {
    const target = e.target
    if (!target || !(target instanceof Node)) return

    const isClickOutside =
      !node.contains(target) && !exclude.some((el) => el && el.contains(target))
    if (isClickOutside && !isClickInside) {
      callback()
    }
    isClickInside = false
  }

  document.addEventListener('mousedown', onmousedown, true)
  document.addEventListener('click', onclick, true)

  return {
    destroy() {
      document.removeEventListener('mousedown', onmousedown, true)
      document.removeEventListener('click', onclick, true)
    }
  }
}

type TooltipOptions = {
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function tooltip(node: HTMLElement, options: TooltipOptions | null) {
  // 터치 기기에서 툴팁 비활성화
  if ('ontouchstart' in window) return { destroy() { } }

  if (!options) return { destroy() { } }

  let tooltipElement: HTMLDivElement | null = null
  let showTimeout: NodeJS.Timeout | null = null
  let hideTimeout: NodeJS.Timeout | null = null
  const { text, position = 'top', delay = 500 } = options

  function createTooltip() {
    if (showTimeout) clearTimeout(showTimeout)
    if (hideTimeout) clearTimeout(hideTimeout)

    showTimeout = setTimeout(() => {
      // 툴팁 생성
      tooltipElement = document.createElement('div')
      tooltipElement.textContent = text
      tooltipElement.className =
        'fixed z-50 px-2 py-1 text-sm text-white bg-stone-800 rounded-lg pointer-events-none dark:bg-stone-700 opacity-0 scale-90 duration-150'

      // 방향에 맞춰 기준점 설정
      const origins = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left'
      }
      tooltipElement.style.transformOrigin = origins[position] ?? 'bottom'

      document.body.appendChild(tooltipElement)
      tooltipElement.getBoundingClientRect()
      tooltipElement.style.opacity = '1'
      tooltipElement.style.transform = 'scale(1)'

      positionTooltip()
    }, delay)
  }

  function positionTooltip() {
    if (!tooltipElement) return
    const rect = node.getBoundingClientRect()
    const tooltipRect = tooltipElement.getBoundingClientRect()

    const positions = {
      top: {
        x: rect.left + (rect.width - tooltipRect.width) / 2,
        y: rect.top - tooltipRect.height - 4
      },
      bottom: {
        x: rect.left + (rect.width - tooltipRect.width) / 2,
        y: rect.bottom + 4
      },
      left: {
        x: rect.left - tooltipRect.width - 4,
        y: rect.top + (rect.height - tooltipRect.height) / 2
      },
      right: {
        x: rect.right + 4,
        y: rect.top + (rect.height - tooltipRect.height) / 2
      }
    }

    const pos = positions[position]
    tooltipElement.style.left = pos.x + 'px'
    tooltipElement.style.top = pos.y + 'px'
  }

  function removeTooltip() {
    if (showTimeout) clearTimeout(showTimeout)
    if (hideTimeout) clearTimeout(hideTimeout)

    if (tooltipElement) {
      tooltipElement.style.opacity = '0'
      tooltipElement.style.transform = 'scale(0.9)'
      hideTimeout = setTimeout(() => {
        if (tooltipElement) {
          document.body.removeChild(tooltipElement)
          tooltipElement = null
        }
      }, 150)
    }
  }

  function onMouseEnter() {
    createTooltip()
    positionTooltip()
  }

  node.addEventListener('mouseenter', onMouseEnter)
  node.addEventListener('mouseleave', removeTooltip)

  return {
    update(newOptions: TooltipOptions | null) {
      if (!newOptions) {
        removeTooltip()
        return
      }
      Object.assign(options, newOptions)
      if (tooltipElement) {
        tooltipElement.textContent = newOptions.text
        positionTooltip()
      }
    },
    destroy() {
      if (showTimeout) clearTimeout(showTimeout)
      if (hideTimeout) clearTimeout(hideTimeout)
      removeTooltip()
      node.removeEventListener('mouseenter', onMouseEnter)
      node.removeEventListener('mouseleave', removeTooltip)
    }
  }
}

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
) => students
  .filter((student) => student.logs.length > 0)
  .map((student) => formatStudentLogs(student.name, student.logs))
  .join('\n\n---\n\n')

export function useCopyFeedback(callback: (copied: boolean) => void) {
  let lastCopied = 0

  return () => {
    const now = new Date().getTime()
    lastCopied = now
    callback(true)
    setTimeout(() => {
      // lastCopied가 바뀌지 않았다면 그 사이 복사된 것이 아니므로 초기화
      if (lastCopied === now) {
        callback(false)
      }
    }, 1000)
  }
}
