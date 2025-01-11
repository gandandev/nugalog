export function useCopyFeedback(callback: (copied: boolean) => void) {
  let lastCopied = 0

  return () => {
    const now = new Date().getTime()
    lastCopied = now
    callback(true)
    setTimeout(() => {
      // lastCopied가 바뀌지 않았다면 그 사이 복사된 것이 아니므로 초기화
      if (lastCopied === now) {
        callback(false)
      }
    }, 1000)
  }
}
