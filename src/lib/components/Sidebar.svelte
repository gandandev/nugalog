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
  import {
    type DragState,
    createDragState,
    handleDragStart as _handleDragStart,
    handleDragEnd as _handleDragEnd,
    handleDrag as _handleDrag,
    handleDragOver as _handleDragOver,
    handleDragLeave as _handleDragLeave,
    handleDrop as _handleDrop
  } from '$lib/utils/sidebarReorder'

  let newStudentName: string | null = $state(null)
  let duplicateStudentName = $derived(
    $data.some((student) => student.name === newStudentName?.trim())
  )
  let studentToDelete: StudentData | null = $state(null)
  let dragState: DragState = $state(createDragState())
  let reordering = $state(false)

  function addStudent() {
    if (!newStudentName || duplicateStudentName || !newStudentName.trim()) return
    $data = [...$data, { name: newStudentName.trim(), logs: [] }]
    newStudentName = ''
  }

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
    _handleDragStart(e, student, dragState)
  }

  function handleDragEnd() {
    _handleDragEnd(dragState)
  }

  function handleDrag(e: DragEvent) {
    _handleDrag(e, dragState)
  }

  function handleDragOver(e: DragEvent, index: number) {
    _handleDragOver(e, index, reordering, dragState)
  }

  function handleDragLeave(e: DragEvent) {
    _handleDragLeave(e, dragState)
  }

  function handleDrop() {
    _handleDrop(dragState, $data, (newData) => ($data = newData))
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
          class:opacity-100={dragState.dropPreviewIndex === i}
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
          dragged={dragState.draggedStudent?.name === student.name}
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
      {#if dragState.dropPreviewIndex === $data.length}
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
