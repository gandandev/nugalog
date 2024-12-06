<script>
  import { page } from '$app/stores'

  import GroupAdd from '~icons/mdi/group-add'
  import IconButton from './IconButton.svelte'

  import { data } from '$lib/stores'
</script>

<aside class="flex w-64 shrink-0 flex-col gap-2 border-r border-stone-200 bg-stone-100 p-1">
  <!-- 헤더 -->
  <div class="flex items-center justify-between pl-4 pr-2 pt-2">
    <h1 class="font-monasans text-2xl font-bold">nugalog</h1>
    <IconButton Icon={GroupAdd} />
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
  </ul>
</aside>
