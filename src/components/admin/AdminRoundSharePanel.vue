<script setup lang="ts">
import { computed, ref } from 'vue'
import { Download, ImageDown, Loader2, Share2 } from '@lucide/vue'
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

const props = defineProps<{
  round: BaseQuinielaRound
  roundMatches: BaseQuinielaRoundMatch[]
  mobile?: boolean
}>()

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
    // Deja aplicar estilos de captura (sin sticky/overflow)
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
</script>

<template>
  <section
    class="flex min-h-0 flex-col overflow-hidden"
    :class="
      mobile
        ? 'h-full rounded-none border-0 bg-transparent'
        : 'theme-card h-full'
    "
  >
    <header class="admin-panel-header space-y-3">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="font-semibold text-app-text">Compartir tabla</h2>
          <p class="mt-1 text-xs text-slate-500">
            Genera una imagen de la tabla comparativa para mandarla a quien no entra a la app.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-mundial-accent px-4 py-2.5 text-sm font-bold text-mundial-dark hover:bg-mundial-accent/90 disabled:opacity-50"
          :disabled="exporting"
          @click="exportTableImage"
        >
          <Loader2 v-if="exporting" class="h-4 w-4 animate-spin" />
          <Share2 v-else class="h-4 w-4" />
          {{ exporting ? 'Generando...' : 'Exportar imagen' }}
        </button>
      </div>

      <p v-if="exportStatus" class="text-xs text-mundial-green">{{ exportStatus }}</p>
      <p v-if="exportError" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
        {{ exportError }}
      </p>
    </header>

    <div class="app-scrollbar admin-panel-body">
      <p class="mb-3 flex items-center gap-2 text-xs text-slate-500">
        <ImageDown class="h-3.5 w-3.5 shrink-0 text-mundial-accent" />
        Vista previa de lo que se exporta. En móvil puedes compartir directo.
      </p>

      <div
        ref="exportRoot"
        class="admin-share-export mx-auto w-max max-w-none rounded-2xl border border-white/10 bg-[#071426] p-4 text-slate-100 shadow-xl"
      >
        <header class="mb-4 flex items-end justify-between gap-4 border-b border-white/10 pb-3">
          <div class="min-w-0">
            <p class="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#f5b942]">
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
  </section>
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
