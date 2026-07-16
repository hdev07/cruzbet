<script setup lang="ts">
defineProps<{
  verified: boolean
  compact?: boolean
}>()
</script>

<template>
  <span
    class="inline-flex items-center rounded-md font-semibold"
    :class="[
      compact ? 'px-1.5 py-0.5 text-[0.6rem]' : 'px-2 py-0.5 text-[0.65rem]',
      verified
        ? 'bg-mundial-green/20 text-mundial-green'
        : 'bg-amber-500/20 text-amber-200',
    ]"
  >
    {{ verified ? 'Pagado' : 'Pago no verificado' }}
  </span>
</template>
