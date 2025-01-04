import type { Log } from '$lib/stores'

export type DragState = {
  draggedLog: Log | null
  dropPreviewIndex: number | null
  dragOffset: { x: number; y: number }
}

export function createDragState(): DragState {
  return {
    draggedLog: null,
    dropPreviewIndex: null,
    dragOffset: { x: 0, y: 0 }
  }
}

export function handleDragStart(e: DragEvent, log: Log, dragState: DragState): void {
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

  dragState.draggedLog = log
}

export function handleDragEnd(dragState: DragState): void {
  dragState.draggedLog = null
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
  const listContainer = (e.currentTarget as HTMLElement).closest('div[role="list"]')
  if (!listContainer?.contains(relatedTarget)) {
    dragState.dropPreviewIndex = null
  }
}

export function handleDrop(
  dragState: DragState,
  logs: Log[],
  updateLogs: (newLogs: Log[]) => void
): void {
  if (!dragState.draggedLog || dragState.dropPreviewIndex === null) return

  const oldIndex = logs.findIndex((l) => l === dragState.draggedLog)
  if (oldIndex === -1) return

  const newIndex =
    dragState.dropPreviewIndex > oldIndex
      ? dragState.dropPreviewIndex - 1
      : dragState.dropPreviewIndex

  const newLogs = [...logs]
  const [removed] = newLogs.splice(oldIndex, 1)
  newLogs.splice(newIndex, 0, removed)
  updateLogs(newLogs)

  dragState.draggedLog = null
  dragState.dropPreviewIndex = null
} 