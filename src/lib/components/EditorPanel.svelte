<script lang="ts">
  import { fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import autosize from 'svelte-autosize'
  import { focusOnElement } from '$lib/utils/focus'

  import PillButton from './PillButton.svelte'
  import Panel from './Panel.svelte'
  import DatePicker from './DatePicker.svelte'

  import CalendarToday from '~icons/material-symbols/calendar-today-rounded'

  let {
    show,
    title,
    content,
    date,
    close,
    save,
    minimizeEditor
  }: {
    show: boolean
    title: string
    content: string
    date: Date | null
    close: () => void
    save: (content: string, date: Date) => void
    minimizeEditor: () => void
  } = $props()

  let editedContent = $state(content)
  let editedDate = $state(date)
  let datePickerOpen = $state(false)
  let datePickerButton: HTMLElement | null = $state(null)
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape') close()
  }}
/>

<Panel {show}>
  <div class="flex max-h-full min-h-[50%] w-full flex-col justify-between p-5 lg:w-2/3">
    <div class="mb-3 flex flex-col gap-4">
      <h2 class="flex items-center text-2xl font-semibold">{title}</h2>
      <div class="flex items-center justify-between">
        <div class="relative">
          <button
            bind:this={datePickerButton}
            class="flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 outline-none duration-150 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800"
            class:ring-2={!editedDate}
            class:ring-red-500={!editedDate}
            onclick={() => (datePickerOpen = !datePickerOpen)}
          >
            <CalendarToday class="h-5 w-5" />
            <span>
              {editedDate
                ? editedDate.toLocaleString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                  })
                : '날짜 선택'}
            </span>
          </button>
          <DatePicker
            show={datePickerOpen}
            date={editedDate}
            button={datePickerButton}
            closeMenu={() => (datePickerOpen = false)}
            onSelect={(newDate) => {
              editedDate = newDate
              datePickerOpen = false
            }}
            class="mt-1"
          />
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
</Panel>
