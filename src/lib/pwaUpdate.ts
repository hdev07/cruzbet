import { ref } from 'vue'

export const pwaNeedRefresh = ref(false)

export let applyPwaUpdate: (() => Promise<void>) | null = null

export function setApplyPwaUpdate(fn: () => Promise<void>) {
  applyPwaUpdate = fn
}
