<script lang="ts">
  import { slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import autosize from 'svelte-autosize'
  import { focusOnElement } from '$lib/utils'

  import IconButton from './IconButton.svelte'
  import EditorPanel from './EditorPanel.svelte'

  import ContentCopy from '~icons/mdi/content-copy'
  import Edit from '~icons/mdi/edit'
  import Delete from '~icons/mdi/delete'
  import Check from '~icons/mdi/check'
  import Close from '~icons/mdi/close'
  import Fullscreen from '~icons/mdi/fullscreen'
  import Calendar from '~icons/mdi/calendar'

  const {
    log,
    isNew = false,
    saveNewLog,
    cancelNewLog,
    deleteLog
  } = $props<
    | {
        log: { date: Date | null; content: string }
        isNew?: false
        deleteLog: () => void
      }
    | {
        log: { date: Date | null; content: string }
        isNew: true
        saveNewLog: (log: { date: Date; content: string }) => void
        cancelNewLog: () => void
      }
  >()

  // 삭제 확인
  let confirmingDelete = $state(false)

  // 편집
  let editing = $state(isNew)
  let date = $state(log.date ?? new Date())
  let content = $state(log.content)

  let editorExpanded = $state(false)

  function save() {
    if (isNew) {
      saveNewLog({ date, content })
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
      cancelNewLog()
    } else {
      date = log.date
      content = log.content
      editing = false
      editorExpanded = false
    }
  }

  // 내용 복사
  let lastCopied = $state(0)
  let copied = $state(false)
  function copy() {
    navigator.clipboard.writeText(log.content)
    const now = new Date().getTime()
    lastCopied = now
    copied = true
    setTimeout(() => {
      // lastCopied가 바뀌지 않았다면 그 사이 복사된 것이 아니므로 초기화
      if (lastCopied === now) {
        copied = false
      }
    }, 1000)
  }
</script>

<div
  class="group flex w-full flex-col gap-1 rounded-xl duration-150 hover:bg-stone-50 dark:hover:bg-stone-900"
  class:hover:bg-transparent={editing}
  class:dark:hover:bg-transparent={editing}
>
  <div class="mt-2 flex items-center justify-between" class:pl-3={!editing} class:pr-2={!editing}>
    <!-- 날짜 -->
    {#if editing}
      <div class="relative">
        <input
          type="date"
          value={date?.toISOString().slice(0, 10)}
          class="rounded-lg bg-stone-100 px-2 py-1 dark:bg-stone-900 [&::-webkit-calendar-picker-indicator]:z-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
          oninput={(e) => (date = e.currentTarget.value ? new Date(e.currentTarget.value) : null)}
        />
        {#if navigator.userAgent.includes('Chrome')}
          <Calendar class="absolute right-2 top-1/2 z-0 h-5 w-5 -translate-y-1/2 text-stone-500" />
        {/if}
      </div>
    {:else}
      <span class="text-stone-500">
        {log.date.toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
      </span>
    {/if}

    <!-- 액션 버튼 -->
    <div
      class="flex items-center text-stone-500 opacity-0 duration-150 active:text-stone-600 group-hover:opacity-100 dark:text-stone-400 dark:active:text-stone-300"
    >
      {#if !editing && !confirmingDelete}
        <div
          class="flex items-center"
          transition:slide={{ axis: 'x', duration: 300, easing: expoOut }}
        >
          <IconButton
            Icon={copied ? Check : ContentCopy}
            text={copied ? '복사됨' : undefined}
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
          <IconButton Icon={Fullscreen} text="크게 보기" onclick={() => (editorExpanded = true)} />
        </div>
      {/if}
      {#if !confirmingDelete}
        <div transition:slide={{ axis: 'x', duration: 300, easing: expoOut }}>
          <IconButton
            Icon={editing ? Check : Edit}
            text={editing ? '저장' : undefined}
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
            onclick={() => {
              if (confirmingDelete) deleteLog()
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
