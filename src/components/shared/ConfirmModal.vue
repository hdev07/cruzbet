<script setup lang="ts">
import { AlertCircle, X } from '@lucide/vue'
import type { RuleAlertSection } from '@/constants/base-quiniela-rules'

defineProps<{
  open: boolean
  title: string
  subtitle?: string
  sections?: readonly RuleAlertSection[]
  bullets?: readonly string[]
  confirmLabel: string
  cancelLabel?: string
  saving?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Cerrar"
        :disabled="saving"
        @click="emit('cancel')"
      />

      <div
        class="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-mundial-accent/30 bg-mundial-dark shadow-2xl"
      >
        <div class="shrink-0 border-b border-white/10 px-4 py-4">
          <button
            type="button"
            class="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            :disabled="saving"
            aria-label="Cerrar"
            @click="emit('cancel')"
          >
            <X class="h-4 w-4" />
          </button>

          <div class="flex items-start gap-3 pr-8">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mundial-accent/20 text-mundial-accent"
            >
              <AlertCircle class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-100">{{ title }}</h3>
              <p v-if="subtitle" class="mt-1 text-sm text-slate-400">{{ subtitle }}</p>
            </div>
          </div>
        </div>

        <div class="app-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <template v-if="sections?.length">
            <section
              v-for="section in sections"
              :key="section.title"
              class="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <h4 class="mb-2 text-sm font-bold text-mundial-accent">{{ section.title }}</h4>
              <ul class="space-y-2 text-sm text-slate-300">
                <li v-for="bullet in section.bullets" :key="bullet" class="flex gap-2">
                  <span class="shrink-0">✅</span>
                  <span>{{ bullet }}</span>
                </li>
              </ul>
            </section>
          </template>

          <ul v-else-if="bullets?.length" class="space-y-2 text-sm text-slate-300">
            <li v-for="bullet in bullets" :key="bullet" class="flex gap-2">
              <span class="shrink-0">✅</span>
              <span>{{ bullet }}</span>
            </li>
          </ul>
        </div>

        <div
          class="flex shrink-0 flex-col-reverse gap-2 border-t border-white/10 bg-slate-900 px-4 py-4 sm:flex-row sm:justify-end"
        >
          <button
            type="button"
            class="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50"
            :disabled="saving"
            @click="emit('cancel')"
          >
            {{ cancelLabel ?? 'Espera, quiero cambiar algo' }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-mundial-accent px-4 py-2.5 text-sm font-bold text-mundial-dark hover:bg-mundial-accent/90 disabled:opacity-50"
            :disabled="saving"
            @click="emit('confirm')"
          >
            {{ saving ? 'Guardando...' : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
