<script lang="ts">
  import { data } from '$lib/stores'

  import InfoDisplay from '$lib/components/InfoDisplay.svelte'

  import HowToReg from '~icons/material-symbols/how-to-reg-rounded'
  import GroupAdd from '~icons/material-symbols/group-add-rounded'
</script>

{#if $data.length}
  <InfoDisplay
    Icon={HowToReg}
    title="학생을 선택하세요"
    description="학생 목록에서 원하는 학생을 선택해주세요."
  />
{:else}
  <InfoDisplay
    Icon={GroupAdd}
    title="학생을 추가해 시작하세요"
    description="사이드바의 학생 추가 버튼으로 학생을 추가할 수 있습니다."
  />
{/if}
