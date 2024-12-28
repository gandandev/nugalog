<script lang="ts">
  import { page } from '$app/stores'
  import { josa } from 'es-hangul'
  import { data } from '$lib/stores'
  import { focusOnElement } from '$lib/utils'
  import {
    type DragState,
    createDragState,
    handleDragStart,
    handleDragEnd,
    handleDrag,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } from '$lib/utils/sidebarReorder'
  import { fly, slide, fade } from 'svelte/transition'

  import Logo from './Logo.svelte'
  import IconButton from './IconButton.svelte'
  import SidebarItem from './SidebarItem.svelte'
  import Dialog from './Dialog.svelte'
  import Key from './Key.svelte'

  import GroupAdd from '~icons/mdi/group-add'

  // 학생 추가
  let newStudentName: string | null = $state(null)
  const duplicateStudentName = $derived(
    $data.some((student) => student.name === newStudentName?.trim())
  )
  function addStudent() {
    if (duplicateStudentName || !newStudentName?.trim()) return
    $data = [...$data, { name: newStudentName.trim(), logs: [] }]
    newStudentName = ''
  }

  // 순서 변경
  let reordering = $state(false)
  let dragState: DragState = $state(createDragState())
  function reorder() {
    reordering = true
    newStudentName = null
  }

  // 학생 삭제
  let studentToDeleteIndex: number | null = $state(null)
  function handleDelete() {
    $data = $data.filter((_, i) => i !== studentToDeleteIndex)
    studentToDeleteIndex = null
  }

  let newStudentNameInput: HTMLInputElement | null = $state(null)
</script>

<aside
  class="flex w-64 shrink-0 flex-col gap-2 border-r border-stone-200 bg-stone-100 p-1 dark:border-stone-800 dark:bg-stone-900"
>
  <!-- 헤더 -->
  <div class="flex items-center justify-between pl-4 pr-2 pt-2">
    <Logo />
    {#if reordering}
      <button
        class="rounded-full bg-stone-200 px-3 py-1 text-sm text-stone-500 duration-150 hover:bg-stone-300 active:scale-95 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 dark:active:scale-95"
        onclick={() => (reordering = false)}
      >
        완료
      </button>
    {:else}
      <IconButton
        Icon={GroupAdd}
        onclick={() => (newStudentName = '')}
        emphasized={!$data.length}
      />
    {/if}
  </div>

  <!-- 이름 목록 -->
  <ul
    class="w-full flex-1 space-y-0.5 overflow-y-auto px-1 pt-1"
    ondragleave={(e) => handleDragLeave(e, dragState)}
    ondragover={(e) => e.preventDefault()}
  >
    {#each $data as student, i (student.name)}
      <div
        class="relative"
        ondragover={(e) => handleDragOver(e, i, reordering, dragState)}
        ondrop={() => handleDrop(dragState, $data, (newData) => ($data = newData))}
        role="listitem"
        transition:slide={{ duration: 150 }}
      >
        <!-- 순서 변경 위치 미리보기 -->
        <div
          class="absolute -top-0.5 left-0 right-0 h-0.5 rounded-full bg-blue-500 opacity-0"
          class:opacity-100={dragState.dropPreviewIndex === i}
          role="presentation"
        ></div>

        <!-- 학생 목록 아이템 -->
        <SidebarItem
          {student}
          isActive={$page.url.pathname === `/app/student/${encodeURIComponent(student.name)}`}
          {reorder}
          {reordering}
          confirmdelete={() =>
            (studentToDeleteIndex = $data.findIndex((s) => s.name === student.name))}
          ondragstart={(e) => handleDragStart(e, student, dragState)}
          ondragend={() => handleDragEnd(dragState)}
          dragged={dragState.draggedStudent?.name === student.name}
        />
      </div>
    {/each}
    {#if newStudentName !== null}
      <li class="pt-1" transition:fly={{ duration: 150, y: -10 }}>
        <div class="flex w-full">
          <input
            bind:this={newStudentNameInput}
            type="text"
            bind:value={newStudentName}
            class="block w-full grow rounded-lg bg-white px-3 py-1 outline-none ring-2 duration-150 placeholder:text-stone-400 dark:bg-stone-800"
            class:ring-blue-500={!duplicateStudentName}
            class:ring-red-500={duplicateStudentName}
            placeholder="추가할 학생 이름"
            onkeydown={(e) => {
              if (e.key === 'Enter' && !e.isComposing) {
                addStudent()
              } else if (e.key === 'Escape') {
                newStudentName = null
              }
            }}
            onblur={() => {
              addStudent()
              newStudentName = null
            }}
            use:focusOnElement
          />
        </div>
        <div class="relative mx-1 mt-2 text-xs text-stone-500 duration-150">
          {#if duplicateStudentName}
            <span class="absolute left-0 top-0" transition:fly={{ y: '3', duration: 150 }}>
              학생 이름이 중복되었습니다.
            </span>
          {:else}
            <span class="absolute left-0 top-0" transition:fly={{ y: '3', duration: 150 }}>
              <Key>Enter</Key> 키로 추가
            </span>
          {/if}
        </div>
      </li>
    {/if}

    <!-- 맨 아래 드래그 공간 -->
    <div
      class="min-h-[50px] flex-1"
      ondragover={(e) => handleDragOver(e, $data.length, reordering, dragState)}
      ondrop={() => handleDrop(dragState, $data, (newData) => ($data = newData))}
      role="presentation"
    >
      {#if dragState.dropPreviewIndex === $data.length}
        <div class="relative -top-0.5 h-0.5 rounded-full bg-blue-500" role="presentation"></div>
      {/if}
    </div>
  </ul>
</aside>

<svelte:window ondrag={(e) => handleDrag(e, dragState)} />

{#if studentToDeleteIndex !== null}
  <!-- 학생 삭제 확인 -->
  {@const student = $data[studentToDeleteIndex]}
  <Dialog
    title={`학생 "${student.name}"${josa.pick(student.name, '을/를')} 삭제할까요?`}
    description="삭제된 학생은 복구할 수 없습니다."
    actions={[
      { label: '취소', variant: 'secondary', cancel: true },
      { label: '삭제', onclick: handleDelete, variant: 'danger', onenter: true }
    ]}
    cancel={() => (studentToDeleteIndex = null)}
  />
{/if}
