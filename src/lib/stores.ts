import { writable } from 'svelte/store'

export interface StudentData {
  name: string
  logs: Log[]
}

export interface Log {
  date: Date
  content: string
}

export const data = writable<StudentData[]>([
  {
    name: '김민준',
    logs: [
      {
        date: new Date('2024-01-15'),
        content: '수학 수행평가에서 우수한 성적을 거둠. 문제 해결 능력이 뛰어남.'
      },
      {
        date: new Date('2024-01-14'), 
        content: '과학 실험 활동에 적극적으로 참여하며 조원들과 협력하는 모습이 인상적임.'
      }
    ]
  },
  {
    name: '이서연',
    logs: [
      {
        date: new Date('2024-01-15'),
        content: '교내 합창대회에서 솔로 파트를 맡아 훌륭히 수행함.'
      },
      {
        date: new Date('2024-01-13'),
        content: '영어 말하기 대회에서 우수상을 수상함. 발음이 정확하고 자신감 있게 발표함.'
      }
    ]
  },
  {
    name: '박지호',
    logs: [
      {
        date: new Date('2024-01-15'),
        content: '체육대회 농구 경기에서 팀워크를 발휘하여 우승에 기여함.'
      },
      {
        date: new Date('2024-01-12'),
        content: '친구들 사이에서 갈등이 있을 때 중재자 역할을 잘 수행함.'
      }
    ]
  }
])
