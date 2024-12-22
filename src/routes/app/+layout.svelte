<script lang="ts">
  import { onMount } from 'svelte'
  import type { PageData } from './$types'
  import { scale } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import { data as dataStore, dataLoaded } from '$lib/stores'
  import { loadDataFromDb, saveDataToDb, loadDataFromLocalStorage } from '$lib/utils/db'

  import Sidebar from '$lib/components/Sidebar.svelte'
  import Logout from '~icons/mdi/logout'

  let { data, children }: { data: PageData; children: any } = $props()

  // 로그인 여부
  let loggedIn = $state(data.session !== null)

  data.supabase.auth.onAuthStateChange(async (event, session) => {
    console.log(event, session)
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
      loggedIn = session !== null
    } else if (event === 'SIGNED_OUT') {
      loggedIn = false
    }
  })

  // 계정 옵션
  let showAccountOptions = $state(false)
  let accountButton: HTMLButtonElement | null = $state(null)
  let accountOptions: HTMLDivElement | null = $state(null)
  function handleWindowClick(e: MouseEvent) {
    if (!accountButton?.contains(e.target as Node) && !accountOptions?.contains(e.target as Node)) {
      showAccountOptions = false
    }
  }

  onMount(async () => {
    const dbData = await loadDataFromDb(data.supabase)
    const localData = loadDataFromLocalStorage()

    if (dbData === null) {
      await saveDataToDb(data.supabase, localData)
    }
    $dataStore = dbData ?? localData

    $dataLoaded = true

    dataStore.subscribe(async (value) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('data', JSON.stringify(value))
      }
      await saveDataToDb(data.supabase, value)
    })
  })

  function signOut() {
    data.supabase.auth.signOut()
    loggedIn = false
    showAccountOptions = false
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="flex h-full">
  <Sidebar />

  <div class="flex-1">
    <div class="flex justify-end p-4">
      <div class="relative z-50 h-8">
        {#if loggedIn}
          <button
            bind:this={accountButton}
            class="rounded-full duration-150 hover:ring-4 hover:ring-stone-100 dark:hover:ring-stone-900"
            onclick={() => (showAccountOptions = !showAccountOptions)}
          >
            {#await data.supabase.auth.getUser() then user}
              <img
                src={user.data.user!.user_metadata.avatar_url}
                alt="프로필 사진"
                class="h-8 w-8 rounded-full"
              />
            {/await}
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

      {#await data.supabase.auth.getUser() then user}
        {#if showAccountOptions}
          <div
            bind:this={accountOptions}
            class="z-5 0 absolute top-12 mt-1 flex w-48 origin-top-right flex-col rounded-xl border border-stone-200 bg-white p-1 shadow-lg dark:border-stone-800 dark:bg-stone-800"
            transition:scale={{ duration: 200, start: 0.9, easing: expoOut }}
          >
            <div class="h-14 px-3 pt-2 leading-tight">
              <span class="font-medium">
                {user.data.user!.identities![0].identity_data!.full_name}
              </span>
              <span class="text-sm text-stone-500">
                {user.data.user!.email}
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
      {/await}
    </div>
    {@render children()}
  </div>
</div>
