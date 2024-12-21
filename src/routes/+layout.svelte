<script lang="ts">
  import '../app.css'

  let { children } = $props()
</script>

<div class="h-screen font-sans">
  {@render children()}
</div>
