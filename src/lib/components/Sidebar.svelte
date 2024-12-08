<script lang="ts">
  import { page } from '$app/stores'
  import GroupAdd from '~icons/mdi/group-add'
  import Add from '~icons/mdi/add'
  import Close from '~icons/mdi/close'
  import IconButton from './IconButton.svelte'
  import SidebarItem from './SidebarItem.svelte'
  import Dialog from './Dialog.svelte'
  import { josa } from 'es-hangul'
  import { data, type StudentData } from '$lib/stores'
  import { focusOnElement } from '$lib/utils'

  let newStudentName: string | null = $state(null)
  let duplicateStudentName = $derived(
    $data.some((student) => student.name === newStudentName?.trim())
  )
  let studentToDelete: StudentData | null = $state(null)
  let draggedStudent: StudentData | null = $state(null)
  let dropPreviewIndex: number | null = $state(null)
  let draggedElement: HTMLElement | null = $state(null)
  let dragOffset = $state({ x: 0, y: 0 })

  function addStudent() {
    if (!newStudentName || duplicateStudentName || !newStudentName.trim()) return
    $data = [...$data, { name: newStudentName.trim(), logs: [] }]
    newStudentName = ''
  }

  let reordering = $state(false)

  function reorder() {
    reordering = true
    newStudentName = null
  }

  function confirmDelete(student: StudentData) {
    studentToDelete = student
  }

  function handleCancel() {
    studentToDelete = null
  }

  function handleDelete() {
    $data = $data.filter((s) => s.name !== studentToDelete?.name)
    studentToDelete = null
  }

  function handleDragStart(e: DragEvent, student: StudentData) {
    const element = e.currentTarget as HTMLElement
    if (!element) return

    const rect = element.getBoundingClientRect()
    dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    draggedElement = element.cloneNode(true) as HTMLElement
    draggedElement.style.position = 'fixed'
    draggedElement.style.width = `${rect.width}px`
    draggedElement.style.pointerEvents = 'none'
    draggedElement.style.transform = 'rotate(2deg)'
    draggedElement.style.zIndex = '1000'
    draggedElement.style.opacity = '0.8'
    draggedElement.style.boxShadow =
      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
    document.body.appendChild(draggedElement)

    updateDraggedPosition(e)
    draggedStudent = student
  }

  function updateDraggedPosition(e: DragEvent) {
    if (!draggedElement) return
    draggedElement.style.left = `${e.clientX - dragOffset.x}px`
    draggedElement.style.top = `${e.clientY - dragOffset.y}px`
  }

  function handleDragEnd() {
    if (draggedElement) {
      document.body.removeChild(draggedElement)
      draggedElement = null
    }
    draggedStudent = null
    dropPreviewIndex = null
  }

  function handleDrag(e: DragEvent) {
    if (e.clientX === 0 && e.clientY === 0) return // Ignore invalid drag events
    updateDraggedPosition(e)
  }

  function handleDrop() {
    if (!draggedStudent || dropPreviewIndex === null) return

    const oldIndex = $data.findIndex((s) => s.name === draggedStudent?.name)
    if (oldIndex === -1) return

    const newIndex = dropPreviewIndex > oldIndex ? dropPreviewIndex - 1 : dropPreviewIndex

    const newData = [...$data]
    const [removed] = newData.splice(oldIndex, 1)
    newData.splice(newIndex, 0, removed)
    $data = newData

    draggedStudent = null
    dropPreviewIndex = null
  }

  function handleDragOver(e: DragEvent, index: number) {
    if (!reordering) return

    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    dropPreviewIndex = e.clientY < midY ? index : index + 1
  }

  function handleDragLeave(e: DragEvent) {
    const relatedTarget = e.relatedTarget as HTMLElement
    const listContainer = (e.currentTarget as HTMLElement).closest('ul')
    if (!listContainer?.contains(relatedTarget)) {
      dropPreviewIndex = null
    }
  }
</script>

<aside class="flex w-64 shrink-0 flex-col gap-2 border-r border-stone-200 bg-stone-100 p-1">
  <!-- 헤더 -->
  <div class="flex items-center justify-between pl-4 pr-2 pt-2">
    <h1 class="font-monasans text-2xl font-bold">nugalog</h1>
    {#if reordering}
      <button
        class="rounded-full bg-stone-200 px-3 py-1 text-sm text-stone-500 duration-150 hover:bg-stone-300"
        onclick={() => (reordering = false)}
      >
        완료
      </button>
    {:else}
      <IconButton Icon={GroupAdd} onclick={() => (newStudentName = '')} />
    {/if}
  </div>

  <!-- 이름 목록 -->
  <ul
    class="w-full flex-1 space-y-0.5 overflow-y-auto px-1"
    ondragleave={handleDragLeave}
    ondragover={(e) => e.preventDefault()}
  >
    <div></div>
    {#each $data as student, i (student.name)}
      <div
        class="relative"
        ondragover={(e) => handleDragOver(e, i)}
        ondrop={handleDrop}
        role="listitem"
      >
        <div
          class="absolute -top-0.5 left-0 right-0 z-50 h-0.5 rounded-full bg-blue-500 opacity-0"
          class:opacity-100={dropPreviewIndex === i}
          role="presentation"
        ></div>
        <SidebarItem
          {student}
          isActive={$page.url.pathname === `/student/${encodeURIComponent(student.name)}`}
          {reorder}
          {reordering}
          confirmdelete={() => confirmDelete(student)}
          ondragstart={(e) => handleDragStart(e, student)}
          ondragend={handleDragEnd}
          dragged={draggedStudent?.name === student.name}
        />
      </div>
    {/each}
    {#if newStudentName !== null}
      <li class="pt-1">
        <div class="flex w-full gap-1">
          <input
            type="text"
            bind:value={newStudentName}
            class="block grow rounded-lg bg-white px-3 py-1 duration-150"
            onkeydown={(e) => {
              if (e.key === 'Enter' && !e.isComposing) {
                addStudent()
              }
            }}
            onblur={() => {
              if (!newStudentName?.trim()) {
                newStudentName = null
              }
            }}
            use:focusOnElement
          />
          {#if newStudentName.trim()}
            <IconButton
              Icon={Add}
              onclick={addStudent}
              disabled={duplicateStudentName || !newStudentName.trim()}
            />
          {:else}
            <IconButton Icon={Close} onclick={() => (newStudentName = null)} />
          {/if}
        </div>
        {#if duplicateStudentName}
          <p class="pl-1 pt-1 text-xs text-stone-500 duration-150">학생 이름이 중복되었습니다.</p>
        {/if}
      </li>
    {/if}
    <div
      class="min-h-[50px] flex-1"
      ondragover={(e) => handleDragOver(e, $data.length)}
      ondrop={handleDrop}
      role="presentation"
    >
      {#if dropPreviewIndex === $data.length}
        <div class="relative -top-0.5 h-0.5 rounded-full bg-blue-500" role="presentation"></div>
      {/if}
    </div>
  </ul>
</aside>

<svelte:window ondrag={handleDrag} />

{#if studentToDelete}
  <Dialog
    title={`학생 "${studentToDelete.name}"${josa.pick(studentToDelete.name, '을/를')} 삭제할까요?`}
    description="삭제된 학생은 복구할 수 없습니다."
    actions={[
      { label: '취소', onclick: handleCancel, variant: 'secondary' },
      { label: '삭제', onclick: handleDelete, variant: 'danger' }
    ]}
    oncancel={handleCancel}
  />
{/if}
