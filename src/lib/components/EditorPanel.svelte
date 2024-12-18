<script lang="ts">
  import { fade, fly } from 'svelte/transition'
  import { expoOut, expoIn } from 'svelte/easing'
  import autosize from 'svelte-autosize'

  import IconButton from './IconButton.svelte'
  import Close from '~icons/mdi/close'

  const { content, close, save } = $props<{
    content: string
    close: () => void
    save: (content: string) => void
  }>()

  let editedContent = $state(content)
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape') close()
  }}
/>

<div
  class="fixed inset-y-0 left-64 right-0 z-50 flex items-center justify-center bg-white p-4"
  transition:fly={{ y: 100, duration: 400, easing: expoOut }}
>
  <div class="flex max-h-full min-h-[50%] w-1/2 flex-col">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold">기록 편집</h2>
      <IconButton Icon={Close} onclick={close}></IconButton>
    </div>

    <textarea
      class="grow resize-none rounded-xl bg-stone-100 p-3 outline-none"
      bind:value={editedContent}
      use:autosize
    ></textarea>

    <div class="mt-4 flex justify-end gap-2">
      <button
        class="rounded-full bg-stone-100 px-4 py-2 duration-150 hover:bg-stone-200 active:scale-95"
        onclick={close}
      >
        취소
      </button>
      <button
        class="rounded-full bg-black px-4 py-2 text-white duration-150 hover:bg-stone-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        onclick={() => save(editedContent)}
        disabled={!editedContent.trim()}
      >
        저장
      </button>
    </div>
  </div>
</div>
