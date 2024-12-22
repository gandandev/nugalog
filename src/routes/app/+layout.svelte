<script lang="ts">
  import { onMount } from 'svelte'
  import type { PageData } from './$types'
  import { scale, fade } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import { data as dataStore, dataLoaded, type Log, type StudentData } from '$lib/stores'

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

  // localStorage에서 데이터 불러오기
  if (typeof localStorage !== 'undefined') {
    const storedData = JSON.parse(localStorage.getItem('data') || '[]') as StudentData[]
    const parsedData = storedData.map((student) => ({
      ...student,
      logs: student.logs.map((log) => ({ ...log, date: new Date(log.date) }))
    }))
    dataStore.set(parsedData)
    dataLoaded.set(true)
  }

  // DB에서 데이터 가져오기
  async function loadDataFromDb() {
    const { data: userData } = await data.supabase.auth.getUser()
    const user = userData?.user
    if (!user) return // 로그인 안 된 상태라면 스킵

    const { data: dbResult, error } = await data.supabase
      .from('classes')
      .select('id, created_at, students, user_id')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('가져오는 중 오류:', error)
      return
    }

    if (dbResult?.students) {
      const parsed = dbResult.students.map((student: StudentData) => ({
        ...student,
        logs: student.logs.map((log: Log) => ({
          ...log,
          date: new Date(log.date)
        }))
      }))
      dataStore.set(parsed)
    }

    dataLoaded.set(true)
  }

  // DB에 데이터 저장하기
  async function saveDataToDb(dataToSave: StudentData[]) {
    const { data: userData } = await data.supabase.auth.getUser()
    const user = userData?.user
    if (!user) return

    const { error } = await data.supabase.from('classes').upsert(
      {
        students: dataToSave,
        user_id: user.id
      },
      { onConflict: 'user_id' }
    )
    if (error) {
      console.error('저장 중 오류:', error)
    }
  }

  onMount(async () => {
    // 컴포넌트가 마운트되면 DB에서 먼저 불러오기
    await loadDataFromDb()

    // dataStore가 바뀔 때마다 localStorage & DB에 저장
    dataStore.subscribe(async (value) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('data', JSON.stringify(value))
      }
      await saveDataToDb(value)
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
