<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import type { PageData } from './$types'
  import { type User } from '@supabase/supabase-js'
  import { scale } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import { data as dataStore, dataLoaded, type Student } from '$lib/stores'
  import { onClickOutside } from '$lib/utils'
  import {
    loadDataFromDb,
    saveDataToDb,
    loadDataFromLocalStorage,
    handleInitialDataConflict
  } from '$lib/utils/db'
  import {
    type ConflictData,
    handleCancelChanges,
    handleOverwrite,
    handleMerge,
    checkForConflicts as checkForDataConflicts
  } from '$lib/utils/handleConflict'

  import Sidebar from '$lib/components/Sidebar.svelte'
  import Dialog from '$lib/components/Dialog.svelte'

  import Logout from '~icons/mdi/logout'

  let { data, children }: { data: PageData; children: any } = $props()

  let currentUser: User | null = $state(null)

  // 충돌 감지 및 해결에 사용
  let showConflictDialog = $state(false)
  let conflictData = $state<ConflictData | null>(null)

  let showInitialConflictDialog = $state(false)
  let initialConflictData = $state<{ dbData: Student[]; localData: Student[] } | null>(null)
  let selectedInitialOption = $state<'useLocal' | 'useDB' | null>(null)

  onMount(async () => {
    const {
      data: { session }
    } = await data.supabase.auth.getSession()
    currentUser = session?.user || null

    const { data: localData, error: localError } = loadDataFromLocalStorage()
    if (localError) {
      console.error('Failed to load local data:', localError)
      $dataStore = []
      $dataLoaded = true
      return
    }

    if (currentUser) {
      const dbData = await loadDataFromDb(data.supabase)

      // DB와 로컬에 데이터가 모두 있을 때
      if (dbData && localData && localData.length > 0) {
        const hasConflicts =
          dbData.length > 0 && JSON.stringify(dbData) !== JSON.stringify(localData)
        if (hasConflicts) {
          showInitialConflictDialog = true
          initialConflictData = { dbData, localData }

          const resolvedData = await handleInitialDataConflict(data.supabase, dbData, localData)
          $dataStore = resolvedData
        } else {
          $dataStore = dbData
        }
      } else {
        $dataStore = dbData || localData || []
        if (dbData === null && localData) {
          await saveDataToDb(data.supabase, localData)
        }
      }
    } else {
      $dataStore = localData || []
    }

    $dataLoaded = true

    dataStore.subscribe(async (value) => {
      if (currentUser) {
        const dbData = await loadDataFromDb(data.supabase)
        const { data: localData } = loadDataFromLocalStorage() // 저장되기 전 데이터

        // 다른 곳에서 DB가 변경되었는지 확인
        if (dbData && localData) {
          const hasConflicts = checkForDataConflicts(localData, dbData, value)
          if (hasConflicts) {
            showConflictDialog = true
            conflictData = {
              previousLocal: localData,
              database: dbData,
              newLocal: value
            }
          }
        }

        // 실제로 변경되었을 때만 DB에 저장
        if (JSON.stringify(dbData) !== JSON.stringify(value)) {
          await saveDataToDb(data.supabase, value)
        }
      }

      // 데이터 변경 후 localStorage에 저장
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('data', JSON.stringify(value))
      }
    })
  })

  data.supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      currentUser = null
    } else if (session?.user) {
      currentUser = session.user
    }
  })

  function signInWithGoogle() {
    data.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${$page.url.origin}/auth/callback?next=/app`
      }
    })
  }

  async function signOut() {
    if (currentUser) {
      const dbData = await loadDataFromDb(data.supabase)
      if (dbData) $dataStore = dbData
    }
    data.supabase.auth.signOut()
    currentUser = null
    showAccountOptions = false
  }

  // 계정 옵션
  let showAccountOptions = $state(false)
  let accountButton: HTMLButtonElement | null = $state(null)
  let accountOptions: HTMLDivElement | null = $state(null)
  let logoutButton: HTMLButtonElement | null = $state(null)

  function closeAccountOptions() {
    showAccountOptions = false
  }

  onMount(() => {
    const handler = (e: CustomEvent<{ dbData: Student[]; localData: Student[] }>) => {
      showInitialConflictDialog = true
      initialConflictData = e.detail
    }
    window.addEventListener('showInitialDataConflict' as any, handler)
    return () => window.removeEventListener('showInitialDataConflict' as any, handler)
  })
</script>

<div class="flex h-screen overflow-hidden">
  <Sidebar />

  <div class="flex flex-1 flex-col overflow-hidden">
    <div class="sticky inset-x-0 top-0 flex items-center justify-end gap-3 p-4">
      {#if !currentUser && $dataStore.reduce((acc, student) => acc + student.logs.length, 0) >= 3}
        <p class="text-stone-500">로그인 후 여러 기기에서 작업해보세요</p>
      {/if}
      <div class="relative z-50 h-8">
        {#if currentUser}
          <button
            bind:this={accountButton}
            class="rounded-full duration-150 hover:ring-4 hover:ring-stone-100 dark:hover:ring-stone-800"
            onclick={() => (showAccountOptions = !showAccountOptions)}
            onkeydown={(e) => {
              if (e.key === 'ArrowDown' && !showAccountOptions) {
                e.preventDefault()
                showAccountOptions = true
                logoutButton?.focus()
              }
            }}
            aria-expanded={showAccountOptions}
            aria-haspopup="true"
          >
            <img
              src={currentUser.user_metadata.avatar_url}
              alt="프로필 사진"
              class="h-8 w-8 rounded-full"
            />
          </button>
        {:else}
          <button
            class="flex items-center rounded-full border border-stone-200 pr-2.5 text-stone-500 duration-150 hover:bg-stone-100 active:scale-95 active:bg-stone-200 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-900 dark:active:bg-stone-800"
            onclick={signInWithGoogle}
          >
            <div class="flex h-8 w-8 items-center justify-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                alt="Google 로고"
                class="h-5 w-5"
              />
            </div>
            Google로 로그인
          </button>
        {/if}
      </div>

      {#if showAccountOptions && currentUser}
        <div
          bind:this={accountOptions}
          class="absolute top-12 z-50 mt-1 flex w-48 origin-top-right flex-col rounded-xl border border-stone-200 bg-white p-1 shadow-lg dark:border-stone-700 dark:bg-stone-800"
          transition:scale={{ duration: 200, start: 0.9, easing: expoOut }}
          use:onClickOutside={{
            callback: closeAccountOptions,
            exclude: accountButton ? [accountButton] : []
          }}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="account-menu-button"
        >
          <div class="h-14 px-3 pt-2 leading-tight">
            <span class="font-medium">
              {currentUser.identities?.[0]?.identity_data?.full_name}
            </span>
            <span class="text-sm text-stone-500">
              {currentUser.email}
            </span>
          </div>
          <button
            bind:this={logoutButton}
            class="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-stone-100 hover:text-red-600 dark:hover:bg-stone-700 dark:hover:text-red-500"
            onclick={signOut}
            onkeydown={(e) => {
              if (e.key === 'Escape' || (e.key === 'Tab' && !e.shiftKey)) {
                e.preventDefault()
                closeAccountOptions()
                accountButton?.focus()
              }
            }}
            role="menuitem"
          >
            <Logout class="h-5 w-5" />
            로그아웃
          </button>
        </div>
      {/if}
    </div>
    <div class="flex-1 overflow-hidden">
      {@render children()}
    </div>
  </div>
</div>

{#if showConflictDialog && conflictData}
  <Dialog
    title="다른 곳에서 데이터가 변경되었습니다."
    description="어떻게 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    actions={[
      {
        label: '내 변경 사항 취소',
        variant: 'secondary',
        onclick: async () => {
          if (!conflictData) return
          await handleCancelChanges(conflictData, (data) => ($dataStore = data))
          showConflictDialog = false
          conflictData = null
        }
      },
      {
        label: '덮어쓰기',
        variant: 'danger',
        onclick: async () => {
          if (!conflictData) return
          await handleOverwrite(data.supabase, conflictData)
          showConflictDialog = false
          conflictData = null
        }
      },
      {
        label: '병합',
        variant: 'primary',
        onclick: async () => {
          if (!conflictData) return
          await handleMerge(conflictData, (data) => ($dataStore = data))
          showConflictDialog = false
          conflictData = null
        }
      }
    ]}
  />
{/if}

{#if showInitialConflictDialog && initialConflictData}
  {#if !selectedInitialOption}
    <Dialog
      title="서버에 이미 저장된 데이터가 있습니다."
      description="어떤 데이터를 사용하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      actions={[
        {
          label: '로그인 전 데이터 사용',
          variant: 'secondary',
          onclick: () => {
            selectedInitialOption = 'useLocal'
          }
        },
        {
          label: '서버에 저장된 데이터 사용',
          variant: 'secondary',
          onclick: () => {
            selectedInitialOption = 'useDB'
          }
        },
        {
          label: '데이터 병합',
          variant: 'primary',
          onclick: () => {
            window.dispatchEvent(new CustomEvent('initialDataConflict', { detail: 'merge' }))
            showInitialConflictDialog = false
            initialConflictData = null
          }
        }
      ]}
    />
  {:else}
    <Dialog
      title="계속하시겠습니까?"
      description={selectedInitialOption === 'useLocal'
        ? '서버에 저장된 데이터가 로그인 전 작성한 데이터로 대체됩니다.'
        : '로그인 전 작성한 데이터가 삭제되고 서버에 저장된 데이터를 사용합니다.'}
      actions={[
        {
          label: '취소',
          variant: 'secondary',
          onclick: () => {
            selectedInitialOption = null
          }
        },
        {
          label: '계속',
          variant: 'primary',
          onclick: () => {
            window.dispatchEvent(
              new CustomEvent('initialDataConflict', { detail: selectedInitialOption })
            )
            showInitialConflictDialog = false
            initialConflictData = null
            selectedInitialOption = null
          }
        }
      ]}
    />
  {/if}
{/if}
