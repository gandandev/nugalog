<script lang="ts">
  import Log from '$lib/components/Log.svelte'
</script>

<div class="mx-auto min-w-[50%] space-y-1 overflow-y-auto p-12">
  {#each [{ date: new Date('2024-01-11'), content: '자신보다 남을 더 중요시하는 경향이 있음.' }, { date: new Date('2024-01-12'), content: '친구들과 항상 사이좋게 지내고 자신이 맡은 일을 충실히 실행하며 친구들에게 좋은 영향을 주고 있음.' }, { date: new Date('2024-01-13'), content: '체육 대회에 출전하여 이어달리기와 축구에서 뛰어난 실력을 보이며, 친구와 좋은 관계를 유지하고 있음.' }, { date: new Date('2024-01-14'), content: '학교 생활 및 지도에 어려움을 느꼈으나 지속적인 상담을 통해 긍정적인 태도를 보이려 노력하고 있음.' }, { date: new Date('2024-01-15'), content: '친구와 다툼이 있었음. 남아서 상담받음.' }] as log}
    <Log {log} />
  {/each}
</div>
