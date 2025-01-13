<script lang="ts">
  import { scale } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import { onClickOutside } from '$lib/utils/clickOutside'

  import ChevronLeft from '~icons/material-symbols/chevron-left-rounded'
  import ChevronRight from '~icons/material-symbols/chevron-right-rounded'

  const {
    show,
    date,
    button,
    closeMenu,
    onSelect,
    class: className = ''
  }: {
    show: boolean
    date: Date | null
    button: HTMLElement | null
    closeMenu: () => void
    onSelect: (date: Date) => void
    class?: string
  } = $props()

  let currentMonth = $state(date?.getMonth() ?? new Date().getMonth())
  let currentYear = $state(date?.getFullYear() ?? new Date().getFullYear())
  let selectedDate = $state(date)

  $effect(() => {
    if (date) {
      selectedDate = date
      currentMonth = date.getMonth()
      currentYear = date.getFullYear()
    }
  })

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
  }

  function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay()
  }

  function generateCalendarDays() {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const days: (number | null)[] = Array(firstDay).fill(null)

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    while (days.length % 7 !== 0) {
      days.push(null)
    }

    return days
  }

  function isToday(day: number) {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    )
  }

  function isSelected(day: number) {
    return (
      selectedDate?.getDate() === day &&
      selectedDate?.getMonth() === currentMonth &&
      selectedDate?.getFullYear() === currentYear
    )
  }

  function handleDateSelect(day: number) {
    const newDate = new Date(currentYear, currentMonth, day)
    selectedDate = newDate
    onSelect(newDate)
    closeMenu()
  }

  function navigateMonth(delta: number) {
    let newMonth = currentMonth + delta
    let newYear = currentYear

    if (newMonth > 11) {
      newMonth = 0
      newYear++
    } else if (newMonth < 0) {
      newMonth = 11
      newYear--
    }

    currentMonth = newMonth
    currentYear = newYear
  }

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
</script>

{#if show}
  <div
    class="absolute left-0 top-full z-50 flex w-72 origin-top-left flex-col rounded-lg border border-stone-200 bg-white p-3 shadow-lg dark:border-stone-700 dark:bg-stone-800 {className}"
    transition:scale|local={{ duration: 200, start: 0.9, easing: expoOut }}
    use:onClickOutside={{
      callback: closeMenu,
      exclude: [button]
    }}
  >
    <!-- 년/월 선택 -->
    <div class="mb-2 flex items-center justify-between px-1">
      <button
        class="flex h-8 w-8 items-center justify-center rounded-lg duration-150 hover:bg-stone-100 active:bg-stone-200 dark:hover:bg-stone-700 dark:active:bg-stone-600"
        onclick={() => navigateMonth(-1)}
      >
        <ChevronLeft class="h-5 w-5" />
      </button>
      <span class="font-medium">
        {currentYear}년 {currentMonth + 1}월
      </span>
      <button
        class="flex h-8 w-8 items-center justify-center rounded-lg duration-150 hover:bg-stone-100 active:bg-stone-200 dark:hover:bg-stone-700 dark:active:bg-stone-600"
        onclick={() => navigateMonth(1)}
      >
        <ChevronRight class="h-5 w-5" />
      </button>
    </div>

    <!-- 요일 -->
    <div class="mb-1 grid grid-cols-7 text-center text-sm text-stone-500 dark:text-stone-400">
      {#each weekdays as day}
        <div class="h-8 leading-8">{day}</div>
      {/each}
    </div>

    <!-- 달력 -->
    <div class="grid grid-cols-7 gap-1">
      {#each generateCalendarDays() as day}
        {#if day === null}
          <div class="h-8"></div>
        {:else}
          <button
            class="flex h-8 w-8 items-center justify-center rounded-full duration-150 hover:bg-stone-100 active:bg-stone-200 dark:hover:bg-stone-700 dark:active:bg-stone-600"
            class:bg-stone-100={isToday(day) && !isSelected(day)}
            class:hover:bg-stone-200={isToday(day) && !isSelected(day)}
            class:dark:bg-stone-700={isToday(day) && !isSelected(day)}
            class:hover:dark:bg-stone-600={isToday(day) && !isSelected(day)}
            class:bg-stone-900={isSelected(day)}
            class:hover:bg-stone-800={isSelected(day)}
            class:dark:bg-stone-200={isSelected(day)}
            class:dark:hover:bg-stone-200={isSelected(day)}
            class:text-white={isSelected(day)}
            class:dark:text-stone-900={isSelected(day)}
            onclick={() => handleDateSelect(day)}
          >
            {day}
          </button>
        {/if}
      {/each}
    </div>
  </div>
{/if}
