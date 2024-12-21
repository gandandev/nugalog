<script lang="ts">
  import { page } from '$app/stores'
  import type { PageData } from './$types'

  import Logo from '$lib/components/Logo.svelte'

  let { data }: { data: PageData } = $props()

  function signInWithGoogle() {
    data.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${$page.url.origin}/auth/callback?next=/app`
      }
    })
  }
</script>

<div class="flex h-screen flex-col items-center justify-center">
  <div class="flex flex-col items-center justify-center gap-4">
    <Logo class="text-4xl" />
    <button
      class="flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 duration-150 hover:bg-stone-200 active:scale-95 dark:bg-stone-800 dark:hover:bg-stone-700"
      onclick={signInWithGoogle}
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
        alt="Google 로고"
      />
      구글로 계속하기
    </button>
  </div>
</div>
