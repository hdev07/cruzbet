<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { getCachedFlagBlobUrl, resolveFlagSrc } from '@/lib/flagCache'

const props = defineProps<{
  src: string | null | undefined
  alt: string
  imgClass?: string
}>()

const displaySrc = ref<string | null>(null)
let attempt = 0
let activeBlobUrl: string | null = null

function clearBlobUrl() {
  if (activeBlobUrl) {
    URL.revokeObjectURL(activeBlobUrl)
    activeBlobUrl = null
  }
}

function resetSrc() {
  clearBlobUrl()
  attempt = 0
  displaySrc.value = resolveFlagSrc(props.src)
}

watch(() => props.src, resetSrc, { immediate: true })

async function onError() {
  attempt += 1
  const remote = props.src?.trim()
  if (!remote) return

  if (attempt === 1 && displaySrc.value?.startsWith('/flags/')) {
    displaySrc.value = remote
    return
  }

  if (attempt === 2) {
    const cached = await getCachedFlagBlobUrl(remote)
    if (cached) {
      clearBlobUrl()
      activeBlobUrl = cached
      displaySrc.value = cached
    }
  }
}

onBeforeUnmount(clearBlobUrl)
</script>

<template>
  <img
    v-if="displaySrc"
    :src="displaySrc"
    :alt="alt"
    :class="imgClass"
    loading="lazy"
    decoding="async"
    @error="onError"
  />
</template>
