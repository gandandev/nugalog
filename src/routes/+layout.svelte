<script lang="ts">
  import '../app.css'

  import Sidebar from '$lib/components/Sidebar.svelte'

  let { children } = $props()
</script>

<div class="flex h-screen font-sans">
  <Sidebar />
  {@render children()}
</div>
