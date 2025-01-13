<script lang="ts">
  import '../app.css'
  import { page } from '$app/stores'
  import { browser } from '$app/environment'

  let { children } = $props()

  const isStandalone = browser && window.matchMedia('(display-mode: standalone)').matches
</script>

<svelte:head>
  <meta property="og:image" content="{$page.url.origin}/og-image.png" />
</svelte:head>

<div class="{isStandalone ? 'h-screen' : 'h-dscreen'} font-sans">
  {@render children()}
</div>
