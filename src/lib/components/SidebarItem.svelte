<script lang="ts">
  import MoreHoriz from '~icons/mdi/more-horiz'
  import Delete from '~icons/mdi/delete'
  import Edit from '~icons/mdi/pencil'
  import SwapVert from '~icons/mdi/swap-vertical'
  import { data, type StudentData } from '$lib/stores'

  const { student, isActive, reorder } = $props<{
    student: StudentData
    isActive: boolean
    reorder: () => void
  }>()

  let showOptions = $state(false)
  let optionsMenu: HTMLDivElement | null = $state(null)
  let optionsButton: HTMLButtonElement | null = $state(null)

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!optionsMenu?.contains(target) && !optionsButton?.contains(target)) {
      showOptions = false
    }
  }

  function rename() {
    console.log('rename')
  }

  function remove() {
    $data = $data.filter((s) => s.name !== student.name)
  }
</script>

<svelte:window on:click={handleClickOutside} />

<li
  class="group/item relative flex w-full rounded-lg hover:bg-stone-200"
  class:bg-stone-200={isActive}
>
  <a
    href="/student/{encodeURIComponent(student.name)}"
    class="peer block grow rounded-l-lg py-1 pl-3 duration-150 active:bg-stone-300"
  >
    {student.name}
  </a>
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

  {#if showOptions}
    <div
      bind:this={optionsMenu}
      class="absolute right-0 top-full z-10 mt-1 flex w-48 flex-col rounded-xl border border-stone-200 bg-white p-1 shadow-lg"
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
        onclick={remove}
      >
        <Delete class="h-5 w-5" />
        학생 삭제
      </button>
    </div>
  {/if}
</li>
