<script lang="ts">
  import Log from '$lib/components/Log.svelte'

  import { data } from '$lib/stores'

  import { page } from '$app/stores'

  let student = $derived($data.find(s => s.name === decodeURIComponent($page.params.name))!)
</script>

<div class="mx-auto min-w-[50%] space-y-1 overflow-y-auto p-12">
  {#each student.logs as log}
    <Log {log} />
  {/each}
</div>
