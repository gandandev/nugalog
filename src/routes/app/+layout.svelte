<script lang="ts">
  import type { PageData } from './$types'

  import Sidebar from '$lib/components/Sidebar.svelte'

  let { data, children }: { data: PageData; children: any } = $props()

  let loggedIn = $derived(data.session !== null)
</script>

<div class="flex h-full">
  <Sidebar />
  <div class="flex-1">
    <div class="flex justify-end p-4">
      {#if loggedIn}
        <button
          class="rounded-full duration-150 hover:ring-4 hover:ring-stone-100 dark:hover:ring-stone-900"
        >
          <img
            src={data.session!.user.user_metadata.avatar_url}
            alt=""
            class="h-8 w-8 rounded-full"
          />
        </button>
      {:else}
        <a
          href="/login"
          class="rounded-full border border-stone-200 px-3 py-1 text-stone-500 duration-150 hover:bg-stone-100 active:scale-95 active:bg-stone-200 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-900 dark:active:bg-stone-800"
        >
          로그인
        </a>
      {/if}
    </div>
    {@render children()}
  </div>
</div>
