<script setup lang="ts">
import { computed, ref } from 'vue'
import { CheckCircle2, Loader2, ReceiptText, Upload } from '@lucide/vue'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

const props = defineProps<{
  roundId: string
  userId: string
}>()

const baseStore = useBaseQuinielaStore()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const error = ref<string | null>(null)
const justUploaded = ref(false)

const submission = computed(() => baseStore.mySubmission)
const verified = computed(() => submission.value?.verified === true)
const hasReceipt = computed(() => !!submission.value?.receipt_path)

function openPicker() {
  error.value = null
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  error.value = null
  uploading.value = true
  try {
    await baseStore.uploadPaymentReceipt(props.roundId, props.userId, file)
    justUploaded.value = true
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'No se pudo subir el comprobante'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div
    class="rounded-xl border p-4"
    :class="
      verified
        ? 'border-mundial-green/30 bg-mundial-green/10'
        : hasReceipt
          ? 'border-mundial-accent/30 bg-mundial-accent/10'
          : 'border-amber-400/30 bg-amber-400/10'
    "
  >
    <div v-if="verified" class="flex items-center gap-2">
      <CheckCircle2 class="h-5 w-5 shrink-0 text-mundial-green" />
      <p class="text-sm font-semibold text-mundial-green">
        Pago verificado. Estás dentro del pozo. 🎉
      </p>
    </div>

    <template v-else>
      <div class="flex items-start gap-3">
        <ReceiptText
          class="mt-0.5 h-5 w-5 shrink-0"
          :class="hasReceipt ? 'text-mundial-accent' : 'text-amber-300'"
        />
        <div class="min-w-0 flex-1">
          <p
            class="text-sm font-semibold"
            :class="hasReceipt ? 'text-mundial-accent' : 'text-amber-200'"
          >
            <template v-if="hasReceipt">
              Comprobante enviado — esperando verificación
            </template>
            <template v-else>Falta tu comprobante de pago</template>
          </p>
          <p class="mt-0.5 text-xs" :class="hasReceipt ? 'text-slate-400' : 'text-amber-200/80'">
            <template v-if="hasReceipt">
              El admin lo revisará pronto. Si te equivocaste de imagen, puedes subir otra.
            </template>
            <template v-else>
              Haz tu transferencia y sube aquí la captura para que el admin verifique tu pago.
            </template>
          </p>

          <p v-if="justUploaded && hasReceipt" class="mt-1 text-xs font-medium text-mundial-green">
            ✓ Comprobante subido
          </p>
          <p v-if="error" class="mt-1 text-xs text-red-300">{{ error }}</p>
        </div>

        <button
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-50"
          :class="
            hasReceipt
              ? 'border border-white/15 text-slate-300 hover:bg-white/5'
              : 'bg-amber-400 text-mundial-dark hover:bg-amber-300'
          "
          :disabled="uploading"
          @click="openPicker"
        >
          <Loader2 v-if="uploading" class="h-3.5 w-3.5 animate-spin" />
          <Upload v-else class="h-3.5 w-3.5" />
          {{ uploading ? 'Subiendo...' : hasReceipt ? 'Cambiar' : 'Subir captura' }}
        </button>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      />
    </template>
  </div>
</template>
