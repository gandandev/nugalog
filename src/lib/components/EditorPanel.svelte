<script lang="ts">
  import { fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import autosize from 'svelte-autosize'
  import { focusOnElement } from '$lib/utils'

  import PillButton from './PillButton.svelte'

  import CalendarToday from '~icons/material-symbols/calendar-today-rounded'

  const {
    title,
    content,
    date,
    close,
    save,
    minimizeEditor
  }: {
    title: string
    content: string
    date: Date | null
    close: () => void
    save: (content: string, date: Date) => void
    minimizeEditor: () => void
  } = $props()

  let editedContent = $state(content)
  let editedDate = $state(date)
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape') close()
  }}
/>

<div
  class="fixed inset-y-0 left-64 right-0 z-10 hidden items-center justify-center bg-white md:flex dark:bg-stone-950"
  transition:fly={{ y: 100, duration: 400, easing: expoOut }}
>
  <div class="flex max-h-full min-h-[50%] w-1/2 flex-col justify-between p-5">
    <div class="mb-3 flex flex-col gap-4">
      <h2 class="flex items-center text-2xl font-semibold">{title}</h2>
      <div class="flex items-center justify-between">
        <div class="relative">
          <input
            type="date"
            class="w-fit rounded-xl bg-stone-100 px-3 py-2 outline-none duration-150 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 [&::-webkit-calendar-picker-indicator]:z-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
            class:ring-2={!date}
            class:ring-red-500={!date}
            value={editedDate?.toISOString().slice(0, 10)}
            oninput={(e) =>
              (editedDate = e.currentTarget.value ? new Date(e.currentTarget.value) : null)}
          />
          {#if navigator.userAgent.includes('Chrome')}
            <CalendarToday class="absolute right-3 top-1/2 z-0 h-5 w-5 -translate-y-1/2" />
          {/if}
        </div>
        <div class="flex justify-end gap-2">
          <PillButton text="취소" onclick={close} variant="secondary" />
          <PillButton text="작게 보기" onclick={minimizeEditor} variant="secondary" />
          <PillButton
            text="저장"
            onclick={() => save(editedContent, editedDate!)}
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
      use:focusOnElement
      onkeydown={(e) => {
        if (e.key === 'Enter' && e.metaKey && editedContent.trim() && editedDate)
          save(editedContent, editedDate)
        else if (e.key === 'Escape') close()
      }}
    ></textarea>
  </div>
</div>
