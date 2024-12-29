<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import type { PageData } from './$types'
  import { type User } from '@supabase/supabase-js'
  import { scale } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import { data as dataStore, dataLoaded, type Student, showTooltip } from '$lib/stores'
  import { onClickOutside, tooltip } from '$lib/utils'
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

  import Settings from '~icons/mdi/settings'
  import Logout from '~icons/mdi/logout'
  import DeleteForever from '~icons/mdi/delete-forever'

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
    $showTooltip = true
  }

  // 계정 옵션
  let showAccountOptions = $state(false)
  let accountButton: HTMLButtonElement | null = $state(null)
  let accountOptions: HTMLDivElement | null = $state(null)
  let logoutButton: HTMLButtonElement | null = $state(null)
  function closeAccountOptions() {
    showAccountOptions = false
  }

  // 설정
  let showSettings = $state(false)
  let settingsButton: HTMLButtonElement | null = $state(null)

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
    <div class="sticky inset-x-0 top-0 flex items-center justify-end gap-3 p-4">
      {#if !currentUser && $dataStore.reduce((acc, student) => acc + student.logs.length, 0) >= 3 && $showTooltip}
        <button
          class="origin-right text-stone-500 hover:text-stone-600 dark:hover:text-stone-400"
          onclick={() => {
            $showTooltip = false
          }}
          transition:scale={{ duration: 150, start: 0.9 }}
          use:tooltip={{ text: '클릭해서 닫기', position: 'bottom', delay: 0 }}
        >
          로그인 후 여러 기기에서 작업해보세요
        </button>
      {/if}

      <div class="relative">
        <button
          bind:this={settingsButton}
          class="flex h-8 w-8 items-center justify-center rounded-full duration-150 hover:bg-stone-100 dark:hover:bg-stone-800"
          onclick={() => (showSettings = !showSettings)}
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
              class="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-stone-100 hover:text-red-600 dark:hover:bg-stone-700 dark:hover:text-red-500"
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
