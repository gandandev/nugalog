<script lang="ts">
  import '../app.css'
  let { children } = $props()

  import Sidebar from '$lib/components/Sidebar.svelte'
</script>

<div class="flex h-screen font-sans">
  <Sidebar />
  {@render children()}
</div>
