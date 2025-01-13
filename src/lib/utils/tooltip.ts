type TooltipOptions = {
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function tooltip(node: HTMLElement, options: TooltipOptions | null) {
  // 터치 기기에서 툴팁 비활성화
  if ('ontouchstart' in window) return { destroy() {} }

  if (!options) return { destroy() {} }

  let tooltipElement: HTMLDivElement | null = null
  let showTimeout: NodeJS.Timeout | null = null
  let hideTimeout: NodeJS.Timeout | null = null
  const { text, position = 'top', delay = 250 } = options

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
