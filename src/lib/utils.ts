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
