<script lang="ts">
  import { page } from '$app/stores'

  import GroupAdd from '~icons/mdi/group-add'
  import Add from '~icons/mdi/add'
  import Close from '~icons/mdi/close'
  import IconButton from './IconButton.svelte'

  import { data } from '$lib/stores'

  let newStudentName: string | null = $state(null)
  let duplicateStudentName = $derived(
    $data.some((student) => student.name === newStudentName?.trim())
  )

  function addStudent() {
    if (!newStudentName || duplicateStudentName || !newStudentName.trim()) return
    $data = [...$data, { name: newStudentName.trim(), logs: [] }]
    newStudentName = ''
  }
</script>

<aside class="flex w-64 shrink-0 flex-col gap-2 border-r border-stone-200 bg-stone-100 p-1">
  <!-- 헤더 -->
  <div class="flex items-center justify-between pl-4 pr-2 pt-2">
    <h1 class="font-monasans text-2xl font-bold">nugalog</h1>
    <IconButton Icon={GroupAdd} onclick={() => (newStudentName = '')} />
  </div>

  <!-- 이름 목록 -->
  <ul class="w-full flex-1 space-y-0.5 overflow-y-auto px-1">
    {#each $data as student}
      <li class="w-full">
        <a
          href="/student/{encodeURIComponent(student.name)}"
          class="block rounded-lg px-3 py-1 duration-150 hover:bg-stone-200 active:bg-stone-300"
          class:bg-stone-200={$page.url.pathname === `/student/${encodeURIComponent(student.name)}`}
          class:hover:bg-stone-300={$page.url.pathname ==
            `/student/${encodeURIComponent(student.name)}`}
        >
          {student.name}
        </a>
      </li>
    {/each}
    {#if newStudentName !== null}
      <li class="pt-1">
        <div class="flex w-full gap-1">
          <input
            type="text"
            bind:value={newStudentName}
            class="block grow rounded-lg bg-white px-3 py-1 duration-150"
            onkeydown={(e) => {
              if (e.key === 'Enter' && !e.isComposing) {
                addStudent()
              }
            }}
          />
          {#if newStudentName.trim()}
            <IconButton
              Icon={Add}
              onclick={addStudent}
              disabled={duplicateStudentName || !newStudentName.trim()}
            />
          {:else}
            <IconButton Icon={Close} onclick={() => (newStudentName = null)} />
          {/if}
        </div>
        {#if duplicateStudentName}
          <p class="pl-1 pt-1 text-xs text-stone-500 duration-150">학생 이름이 중복되었습니다.</p>
        {/if}
      </li>
    {/if}
  </ul>
</aside>
