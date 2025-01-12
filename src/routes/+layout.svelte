<script lang="ts">
  import '../app.css'
  import { page } from '$app/stores'

  let { children } = $props()
</script>

<svelte:head>
  <meta property="og:image" content="{$page.url.origin}/og-image.png" />
</svelte:head>

<div class="h-screen font-sans">
  {@render children()}
</div>
