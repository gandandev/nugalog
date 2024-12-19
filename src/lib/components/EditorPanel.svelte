<script lang="ts">
  import { fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import autosize from 'svelte-autosize'

  import PillButton from './PillButton.svelte'

  const { title, content, close, save, minimizeEditor } = $props<{
    title: string
    content: string
    close: () => void
    minimizeEditor: () => void
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
  class="fixed inset-y-0 left-64 right-0 z-10 flex items-center justify-center bg-white"
  transition:fly={{ y: 100, duration: 400, easing: expoOut }}
>
  <div class="flex max-h-full min-h-[50%] w-1/2 flex-col justify-between p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="flex items-center text-2xl font-semibold">{title}</h2>
      <div class="flex justify-end gap-2">
        <PillButton text="취소" onclick={close} variant="secondary" />
        <PillButton text="작게 보기" onclick={minimizeEditor} variant="secondary" />
        <PillButton
          text="저장"
          onclick={() => save(editedContent)}
          variant="primary"
          disabled={!editedContent.trim()}
        />
      </div>
    </div>

    <textarea
      class="grow resize-none rounded-xl bg-stone-100 p-3 outline-none"
      bind:value={editedContent}
      use:autosize
    ></textarea>
  </div>
</div>
