export type DragState<T> = {
  draggedItem: T | null
  dropPreviewIndex: number | null
  dragOffset: { x: number; y: number }
}

export function createDragState<T>(): DragState<T> {
  return {
    draggedItem: null,
    dropPreviewIndex: null,
    dragOffset: { x: 0, y: 0 }
  }
}

export function handleDragStart<T>(e: DragEvent, item: T, dragState: DragState<T>): void {
  const element = e.currentTarget as HTMLElement
  if (!element) return

  const rect = element.getBoundingClientRect()
  dragState.dragOffset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }

  // 기본 드래그 모양 숨기기
  const ghost = element.cloneNode(true) as HTMLElement
  ghost.style.position = 'absolute'
  ghost.style.top = '-1000px'
  ghost.style.opacity = '0'
  document.body.appendChild(ghost)
  e.dataTransfer?.setDragImage(ghost, 0, 0)

  requestAnimationFrame(() => {
    document.body.removeChild(ghost)
  })

  dragState.draggedItem = item
}

export function handleDragEnd<T>(dragState: DragState<T>): void {
  dragState.draggedItem = null
  dragState.dropPreviewIndex = null
}

export function handleDrag(e: DragEvent): void {
  if (e.clientX === 0 && e.clientY === 0) return
}

export function handleDragOver<T>(
  e: DragEvent,
  index: number,
  reordering: boolean,
  dragState: DragState<T>,
  items: T[],
  getItemId: (item: T) => string | number
): void {
  if (!reordering) return

  e.preventDefault()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const midY = rect.top + rect.height / 2
  const newPreviewIndex = e.clientY < midY ? index : index + 1

  // 드래그하는 아이템의 원래 인덱스와 같거나, 바로 다음 인덱스라면 미리보기를 표시하지 않음
  if (dragState.draggedItem) {
    const currentIndex = items.findIndex(
      (item) => getItemId(item) === getItemId(dragState.draggedItem!)
    )
    if (newPreviewIndex === currentIndex || newPreviewIndex === currentIndex + 1) {
      dragState.dropPreviewIndex = null
      return
    }
  }

  dragState.dropPreviewIndex = newPreviewIndex
}

export function handleDragLeave<T>(
  e: DragEvent,
  dragState: DragState<T>,
  containerSelector: string
): void {
  const relatedTarget = e.relatedTarget as HTMLElement
  const listContainer = (e.currentTarget as HTMLElement).closest(containerSelector)
  if (!listContainer?.contains(relatedTarget)) {
    dragState.dropPreviewIndex = null
  }
}

export function handleDrop<T>(
  dragState: DragState<T>,
  items: T[],
  updateItems: (newItems: T[]) => void,
  getItemId: (item: T) => string | number
): void {
  if (!dragState.draggedItem || dragState.dropPreviewIndex === null) return

  const oldIndex = items.findIndex((item) => getItemId(item) === getItemId(dragState.draggedItem!))
  if (oldIndex === -1) return

  const newIndex =
    dragState.dropPreviewIndex > oldIndex
      ? dragState.dropPreviewIndex - 1
      : dragState.dropPreviewIndex

  const newItems = [...items]
  const [removed] = newItems.splice(oldIndex, 1)
  newItems.splice(newIndex, 0, removed)
  updateItems(newItems)

  dragState.draggedItem = null
  dragState.dropPreviewIndex = null
}
