<script lang="ts">
  import { goto } from '$app/navigation'
  import { focusOnElement } from '$lib/utils/focus'
  import { data, type Student } from '$lib/stores'
  import { tooltip } from '$lib/utils/tooltip'

  import OptionMenu from './OptionMenu.svelte'

  import MoreHoriz from '~icons/material-symbols/more-horiz'
  import Delete from '~icons/material-symbols/delete-rounded'
  import Edit from '~icons/material-symbols/edit-rounded'
  import Keep from '~icons/material-symbols/keep-rounded'

  const {
    student,
    isActive,
    confirmdelete,
    ondragstart,
    ondragend,
    dragged,
    onclick
  }: {
    student: Student
    isActive: boolean
    confirmdelete: () => void
    ondragstart: (e: DragEvent) => void
    ondragend: () => void
    dragged: boolean
    onclick: () => void
  } = $props()

  let showOptions = $state(false)
  let optionsButton: HTMLButtonElement | null = $state(null)
  let optionsMenu: HTMLDivElement | null = $state(null)

  let newName: string | null = $state(null)
  const duplicateStudentName = $derived(
    $data.some((s) => s !== student && s.name === newName?.trim())
  )
  function saveName() {
    if (duplicateStudentName) return
    if (newName && newName.trim()) {
      if (isActive) {
        goto(`/app/student/${encodeURIComponent(newName!.trim())}`)
      }
      $data = $data.map((s) => (s === student ? { ...s, name: newName!.trim() } : s))
    }
    newName = null
  }

  function togglePin() {
    $data = $data.map((s) => (s === student ? { ...s, pinned: !s.pinned } : s))
    showOptions = false
  }
</script>

<li
  class="group/item relative flex w-full items-center rounded-lg duration-150 hover:bg-stone-200 has-[a:active]:bg-stone-300 dark:hover:bg-stone-800 dark:has-[a:active]:bg-stone-700"
  class:bg-stone-200={isActive || showOptions}
  class:dark:bg-stone-800={isActive || showOptions}
  class:opacity-50={dragged}
  draggable="true"
  {ondragstart}
  {ondragend}
>
  {#if newName !== null}
    <input
      type="text"
      bind:value={newName}
      class="w-full grow rounded-lg py-1 pl-3 outline-none ring-2 duration-150 placeholder:text-stone-400 dark:bg-stone-800"
      class:ring-blue-500={!duplicateStudentName}
      class:ring-red-500={duplicateStudentName || !newName?.trim()}
      placeholder="변경할 이름"
      onblur={() => {
        if (duplicateStudentName || !newName?.trim()) newName = null
        saveName()
      }}
      onkeydown={(e) => {
        if (e.key === 'Enter') saveName()
        if (e.key === 'Escape') newName = null
      }}
      use:focusOnElement
    />
  {:else}
    <a
      href="/app/student/{encodeURIComponent(student.name)}"
      class="flex min-w-0 grow items-center rounded-l-lg pl-3"
      class:rounded-r-lg={true}
      {onclick}
    >
      {#if student.pinned}
        <Keep class="mr-1.5 h-4 w-4 shrink-0 text-stone-400 dark:text-stone-600" />
      {/if}
      <span class="truncate py-1">
        {student.name}
      </span>
    </a>
  {/if}
  {#if newName === null}
    <button
      bind:this={optionsButton}
      class="group/options options-button rounded-r-lg py-1 pr-2 text-stone-500 opacity-0 outline-none duration-150 group-hover/item:opacity-100"
      class:opacity-100={showOptions}
      class:touch:hidden={!isActive}
      class:touch:opacity-100={isActive}
      onclick={(e) => {
        e.stopPropagation()
        showOptions = !showOptions
      }}
      use:tooltip={{ text: '더보기', position: 'right' }}
    >
      <div
        class="flex h-6 w-6 items-center justify-center rounded duration-150 group-hover/options:bg-stone-300 dark:group-hover/options:bg-stone-700"
        class:bg-stone-300={showOptions}
        class:dark:bg-stone-700={showOptions}
      >
        <MoreHoriz class="h-5 w-5" />
      </div>
    </button>
  {/if}

  <OptionMenu
    show={showOptions}
    class="right-0 top-full mt-1 origin-top-right"
    options={[
      {
        Icon: Edit,
        label: '이름 변경',
        onclick: () => (newName = student.name),
        closeMenuOnClick: true
      },
      { Icon: Keep, label: '상단 고정', onclick: togglePin, closeMenuOnClick: true },
      { Icon: Delete, label: '학생 삭제', onclick: confirmdelete, closeMenuOnClick: true }
    ]}
    button={optionsButton}
    closeMenu={() => (showOptions = false)}
  />
</li>

{#if duplicateStudentName}
  <p class="pl-1 pt-1 text-xs text-stone-500 duration-150">학생 이름이 중복되었습니다.</p>
{/if}
