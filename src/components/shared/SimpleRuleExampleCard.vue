<script setup lang="ts">
import type { SimpleRuleExample } from '@/constants/quiniela-rules'
import { ArrowDown } from '@lucide/vue'

defineProps<{
  example: SimpleRuleExample
  compact?: boolean
}>()
</script>

<template>
  <article
    class="rounded-2xl border border-white/10 bg-white/5"
    :class="compact ? 'p-3' : 'p-4 sm:p-5'"
  >
    <h4
      class="font-bold text-slate-100"
      :class="compact ? 'text-sm' : 'text-base'"
    >
      {{ example.emoji ? `${example.emoji} ` : '' }}{{ example.title }}
    </h4>

    <div class="mt-3 space-y-2" :class="compact ? 'text-xs' : 'text-sm'">
      <div class="rounded-xl bg-blue-500/10 px-3 py-2.5 border border-blue-500/20">
        <p class="text-[11px] font-bold uppercase tracking-wide text-blue-300">Tú dijiste</p>
        <p class="mt-1 text-slate-200">{{ example.youSaid }}</p>
      </div>

      <div class="flex justify-center text-slate-600">
        <ArrowDown class="h-4 w-4" />
      </div>

      <div class="rounded-xl bg-amber-500/10 px-3 py-2.5 border border-amber-500/20">
        <p class="text-[11px] font-bold uppercase tracking-wide text-amber-300">En el partido pasó esto</p>
        <p class="mt-1 text-slate-200">{{ example.whatHappened }}</p>
      </div>

      <div class="flex justify-center text-slate-600">
        <ArrowDown class="h-4 w-4" />
      </div>

      <div class="rounded-xl bg-mundial-green/15 px-3 py-2.5 border border-mundial-green/30">
        <p class="text-[11px] font-bold uppercase tracking-wide text-mundial-green">Entonces ganas</p>
        <p class="mt-1 font-bold text-mundial-green">{{ example.youGet }}</p>
      </div>

      <p
        v-if="example.extra"
        class="rounded-lg bg-white/5 px-3 py-2 text-slate-400"
        :class="compact ? 'text-xs' : 'text-sm'"
      >
        💡 {{ example.extra }}
      </p>
    </div>
  </article>
</template>
