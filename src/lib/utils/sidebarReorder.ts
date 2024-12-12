import type { StudentData } from '$lib/stores'

export type DragState = {
  draggedStudent: StudentData | null
  dropPreviewIndex: number | null
  dragOffset: { x: number; y: number }
}

export function createDragState(): DragState {
  return {
    draggedStudent: null,
    dropPreviewIndex: null,
    dragOffset: { x: 0, y: 0 }
  }
}

export function handleDragStart(
  e: DragEvent,
  student: StudentData,
  dragState: DragState
): void {
  const element = e.currentTarget as HTMLElement
  if (!element) return

  const rect = element.getBoundingClientRect()
  dragState.dragOffset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }

  // Create an invisible drag image to hide the default one
  const ghost = element.cloneNode(true) as HTMLElement
  ghost.style.position = 'absolute'
  ghost.style.top = '-1000px'
  ghost.style.opacity = '0'
  document.body.appendChild(ghost)
  e.dataTransfer?.setDragImage(ghost, 0, 0)

  requestAnimationFrame(() => {
    document.body.removeChild(ghost)
  })

  dragState.draggedStudent = student
}

export function handleDragEnd(dragState: DragState): void {
  dragState.draggedStudent = null
  dragState.dropPreviewIndex = null
}

export function handleDrag(e: DragEvent, dragState: DragState): void {
  if (e.clientX === 0 && e.clientY === 0) return
}

export function handleDragOver(
  e: DragEvent,
  index: number,
  reordering: boolean,
  dragState: DragState
): void {
  if (!reordering) return

  e.preventDefault()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const midY = rect.top + rect.height / 2
  dragState.dropPreviewIndex = e.clientY < midY ? index : index + 1
}

export function handleDragLeave(e: DragEvent, dragState: DragState): void {
  const relatedTarget = e.relatedTarget as HTMLElement
  const listContainer = (e.currentTarget as HTMLElement).closest('ul')
  if (!listContainer?.contains(relatedTarget)) {
    dragState.dropPreviewIndex = null
  }
}

export function handleDrop(
  dragState: DragState,
  data: StudentData[],
  updateData: (newData: StudentData[]) => void
): void {
  if (!dragState.draggedStudent || dragState.dropPreviewIndex === null) return

  const oldIndex = data.findIndex((s) => s.name === dragState.draggedStudent?.name)
  if (oldIndex === -1) return

  const newIndex =
    dragState.dropPreviewIndex > oldIndex
      ? dragState.dropPreviewIndex - 1
      : dragState.dropPreviewIndex

  const newData = [...data]
  const [removed] = newData.splice(oldIndex, 1)
  newData.splice(newIndex, 0, removed)
  updateData(newData)

  dragState.draggedStudent = null
  dragState.dropPreviewIndex = null
}
