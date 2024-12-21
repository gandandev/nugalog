<script lang="ts">
  import type { PageData } from './$types'
  import { scale } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'

  import Sidebar from '$lib/components/Sidebar.svelte'

  import Logout from '~icons/mdi/logout'

  let { data, children }: { data: PageData; children: any } = $props()

  let loggedIn = $state(data.session !== null)

  data.supabase.auth.onAuthStateChange((event, session) => {
    console.log(event, session)

    if (event === 'INITIAL_SESSION') {
      loggedIn = session !== null
    } else if (event === 'SIGNED_IN') {
      loggedIn = true
    } else if (event === 'SIGNED_OUT') {
      loggedIn = false
    }
  })

  // 계정 옵션 표시
  let showAccountOptions = $state(false)
  let accountButton: HTMLButtonElement | null = $state(null)
  let accountOptions: HTMLDivElement | null = $state(null)
  function handleWindowClick(event: MouseEvent) {
    if (
      !accountButton?.contains(event.target as Node) &&
      !accountOptions?.contains(event.target as Node)
    ) {
      showAccountOptions = false
    }
  }

  function signOut() {
    data.supabase.auth.signOut()
    // goto('/login')
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="flex h-full">
  <Sidebar />
  <div class="flex-1">
    <div class="flex justify-end p-4">
      <div class="relative">
        {#if loggedIn}
          <button
            bind:this={accountButton}
            class="rounded-full duration-150 hover:ring-4 hover:ring-stone-100 dark:hover:ring-stone-900"
            onclick={() => {
              showAccountOptions = !showAccountOptions
            }}
          >
            <img
              src={data.session!.user.user_metadata.avatar_url}
              alt="프로필 사진"
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
      {#if showAccountOptions}
        <div
          bind:this={accountOptions}
          class="absolute top-12 z-10 mt-1 flex w-48 origin-top-right flex-col rounded-xl border border-stone-200 bg-white p-1 shadow-lg dark:border-stone-800 dark:bg-stone-800"
          transition:scale={{ duration: 200, start: 0.9, easing: expoOut }}
        >
          <div class="px-3 py-2 leading-tight">
            <span class="font-medium">
              {data.session!.user.identities![0].identity_data!.full_name}
            </span>
            <span class="text-sm text-stone-500">
              {data.session!.user.email}
            </span>
          </div>
          <button
            class="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-stone-100 hover:text-red-600 dark:hover:bg-stone-700 dark:hover:text-red-500"
            onclick={signOut}
          >
            <Logout class="h-5 w-5" />
            로그아웃
          </button>
        </div>
      {/if}
    </div>
    {@render children()}
  </div>
</div>
