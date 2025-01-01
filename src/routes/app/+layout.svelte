<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import type { PageData } from './$types'
  import { type User } from '@supabase/supabase-js'
  import { scale, fly, slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import autosize from 'svelte-autosize'
  import dedent from 'dedent'
  import {
    data as dataStore,
    dataLoaded,
    type Student,
    parseStudentArray,
    showTooltip
  } from '$lib/stores'
  import {
    onClickOutside,
    tooltip,
    formatStudentLogs,
    formatAllStudentLogs,
    useCopyFeedback
  } from '$lib/utils'
  import {
    loadDataFromDb,
    saveDataToDb,
    loadDataFromLocalStorage,
    handleInitialDataConflict,
    eraseAllData
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

  import Assignment from '~icons/material-symbols/assignment-rounded'
  import ContentCopy from '~icons/material-symbols/content-copy-rounded'
  import Settings from '~icons/material-symbols/settings-rounded'
  import Logout from '~icons/material-symbols/logout-rounded'
  import Download from '~icons/material-symbols/download-rounded'
  import FileOpen from '~icons/material-symbols/file-open-rounded'
  import DeleteForever from '~icons/material-symbols/delete-forever-rounded'
  import Check from '~icons/material-symbols/check-rounded'
  import Close from '~icons/material-symbols/close-rounded'
  import KeyboardArrowDown from '~icons/material-symbols/keyboard-arrow-down-rounded'

  let { data, children }: { data: PageData; children: any } = $props()

  const student = $derived(
    $dataStore.find((s) => s.name === decodeURIComponent($page.params.name))!
  )

  let currentUser: User | null = $state(null)

  // 복사 피드백
  let singleCopied = $state(false)
  let allCopied = $state(false)
  const handleSingleCopy = useCopyFeedback((isCopied) => (singleCopied = isCopied))
  const handleAllCopy = useCopyFeedback((isCopied) => (allCopied = isCopied))

  // 충돌 감지 및 해결에 사용
  let showConflictDialog = $state(false)
  let conflictData: ConflictData | null = $state(null)

  let showInitialConflictDialog = $state(false)
  let initialConflictData: { dbData: Student[]; localData: Student[] } | null = $state(null)
  let selectedInitialOption: 'useLocal' | 'useDB' | null = $state(null)

  // 행발 작성 패널
  let showHangbalPanel = $state(true) // FIXME: 임시
  let showOutputExample = $state(false)
  let outputExample = $state('')
  const hangbalPrompt = $derived(
    student
      ? dedent(`
    행발을 작성하세요.

    ### 기록
    ${formatStudentLogs(student.name, student.logs)}${outputExample ? `\n\n### 예시\n${outputExample}` : ''}
  `)
      : ''
  ) // FIXME: 임시

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
      $showTooltip = true
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
  let logoutButton: HTMLButtonElement | null = $state(null)
  function closeAccountOptions() {
    showAccountOptions = false
  }

  // 설정
  let showSettings = $state(false)
  let settingsButton: HTMLButtonElement | null = $state(null)

  // 데이터 다운로드
  function saveDataToFile() {
    const data = JSON.stringify($dataStore, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 데이터 불러오기
  let loadDataResultDialogState: 'closed' | 'conflict' | 'success' | 'error' = $state('closed')
  let dataFromFile: Student[] | null = $state(null)
  function loadDataFromFile() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string)
          const result = parseStudentArray(content)
          if (!result.success) {
            console.error('Invalid data format:', result.error)
            loadDataResultDialogState = 'error'
            return
          }

          dataFromFile = result.data

          if ($dataStore.length > 0) {
            loadDataResultDialogState = 'conflict'
          } else {
            $dataStore = dataFromFile
            loadDataResultDialogState = 'success'
          }
        } catch (err) {
          console.error('Failed to parse file:', err)
          loadDataResultDialogState = 'error'
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // 데이터 삭제
  let showEraseDataDialogState:
    | 'closed'
    | 'confirm'
    | 'reconfirm'
    | 'confirmLogout'
    | 'complete'
    | 'error' = $state('closed')
  let eraseDataConfirmationInput = $state('')

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
    <div class="sticky inset-x-0 top-0 flex items-center justify-end gap-1 p-4">
      {#if !currentUser && $dataStore.reduce((acc, student) => acc + student.logs.length, 0) >= 3 && $showTooltip}
        <button
          class="origin-right text-stone-500 hover:text-stone-600 dark:hover:text-stone-400"
          onclick={() => {
            $showTooltip = false
          }}
          transition:scale={{ duration: 150, start: 0.9 }}
          use:tooltip={{ text: '클릭해서 숨기기', position: 'bottom', delay: 0 }}
        >
          로그인 후 여러 기기에서 작업해보세요
        </button>
      {/if}

      <button
        class="flex h-8 w-8 items-center justify-center rounded-full duration-150 hover:bg-stone-100 active:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:active:bg-transparent dark:hover:bg-stone-800 dark:active:bg-stone-700"
        disabled={!student?.logs.length}
        onclick={() => (showHangbalPanel = true)}
        use:tooltip={{ text: '행발 작성', position: 'bottom' }}
      >
        <Assignment class="h-5 w-5" />
      </button>

      <button
        bind:this={settingsButton}
        class="relative flex h-8 w-8 items-center justify-center rounded-full duration-150 hover:bg-stone-100 active:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:active:bg-transparent dark:hover:bg-stone-800 dark:active:bg-stone-700"
        onclick={() => {
          const text = formatStudentLogs(student.name, student.logs)
          navigator.clipboard.writeText(text)
          handleSingleCopy()
        }}
        disabled={!student?.logs.length}
        use:tooltip={{
          text: singleCopied ? '복사됨' : '기록 전체 복사',
          position: 'bottom'
        }}
      >
        {#if singleCopied}
          <div class="absolute h-5 w-5" transition:scale={{ duration: 150, start: 0.5 }}>
            <Check class="h-5 w-5" />
          </div>
        {:else}
          <div class="absolute h-5 w-5" transition:scale={{ duration: 150, start: 0.5 }}>
            <ContentCopy class="h-5 w-5" />
          </div>
        {/if}
      </button>

      <div class="relative">
        <button
          bind:this={settingsButton}
          class="flex h-8 w-8 items-center justify-center rounded-full duration-150 hover:bg-stone-100 active:bg-stone-200 dark:hover:bg-stone-800 dark:active:bg-stone-700"
          onclick={() => (showSettings = !showSettings)}
          use:tooltip={{ text: '설정', position: 'bottom' }}
        >
          <Settings class="h-5 w-5" />
        </button>
        {#if showSettings}
          <div
            class="absolute -right-2 top-11 z-50 flex w-48 origin-top-right flex-col rounded-xl border border-stone-200 bg-white p-1 shadow-lg dark:border-stone-700 dark:bg-stone-800"
            transition:scale={{ duration: 200, start: 0.9, easing: expoOut }}
            use:onClickOutside={{
              callback: () => (showSettings = false),
              exclude: settingsButton ? [settingsButton] : []
            }}
          >
            <button
              class="flex h-8 items-center gap-2 rounded-md px-3 duration-150 hover:bg-stone-100 active:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:active:bg-transparent dark:hover:bg-stone-700 dark:active:bg-stone-600"
              onclick={() => {
                const text = formatAllStudentLogs($dataStore)
                navigator.clipboard.writeText(text)
                handleAllCopy()
              }}
              disabled={!$dataStore.some((s) => s.logs.length > 0)}
            >
              <div class="relative h-5 w-5">
                {#if allCopied}
                  <div class="absolute h-5 w-5" transition:scale={{ duration: 150, start: 0.5 }}>
                    <Check class="h-5 w-5" />
                  </div>
                {:else}
                  <div class="absolute h-5 w-5" transition:scale={{ duration: 150, start: 0.5 }}>
                    <ContentCopy class="h-5 w-5" />
                  </div>
                {/if}
              </div>
              {#key allCopied}
                <span
                  class="absolute left-11"
                  in:fly={{ duration: 150, x: -10 }}
                  out:fly={{ duration: 150, x: 10 }}
                >
                  {$dataStore.some((s) => s.logs.length > 0)
                    ? allCopied
                      ? '복사됨'
                      : '모든 기록 복사'
                    : '복사할 기록 없음'}
                </span>
              {/key}
            </button>

            <button
              class="flex items-center gap-2 rounded-md px-3 py-1 duration-150 hover:bg-stone-100 active:bg-stone-200 dark:hover:bg-stone-700 dark:active:bg-stone-600"
              onclick={saveDataToFile}
            >
              <Download class="h-5 w-5" />
              데이터 다운로드
            </button>

            <button
              class="flex items-center gap-2 rounded-md px-3 py-1 duration-150 hover:bg-stone-100 active:bg-stone-200 dark:hover:bg-stone-700 dark:active:bg-stone-600"
              onclick={loadDataFromFile}
            >
              <FileOpen class="h-5 w-5" />
              데이터 불러오기
            </button>

            <button
              class="flex items-center gap-2 rounded-md px-3 py-1 duration-150 hover:bg-stone-100 hover:text-red-600 active:bg-stone-200 dark:hover:bg-stone-700 dark:hover:text-red-500 dark:active:bg-stone-600"
              onclick={() => {
                eraseDataConfirmationInput = ''
                showEraseDataDialogState = 'confirm'
              }}
            >
              <DeleteForever class="h-5 w-5" />
              데이터 삭제
            </button>
          </div>
        {/if}
      </div>

      <div class="relative z-50 ml-2 h-8">
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
          class="absolute top-14 z-50 mt-1 flex w-48 origin-top-right flex-col rounded-xl border border-stone-200 bg-white p-1 shadow-lg dark:border-stone-700 dark:bg-stone-800"
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

{#if showHangbalPanel}
  <div
    class="fixed inset-y-0 left-64 right-0 z-10 flex items-center justify-center bg-white dark:bg-stone-950"
    transition:fly={{ y: 100, duration: 400, easing: expoOut }}
  >
    <div class="flex max-h-full w-1/2 flex-col justify-between p-5">
      <div class="mb-3 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-semibold">행발 초안 작성</h2>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-full duration-150 hover:bg-stone-100 active:bg-stone-200 dark:hover:bg-stone-800 dark:active:bg-stone-700"
            onclick={() => (showHangbalPanel = false)}
          >
            <Close class="h-5 w-5" />
          </button>
        </div>

        <textarea
          class="grow resize-none rounded-xl bg-stone-100 p-3 outline-none placeholder:text-stone-400 dark:bg-stone-900 dark:placeholder:text-stone-600"
          placeholder="행발 예시를 제공해주세요 (선택)"
          bind:value={outputExample}
          use:autosize
        ></textarea>

        <p class="text-sm text-stone-500 dark:text-stone-400">
          행발 예시 및 학생 기록이 프롬프트에 포함됩니다.<br />
          각 서비스 로그인 후 사용하면 더욱 나은 결과를 얻을 수 있습니다.
        </p>

        <div class="flex justify-end gap-2">
          <button
            class="flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 duration-150 hover:bg-stone-200 active:scale-95 dark:bg-stone-800 dark:hover:bg-stone-700"
            onclick={() => navigator.clipboard.writeText(hangbalPrompt)}
            use:tooltip={{
              text: '다른 AI 서비스에 붙여넣어 사용하세요',
              position: 'bottom',
              delay: 0
            }}
          >
            <ContentCopy class="h-5 w-5" />
            프롬프트 복사
          </button>
          <a
            href="https://claude.ai/new?q={encodeURIComponent(hangbalPrompt)}"
            target="_blank"
            class="flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 duration-150 hover:bg-stone-200 active:scale-95 dark:bg-stone-800 dark:hover:bg-stone-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              class="w-5 fill-[#d97757]"
            >
              <path
                d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z"
              ></path>
            </svg>
            Claude로 계속
          </a>
          <a
            href="https://chatgpt.com?q={encodeURIComponent(hangbalPrompt)}"
            target="_blank"
            class="flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-white duration-150 hover:bg-stone-800 active:scale-95 active:bg-stone-900 dark:bg-stone-100 dark:text-stone-800 dark:enabled:hover:bg-stone-300 dark:enabled:active:bg-stone-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 320 320"
              class="h-5 w-5"
              fill="currentColor"
            >
              <path
                d="m297.06 130.97c7.26-21.79 4.76-45.66-6.85-65.48-17.46-30.4-52.56-46.04-86.84-38.68-15.25-17.18-37.16-26.95-60.13-26.81-35.04-.08-66.13 22.48-76.91 55.82-22.51 4.61-41.94 18.7-53.31 38.67-17.59 30.32-13.58 68.54 9.92 94.54-7.26 21.79-4.76 45.66 6.85 65.48 17.46 30.4 52.56 46.04 86.84 38.68 15.24 17.18 37.16 26.95 60.13 26.8 35.06.09 66.16-22.49 76.94-55.86 22.51-4.61 41.94-18.7 53.31-38.67 17.57-30.32 13.55-68.51-9.94-94.51zm-120.28 168.11c-14.03.02-27.62-4.89-38.39-13.88.49-.26 1.34-.73 1.89-1.07l63.72-36.8c3.26-1.85 5.26-5.32 5.24-9.07v-89.83l26.93 15.55c.29.14.48.42.52.74v74.39c-.04 33.08-26.83 59.9-59.91 59.97zm-128.84-55.03c-7.03-12.14-9.56-26.37-7.15-40.18.47.28 1.3.79 1.89 1.13l63.72 36.8c3.23 1.89 7.23 1.89 10.47 0l77.79-44.92v31.1c.02.32-.13.63-.38.83l-64.41 37.19c-28.69 16.52-65.33 6.7-81.92-21.95zm-16.77-139.09c7-12.16 18.05-21.46 31.21-26.29 0 .55-.03 1.52-.03 2.2v73.61c-.02 3.74 1.98 7.21 5.23 9.06l77.79 44.91-26.93 15.55c-.27.18-.61.21-.91.08l-64.42-37.22c-28.63-16.58-38.45-53.21-21.95-81.89zm221.26 51.49-77.79-44.92 26.93-15.54c.27-.18.61-.21.91-.08l64.42 37.19c28.68 16.57 38.51 53.26 21.94 81.94-7.01 12.14-18.05 21.44-31.2 26.28v-75.81c.03-3.74-1.96-7.2-5.2-9.06zm26.8-40.34c-.47-.29-1.3-.79-1.89-1.13l-63.72-36.8c-3.23-1.89-7.23-1.89-10.47 0l-77.79 44.92v-31.1c-.02-.32.13-.63.38-.83l64.41-37.16c28.69-16.55 65.37-6.7 81.91 22 6.99 12.12 9.52 26.31 7.15 40.1zm-168.51 55.43-26.94-15.55c-.29-.14-.48-.42-.52-.74v-74.39c.02-33.12 26.89-59.96 60.01-59.94 14.01 0 27.57 4.92 38.34 13.88-.49.26-1.33.73-1.89 1.07l-63.72 36.8c-3.26 1.85-5.26 5.31-5.24 9.06l-.04 89.79zm14.63-31.54 34.65-20.01 34.65 20v40.01l-34.65 20-34.65-20z"
              />
            </svg>
            ChatGPT로 계속
          </a>
        </div>
      </div>
    </div>
  </div>
{/if}

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

{#if loadDataResultDialogState === 'conflict'}
  <Dialog
    title="데이터를 덮어쓰시겠습니까?"
    description="데이터를 불러오면 현재 데이터가 사라집니다. 이 작업은 되돌릴 수 없습니다."
    actions={[
      {
        label: '취소',
        variant: 'secondary',
        cancel: true
      },
      {
        label: '덮어쓰기',
        variant: 'primary',
        onclick: () => {
          if (!dataFromFile) return
          $dataStore = dataFromFile
          loadDataResultDialogState = 'success'
        }
      }
    ]}
    cancel={() => (loadDataResultDialogState = 'closed')}
  />
{:else if loadDataResultDialogState === 'success'}
  <Dialog
    title="완료"
    description="데이터를 성공적으로 불러왔습니다."
    actions={[
      {
        label: '닫기',
        variant: 'primary',
        cancel: true
      }
    ]}
    cancel={() => (loadDataResultDialogState = 'closed')}
  />
{:else if loadDataResultDialogState === 'error'}
  <Dialog
    title="불러오기 실패"
    description="데이터를 불러오는 데 실패했습니다. 데이터가 올바른 형식인지 확인해주세요."
    actions={[
      {
        label: '닫기',
        variant: 'primary',
        cancel: true
      }
    ]}
    cancel={() => (loadDataResultDialogState = 'closed')}
  />
{/if}

{#if showEraseDataDialogState === 'confirm'}
  <Dialog
    title="모든 데이터를 삭제하시겠습니까?"
    description="{currentUser
      ? '서버 및 이 기기'
      : '이 기기'}에 저장된 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.{!currentUser
      ? '\n서버에 저장된 정보를 삭제하려면 로그인하세요.'
      : ''}"
    actions={[
      {
        label: '취소',
        variant: 'secondary',
        cancel: true
      },
      {
        label: '삭제',
        variant: 'danger',
        onclick: () => {
          if (eraseDataConfirmationInput !== '데이터 모두 삭제') return
          showEraseDataDialogState = 'reconfirm'
        },
        onenter: true,
        disabled: eraseDataConfirmationInput !== '데이터 모두 삭제'
      }
    ]}
    cancel={() => (showEraseDataDialogState = 'closed')}
  >
    <p class=" text-sm text-stone-500 dark:text-stone-400">
      데이터를 삭제하려면 <span class="select-none font-semibold">데이터 모두 삭제</span>를
      입력하세요.
    </p>
    <input
      type="text"
      bind:value={eraseDataConfirmationInput}
      class="mt-1 w-full rounded-lg bg-stone-100 px-3 py-2 outline-none placeholder:text-stone-400 dark:bg-stone-700"
      placeholder="데이터 모두 삭제"
    />
  </Dialog>
{:else if showEraseDataDialogState === 'reconfirm'}
  <Dialog
    title="정말로 계속하시겠습니까?"
    description="모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
    actions={[
      {
        label: '취소',
        variant: 'secondary',
        cancel: true
      },
      {
        label: '계속',
        variant: 'danger',
        onclick: async () => {
          if (currentUser) {
            showEraseDataDialogState = 'confirmLogout'
          } else {
            await eraseAllData(data.supabase)
            showEraseDataDialogState = 'complete'
          }
        }
      }
    ]}
    cancel={() => (showEraseDataDialogState = 'closed')}
  />
{:else if showEraseDataDialogState === 'confirmLogout'}
  <Dialog
    title="로그아웃하시겠습니까?"
    description="데이터가 모두 삭제되고 로그아웃됩니다."
    actions={[
      {
        label: '취소',
        variant: 'secondary',
        cancel: true
      },
      {
        label: '데이터만 삭제',
        variant: 'danger',
        onclick: () => {
          eraseAllData(data.supabase)
            .then(() => {
              showEraseDataDialogState = 'complete'
            })
            .catch(() => {
              showEraseDataDialogState = 'error'
            })
        }
      },
      {
        label: '삭제 및 로그아웃',
        variant: 'danger',
        onclick: () => {
          eraseAllData(data.supabase, true)
            .then(() => {
              showEraseDataDialogState = 'complete'
            })
            .catch(() => {
              showEraseDataDialogState = 'error'
            })
        }
      }
    ]}
    cancel={() => (showEraseDataDialogState = 'closed')}
  />
{:else if showEraseDataDialogState === 'complete'}
  <Dialog
    title="완료"
    description="모든 데이터가 삭제되었습니다."
    actions={[
      {
        label: '닫기',
        variant: 'primary',
        cancel: true
      }
    ]}
    cancel={() => (showEraseDataDialogState = 'closed')}
  />
{:else if showEraseDataDialogState === 'error'}
  <Dialog
    title="삭제 실패"
    description="데이터 삭제에 실패했습니다."
    actions={[
      {
        label: '다시 시도',
        variant: 'primary',
        onclick: () => {
          showEraseDataDialogState = 'closed'

          // 재시도되는 효과를 위해 다이얼로그가 닫히고 조금 후 결과 표시
          setTimeout(() => {
            eraseAllData(data.supabase, true)
              .then(() => {
                showEraseDataDialogState = 'complete'
              })
              .catch(() => {
                showEraseDataDialogState = 'error'
              })
          }, 200)
        }
      },
      {
        label: '닫기',
        variant: 'secondary',
        cancel: true
      }
    ]}
    cancel={() => (showEraseDataDialogState = 'closed')}
  />
{/if}
