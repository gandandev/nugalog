<script lang="ts">
  import Logo from '$lib/components/Logo.svelte'

  import NorthEast from '~icons/material-symbols/north-east-rounded'
  import GitHub from '~icons/simple-icons/github'
</script>

<div class="flex min-h-dscreen flex-col items-center px-5 pt-16">
  <!-- 히어로 -->
  <div class="flex flex-col items-center text-center">
    <Logo class="w-64 dark:text-white" variant="withicon" />
    <h1 class="mt-6 text-4xl font-bold">간편한 누가기록 관리</h1>
    <p class="mt-4 text-lg text-stone-600 dark:text-stone-400">
      나이스 로그인 없이 어디서든 누가기록을 손쉽게 작성하세요
    </p>
  </div>

  <!-- 버튼 -->
  <div class="mt-6 flex gap-4">
    <a
      href="/app"
      class="flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-medium text-white duration-150 hover:bg-stone-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-stone-200"
    >
      시작하기
      <NorthEast class="h-5 w-5" />
    </a>
    <a
      href="https://github.com/gandandev/nugalog"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-6 py-3 font-medium text-black duration-150 hover:bg-stone-100 active:scale-95 dark:border-stone-800 dark:bg-stone-900 dark:text-white dark:hover:bg-stone-800"
    >
      <GitHub class="h-5 w-5" />
      GitHub
    </a>
  </div>

  <!-- 스크린샷 -->
  <div class="mt-12 w-full max-w-4xl">
    <img
      src="screenshot.png"
      alt="앱 스크린샷"
      class="dark:hidden w-full border dark:border-stone-800 shadow-lg rounded-xl"
    />
    <img
      src="screenshot-dark.png"
      alt="앱 스크린샷"
      class="hidden dark:block w-full border dark:border-stone-800 shadow-lg rounded-xl"
    />
  </div>

  <footer class="my-12 flex items-center justify-center gap-5 text-stone-600 dark:text-stone-400">
    <a
      href="https://github.com/gandandev"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-2 hover:text-stone-700 dark:hover:text-stone-300 hover:underline"
    >
      <GitHub class="h-5 w-5" />@gandandev
    </a>
    <span>Jan 2025</span>
  </footer>
</div>
