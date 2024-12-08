<script lang="ts">
  import MoreHoriz from '~icons/mdi/more-horiz'
  import Delete from '~icons/mdi/delete'
  import Edit from '~icons/mdi/pencil'
  import SwapVert from '~icons/mdi/swap-vertical'
  import { type StudentData } from '$lib/stores'
  import { scale } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'

  const { student, isActive, reorder, reordering, confirmdelete, ondragstart, ondragend, dragged } =
    $props<{
      student: StudentData
      isActive: boolean
      reorder: () => void
      reordering: boolean
      confirmdelete: () => void
      ondragstart: (e: DragEvent) => void
      ondragend: () => void
      dragged: boolean
    }>()

  let showOptions = $state(false)
  let optionsMenu: HTMLDivElement | null = $state(null)
  let optionsButton: HTMLButtonElement | null = $state(null)

  $effect(() => {
    if (reordering) {
      showOptions = false
    }
  })

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!optionsMenu?.contains(target) && !optionsButton?.contains(target)) {
      showOptions = false
    }
  }

  function rename() {
    console.log('rename')
  }

  function handleDragStart(e: DragEvent) {
    if (!reordering) return

    const element = e.currentTarget as HTMLElement
    const ghost = element.cloneNode(true) as HTMLElement
    ghost.style.position = 'absolute'
    ghost.style.top = '-1000px'
    ghost.style.opacity = '0'
    document.body.appendChild(ghost)
    e.dataTransfer?.setDragImage(ghost, 0, 0)

    requestAnimationFrame(() => {
      document.body.removeChild(ghost)
    })

    ondragstart(e)
  }
</script>

<svelte:window onclick={handleClickOutside} />

<li
  class="group/item relative flex w-full rounded-lg hover:bg-stone-200"
  class:bg-stone-200={isActive || reordering}
  class:cursor-grab={reordering}
  class:opacity-50={dragged}
  draggable={reordering}
  ondragstart={handleDragStart}
  {ondragend}
>
  <a
    href="/student/{encodeURIComponent(student.name)}"
    class="peer block grow rounded-l-lg py-1 pl-3 duration-150 active:bg-stone-300"
    class:rounded-r-lg={reordering}
    onclick={(e) => reordering && e.preventDefault()}
  >
    {student.name}
  </a>
  {#if !reordering}
    <button
      bind:this={optionsButton}
      class="group/options options-button h-8 rounded-r-lg pr-2 text-stone-500 opacity-0 duration-150 group-hover/item:opacity-100 peer-active:bg-stone-300"
      onclick={() => (showOptions = !showOptions)}
    >
      <div
        class="flex h-6 w-6 items-center justify-center rounded duration-150 group-hover/options:bg-stone-300"
      >
        <MoreHoriz class="h-5 w-5" />
      </div>
    </button>
  {/if}

  {#if showOptions}
    <div
      bind:this={optionsMenu}
      class="absolute right-0 top-full z-10 mt-1 flex w-48 origin-top-right flex-col rounded-xl border border-stone-200 bg-white p-1 shadow-lg"
      transition:scale={{ duration: 200, start: 0.9, easing: expoOut }}
    >
      <button
        class="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-stone-100"
        onclick={rename}
      >
        <Edit class="h-5 w-5" />
        이름 변경
      </button>
      <button
        class="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-stone-100"
        onclick={reorder}
      >
        <SwapVert class="h-5 w-5" />
        순서 변경
      </button>
      <button
        class="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-stone-100 hover:text-red-600"
        onclick={confirmdelete}
      >
        <Delete class="h-5 w-5" />
        학생 삭제
      </button>
    </div>
  {/if}
</li>
