<script lang="ts">
  import { beforeNavigate } from '$app/navigation'
  import { slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import autosize from 'svelte-autosize'
  import { focusOnElement, useCopyFeedback } from '$lib/utils'
  import { page } from '$app/stores'

  import IconButton from './IconButton.svelte'
  import EditorPanel from './EditorPanel.svelte'

  import ContentCopy from '~icons/material-symbols/content-copy-rounded'
  import Edit from '~icons/material-symbols/edit-rounded'
  import Delete from '~icons/material-symbols/delete-rounded'
  import Check from '~icons/material-symbols/check-rounded'
  import Close from '~icons/material-symbols/close-rounded'
  import Expand from '~icons/material-symbols/expand-rounded'
  import CalendarToday from '~icons/material-symbols/calendar-today-rounded'

  const {
    log,
    isNew = false,
    saveNewLog,
    cancelNewLog,
    deleteLog,
    dragged = false,
    ondragstart,
    ondragend
  }: {
    log: { date: Date | null; content: string }
    isNew?: boolean
    deleteLog?: () => void
    saveNewLog?: (log: { date: Date; content: string }) => void
    cancelNewLog?: () => void
    dragged?: boolean
    ondragstart?: (e: DragEvent) => void
    ondragend?: () => void
  } = $props()

  // 삭제 확인
  let confirmingDelete = $state(false)

  // 편집
  let editing = $state(isNew)
  let date: Date | null = $state(log.date)
  let content = $state(log.content)

  let editorExpanded = $state(false)

  beforeNavigate((navigation) => {
    if (editing && !navigation.willUnload && navigation.to?.url.pathname !== $page.url.pathname) {
      navigation.cancel()
      window.dispatchEvent(
        new CustomEvent('showNavigationDialog', {
          detail: {
            to: navigation.to?.url.pathname ?? '/',
            save: () => {
              save()
              editing = false
              editorExpanded = false
            }
          }
        })
      )
    }
  })

  function save() {
    if (date === null) return
    if (isNew) {
      saveNewLog!({ date, content })
    } else {
      log.date = date
      log.content = content
      editing = false
      editorExpanded = false
    }
  }

  // 취소
  function cancel() {
    if (isNew) {
      cancelNewLog!()
    } else {
      date = log.date ?? new Date()
      content = log.content
      editing = false
      editorExpanded = false
    }
  }

  // 내용 복사
  let copied = $state(false)
  const handleCopy = useCopyFeedback((isCopied) => (copied = isCopied))
  function copy() {
    navigator.clipboard.writeText(log.content)
    handleCopy()
  }
</script>

<svelte:window onbeforeunload={(e) => editing && e.preventDefault()} />

<div
  class="group flex w-full flex-col gap-1 rounded-xl duration-150 hover:bg-stone-50 dark:hover:bg-stone-900"
  class:hover:bg-transparent={editing}
  class:dark:hover:bg-transparent={editing}
  class:opacity-50={dragged}
  draggable={!editing}
  {ondragstart}
  {ondragend}
>
  <div class="mt-2 flex items-center justify-between" class:pl-3={!editing} class:pr-2={!editing}>
    <!-- 날짜 -->
    <div class="flex items-center gap-2">
      {#if editing}
        <div class="relative">
          <input
            type="date"
            value={date?.toISOString().slice(0, 10)}
            class="rounded-lg bg-stone-100 px-2 py-1 outline-none duration-150 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 [&::-webkit-calendar-picker-indicator]:z-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
            class:ring-2={!date}
            class:ring-red-500={!date}
            oninput={(e) => (date = e.currentTarget.value ? new Date(e.currentTarget.value) : null)}
          />
          {#if navigator.userAgent.includes('Chrome')}
            <CalendarToday class="absolute right-2 top-1/2 z-0 h-5 w-5 -translate-y-1/2" />
          {/if}
        </div>
      {:else}
        <span class="text-stone-500">
          {log.date
            ? log.date.toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
            : '올바르지 않은 날짜'}
        </span>
      {/if}
    </div>

    <!-- 액션 버튼 -->
    <div
      class="flex items-center text-stone-500 opacity-0 duration-150 active:text-stone-600 group-hover:opacity-100 dark:text-stone-400 dark:active:text-stone-300"
      class:opacity-100={editing}
    >
      {#if !editing && !confirmingDelete}
        <div
          class="flex items-center"
          transition:slide={{ axis: 'x', duration: 300, easing: expoOut }}
        >
          <IconButton
            Icon={copied ? Check : ContentCopy}
            text={copied ? '복사됨' : undefined}
            tooltip="내용 복사"
            onclick={copy}
          />
        </div>
      {/if}
      {#if editing}
        <div
          class="flex items-center"
          transition:slide={{ axis: 'x', duration: 300, easing: expoOut }}
        >
          <IconButton Icon={Close} text="취소" onclick={cancel} />
          <IconButton Icon={Expand} text="크게 보기" onclick={() => (editorExpanded = true)} />
        </div>
      {/if}
      {#if !confirmingDelete}
        <div transition:slide={{ axis: 'x', duration: 300, easing: expoOut }}>
          <IconButton
            Icon={editing ? Check : Edit}
            text={editing ? '저장' : undefined}
            tooltip={!editing ? '편집' : undefined}
            onclick={() => {
              if (editing) save()
              else editing = true
            }}
            disabled={editing && (!content.trim() || !date)}
          />
        </div>
      {/if}
      {#if !editing}
        <div transition:slide={{ axis: 'x', duration: 300, easing: expoOut }}>
          <IconButton
            Icon={Delete}
            text={confirmingDelete ? '삭제' : undefined}
            tooltip="삭제"
            onclick={() => {
              if (confirmingDelete) deleteLog!()
              else confirmingDelete = true
            }}
          />
        </div>
      {/if}
      {#if confirmingDelete}
        <div transition:slide={{ axis: 'x', duration: 300, easing: expoOut }}>
          <IconButton Icon={Close} text="취소" onclick={() => (confirmingDelete = false)} />
        </div>
      {/if}
    </div>
  </div>

  <!-- 내용 -->
  {#if editing}
    <textarea
      class="w-full resize-none rounded-lg bg-stone-100 p-3 outline-none duration-150 dark:bg-stone-900"
      bind:value={content}
      use:autosize
      use:focusOnElement
      onkeydown={(e) => {
        if (e.key === 'Enter' && e.metaKey && content.trim()) save()
        else if (e.key === 'Escape') cancel()
      }}
    ></textarea>
  {:else}
    <p class="m-3 mt-0 whitespace-pre-wrap font-sans">{log.content}</p>
  {/if}
</div>

{#if editorExpanded}
  <EditorPanel
    title={isNew ? '새 기록' : '기록 편집'}
    {content}
    {date}
    close={cancel}
    minimizeEditor={() => (editorExpanded = false)}
    save={(newContent, newDate) => {
      content = newContent
      date = newDate
      save()
    }}
  />
{/if}
