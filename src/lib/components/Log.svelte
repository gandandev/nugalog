<script lang="ts">
  import autosize from 'svelte-autosize'

  import ContentCopy from '~icons/mdi/content-copy'
  import Edit from '~icons/mdi/edit'
  import Delete from '~icons/mdi/delete'
  import Check from '~icons/mdi/check'
  import Close from '~icons/mdi/close'
  import IconButton from './IconButton.svelte'

  const { log, deleteLog } = $props<{
    log: { date: Date; content: string }
    deleteLog: () => void
  }>()

  let editing = $state(false)
  let date: Date | null = $state(log.date)
  let content = $state(log.content)

  let copied = $state(false)

  let confirmingDelete = $state(false)

  function save() {
    log.date = date
    log.content = content
    editing = false
  }

  function cancel() {
    date = log.date
    content = log.content
    editing = false
  }

  function copy() {
    navigator.clipboard.writeText(log.content)
    copied = true
    setTimeout(() => (copied = false), 1000)
  }
</script>

<div
  class="group flex w-full flex-col gap-1 rounded-xl duration-150 hover:bg-stone-50"
  class:hover:bg-transparent={editing}
>
  <div class="mx-3 mt-2 flex items-center justify-between" class:mr-0={editing}>
    {#if editing}
      <input
        type="date"
        value={date?.toISOString().slice(0, 10)}
        oninput={(e) => (date = e.currentTarget.value ? new Date(e.currentTarget.value) : null)}
      />
    {:else}
      <span class="text-stone-500">
        {log.date.toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
      </span>
    {/if}
    <div
      class="flex items-center text-stone-500 opacity-0 duration-150 active:text-stone-600 group-hover:opacity-100"
    >
      {#if editing}
        <IconButton Icon={Close} text="취소" onclick={cancel} />
        <IconButton Icon={Check} text="저장" onclick={save} disabled={!content.trim() || !date} />
      {:else if confirmingDelete}
        <IconButton Icon={Delete} text="삭제" onclick={deleteLog} />
        <IconButton Icon={Close} text="취소" onclick={() => (confirmingDelete = false)} />
      {:else}
        <IconButton
          Icon={copied ? Check : ContentCopy}
          onclick={copy}
          text={copied ? '복사됨' : undefined}
        />
        <IconButton Icon={Edit} onclick={() => (editing = true)} />
        <IconButton Icon={Delete} onclick={() => (confirmingDelete = true)} />
      {/if}
    </div>
  </div>
  {#if editing}
    <textarea
      class="w-full resize-none rounded-lg p-3 duration-150 focus:outline-none"
      class:bg-stone-100={editing}
      bind:value={content}
      use:autosize
    ></textarea>
  {:else}
    <p class="m-3 mt-0 whitespace-pre-wrap font-sans">{log.content}</p>
  {/if}
</div>
