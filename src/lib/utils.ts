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

    isClickInside = node.contains(target) || exclude.some(el => el && el.contains(target))
  }

  const onclick = (e: MouseEvent) => {
    const target = e.target
    if (!target || !(target instanceof Node)) return

    const isClickOutside = !node.contains(target) && !exclude.some(el => el && el.contains(target))
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
    },
  }
}

type TooltipOptions = {
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function tooltip(node: HTMLElement, options: TooltipOptions | null) {
  if (!options) return { destroy() { } }

  let tooltipElement: HTMLDivElement | null = null
  const { text, position = 'top' } = options

  function createTooltip() {
    tooltipElement = document.createElement('div')
    tooltipElement.textContent = text
    tooltipElement.className = 'fixed z-50 px-2 py-1 text-sm text-white bg-stone-800 rounded-lg pointer-events-none dark:bg-stone-700 opacity-0 scale-95 transition-all duration-150'

    // Set transform origin based on position
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
    if (tooltipElement) {
      tooltipElement.style.opacity = '0'
      tooltipElement.style.transform = 'scale(0.95)'
      setTimeout(() => {
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
      removeTooltip()
      node.removeEventListener('mouseenter', onMouseEnter)
      node.removeEventListener('mouseleave', removeTooltip)
    }
  }
}
