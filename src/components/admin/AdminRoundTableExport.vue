<script setup lang="ts">
import { computed, ref } from 'vue'
import { Download, Loader2, Share2 } from '@lucide/vue'
import BaseRoundPredictionsMatrix from '@/components/ranking/BaseRoundPredictionsMatrix.vue'
import {
  APP_NAME,
  APP_TAGLINE,
  APP_URL,
  THEME_COLOR,
} from '@/constants/branding'
import {
  buildExportFilename,
  exportElementToPng,
  shareOrDownloadPng,
} from '@/lib/exportElementImage'
import type { BaseQuinielaRound, BaseQuinielaRoundMatch } from '@/types'

const props = withDefaults(
  defineProps<{
    round: BaseQuinielaRound
    roundMatches: BaseQuinielaRoundMatch[]
    /** Título corto encima del botón (p. ej. en Usuarios). */
    heading?: string
    /** Si es false, solo muestra el botón (la card de export queda oculta). */
    preview?: boolean
  }>(),
  {
    heading: 'Tabla comparativa',
    preview: true,
  },
)

const exportRoot = ref<HTMLElement | null>(null)
const exporting = ref(false)
const exportError = ref('')
const exportStatus = ref('')

const updatedLabel = computed(() => {
  const now = new Date()
  return now.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
})

const shareTitle = computed(
  () => `${APP_NAME} · ${props.round.title} · Tabla comparativa`,
)

async function exportTableImage() {
  if (!exportRoot.value || exporting.value) return
  exporting.value = true
  exportError.value = ''
  exportStatus.value = ''
  exportRoot.value.classList.add('is-exporting')

  try {
    await new Promise((r) => requestAnimationFrame(() => r(null)))

    const { dataUrl, filename } = await exportElementToPng(exportRoot.value, {
      filename: buildExportFilename([APP_NAME, props.round.title, 'tabla']),
      backgroundColor: THEME_COLOR,
      pixelRatio: 2,
    })

    const result = await shareOrDownloadPng(dataUrl, filename, shareTitle.value)
    exportStatus.value =
      result === 'shared'
        ? 'Imagen compartida.'
        : 'Imagen descargada. Ya puedes enviarla por WhatsApp o redes.'
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      exportStatus.value = 'Compartir cancelado.'
    } else {
      exportError.value =
        err instanceof Error ? err.message : 'No se pudo generar la imagen'
    }
  } finally {
    exportRoot.value?.classList.remove('is-exporting')
    exporting.value = false
  }
}

defineExpose({ exportTableImage, exporting })
</script>

<template>
  <div :class="preview ? 'space-y-3' : ''">
    <div
      class="flex flex-wrap items-center gap-2"
      :class="preview ? 'justify-between' : 'justify-end'"
    >
      <div v-if="preview" class="min-w-0">
        <h3 class="text-sm font-semibold text-app-text">{{ heading }}</h3>
        <p class="mt-0.5 text-xs text-slate-500">
          Exporta la imagen lista para WhatsApp o redes.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-2 rounded-xl bg-mundial-accent px-3.5 py-2 text-sm font-bold text-mundial-dark hover:bg-mundial-accent/90 disabled:opacity-50"
        :disabled="exporting"
        @click="exportTableImage"
      >
        <Loader2 v-if="exporting" class="h-4 w-4 animate-spin" />
        <Share2 v-else class="h-4 w-4" />
        {{ exporting ? 'Generando...' : 'Exportar imagen' }}
      </button>
    </div>

    <p v-if="exportStatus" class="mt-2 text-xs text-mundial-green">{{ exportStatus }}</p>
    <p v-if="exportError" class="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ exportError }}
    </p>

    <div
      ref="exportRoot"
      class="admin-share-export w-max max-w-none rounded-2xl border border-white/10 bg-[#151515] p-4 text-slate-100 shadow-xl"
      :class="preview ? '' : 'pointer-events-none fixed left-[-10000px] top-0'"
      :aria-hidden="preview ? undefined : 'true'"
    >
      <header class="mb-4 flex items-end justify-between gap-4 border-b border-white/10 pb-3">
        <div class="min-w-0">
          <p class="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#00c3b4]">
            {{ APP_NAME }}
          </p>
          <h3 class="mt-1 text-lg font-bold leading-tight text-white">
            {{ round.title }}
          </h3>
          <p class="mt-0.5 text-xs text-slate-400">{{ APP_TAGLINE }} · Tabla comparativa</p>
        </div>
        <div class="shrink-0 text-right">
          <p class="text-[0.65rem] uppercase tracking-wider text-slate-500">Actualizado</p>
          <p class="text-xs font-medium tabular-nums text-slate-300">{{ updatedLabel }}</p>
        </div>
      </header>

      <BaseRoundPredictionsMatrix
        :round-id="round.id"
        :round-matches="roundMatches"
        hide-intro
        export-layout
      />

      <footer class="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-[0.65rem] text-slate-500">
        <span>{{ APP_URL.replace(/^https?:\/\//, '') }}</span>
        <span class="inline-flex items-center gap-1 text-slate-400">
          <Download class="h-3 w-3" />
          Resultados al momento
        </span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.admin-share-export.is-exporting :deep(.theme-table-wrap) {
  overflow: visible !important;
  border-radius: 0.75rem;
}

.admin-share-export.is-exporting :deep(.theme-table-sticky),
.admin-share-export.is-exporting :deep(.sticky) {
  position: static !important;
  left: auto !important;
}
</style>
