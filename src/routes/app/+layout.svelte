<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import type { PageData } from './$types'
  import { type User } from '@supabase/supabase-js'
  import { scale, fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
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

  import ContentCopy from '~icons/material-symbols/content-copy-rounded'
  import Settings from '~icons/material-symbols/settings-rounded'
  import Logout from '~icons/material-symbols/logout-rounded'
  import Download from '~icons/material-symbols/download-rounded'
  import FileOpen from '~icons/material-symbols/file-open-rounded'
  import DeleteForever from '~icons/material-symbols/delete-forever-rounded'
  import Check from '~icons/material-symbols/check-rounded'

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
        bind:this={settingsButton}
        class="relative flex h-8 w-8 items-center justify-center rounded-full duration-150 hover:bg-stone-100 active:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:active:bg-transparent dark:hover:bg-stone-800 dark:active:bg-stone-700"
        onclick={() => {
          const text = formatStudentLogs(student.name, student.logs)
          navigator.clipboard.writeText(text)
          handleSingleCopy()
        }}
        disabled={!student?.logs.length}
        use:tooltip={{
          text: student
            ? student.logs.length
              ? singleCopied
                ? '복사됨'
                : '기록 전체 복사'
              : '복사할 기록 없음'
            : '복사할 학생 없음',
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
              class="flex items-center gap-2 rounded-md px-3 py-1 duration-150 hover:bg-stone-100 active:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:active:bg-transparent dark:hover:bg-stone-700 dark:active:bg-stone-600"
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
