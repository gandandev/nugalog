<script lang="ts">
  import { fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import autosize from 'svelte-autosize'

  import PillButton from './PillButton.svelte'

  const { title, content, date, close, save, minimizeEditor } = $props<{
    title: string
    content: string
    date: Date
    close: () => void
    minimizeEditor: () => void
    save: (content: string, date: Date) => void
  }>()

  let editedContent = $state(content)
  let editedDate = $state(date)
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape') close()
  }}
/>

<div
  class="fixed inset-y-0 left-64 right-0 z-10 flex items-center justify-center bg-white dark:bg-stone-950"
  transition:fly={{ y: 100, duration: 400, easing: expoOut }}
>
  <div class="flex max-h-full min-h-[50%] w-1/2 flex-col justify-between p-5">
    <div class="mb-3 flex flex-col gap-4">
      <h2 class="flex items-center text-2xl font-semibold">{title}</h2>
      <div class="flex items-center justify-between">
        <input
          type="date"
          class="w-fit rounded-xl bg-stone-100 px-3 py-2 outline-none dark:bg-stone-900"
          value={editedDate?.toISOString().slice(0, 10)}
          oninput={(e) =>
            (editedDate = e.currentTarget.value ? new Date(e.currentTarget.value) : null)}
        />
        <div class="flex justify-end gap-2">
          <PillButton text="취소" onclick={close} variant="secondary" />
          <PillButton text="작게 보기" onclick={minimizeEditor} variant="secondary" />
          <PillButton
            text="저장"
            onclick={() => save(editedContent, editedDate)}
            variant="primary"
            disabled={!editedContent.trim() || !editedDate}
          />
        </div>
      </div>
    </div>

    <textarea
      class="grow resize-none rounded-xl bg-stone-100 p-3 outline-none dark:bg-stone-900"
      bind:value={editedContent}
      use:autosize
    ></textarea>
  </div>
</div>
