<script lang="ts">
  import { page } from '$app/stores'
  import GroupAdd from '~icons/mdi/group-add'
  import Add from '~icons/mdi/add'
  import Close from '~icons/mdi/close'
  import IconButton from './IconButton.svelte'
  import SidebarItem from './SidebarItem.svelte'
  import Dialog from './Dialog.svelte'
  import { josa } from 'es-hangul'
  import { data, type StudentData } from '$lib/stores'

  let newStudentName: string | null = $state(null)
  let duplicateStudentName = $derived(
    $data.some((student) => student.name === newStudentName?.trim())
  )
  let studentToDelete: StudentData | null = $state(null)

  function addStudent() {
    if (!newStudentName || duplicateStudentName || !newStudentName.trim()) return
    $data = [...$data, { name: newStudentName.trim(), logs: [] }]
    newStudentName = ''
  }

  function reorder() {
    console.log('reorder')
  }

  function confirmDelete(student: StudentData) {
    studentToDelete = student
  }

  function handleCancel() {
    studentToDelete = null
  }

  function handleDelete() {
    $data = $data.filter((s) => s.name !== studentToDelete?.name)
    studentToDelete = null
  }
</script>

<aside class="flex w-64 shrink-0 flex-col gap-2 border-r border-stone-200 bg-stone-100 p-1">
  <!-- 헤더 -->
  <div class="flex items-center justify-between pl-4 pr-2 pt-2">
    <h1 class="font-monasans text-2xl font-bold">nugalog</h1>
    <IconButton Icon={GroupAdd} onclick={() => (newStudentName = '')} />
  </div>

  <!-- 이름 목록 -->
  <ul class="w-full flex-1 space-y-0.5 overflow-y-auto overflow-x-visible px-1">
    {#each $data as student (student.name)}
      <SidebarItem
        {student}
        isActive={$page.url.pathname === `/student/${encodeURIComponent(student.name)}`}
        {reorder}
        confirmdelete={() => confirmDelete(student)}
      />
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

{#if studentToDelete}
  <Dialog
    title={`학생 "${studentToDelete.name}"${josa.pick(studentToDelete.name, '을/를')} 삭제할까요?`}
    description="삭제된 학생은 복구할 수 없습니다."
    actions={[
      { label: '취소', onclick: handleCancel, variant: 'secondary' },
      { label: '삭제', onclick: handleDelete, variant: 'danger' }
    ]}
    oncancel={handleCancel}
  />
{/if}

<style>
  /* Your styles here */
</style>
