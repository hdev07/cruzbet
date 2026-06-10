<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ChevronDown } from '@lucide/vue'

export interface SelectOption<T = string | number> {
  value: T
  label: string
  image?: string
  imageAlt?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | ''
    options: SelectOption[]
    placeholder?: string
    searchable?: boolean
    disabled?: boolean
    suffix?: string
    emptyMessage?: string
  }>(),
  {
    placeholder: 'Seleccionar...',
    searchable: false,
    suffix: '',
    emptyMessage: 'Sin resultados',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const isOpen = ref(false)
const query = ref('')
const highlightedIndex = ref(0)
const root = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const selectedOption = computed(() =>
  props.options.find((option) => option.value === props.modelValue),
)

const displayValue = computed(() => {
  if (selectedOption.value) {
    return `${selectedOption.value.label}${props.suffix}`
  }
  return ''
})

const filteredOptions = computed(() => {
  if (!props.searchable) return props.options

  const trimmed = query.value.trim()
  if (!trimmed) return props.options

  return props.options.filter((option) => String(option.value).startsWith(trimmed))
})

function syncHighlight() {
  const index = filteredOptions.value.findIndex((option) => option.value === props.modelValue)
  highlightedIndex.value = index >= 0 ? index : 0
}

function scrollToHighlighted() {
  const item = listRef.value?.children[highlightedIndex.value] as HTMLElement | undefined
  item?.scrollIntoView({ block: 'nearest' })
}

function open() {
  if (props.disabled) return
  isOpen.value = true
  query.value =
    props.modelValue !== '' && props.searchable ? String(props.modelValue) : displayValue.value
  syncHighlight()
  nextTick(() => {
    if (props.searchable) {
      inputRef.value?.focus()
      inputRef.value?.select()
    }
    scrollToHighlighted()
  })
}

function close(acceptQuery = false) {
  if (props.searchable && acceptQuery) {
    commitQuery()
  } else if (props.searchable) {
    query.value = displayValue.value
  }
  isOpen.value = false
}

function commitQuery() {
  const trimmed = query.value.trim()
  if (!trimmed) return

  const exact = props.options.find((option) => String(option.value) === trimmed)
  if (exact) {
    emit('update:modelValue', exact.value)
    query.value = `${exact.label}${props.suffix}`
    return
  }

  const parsed = Number(trimmed)
  if (Number.isInteger(parsed)) {
    const match = props.options.find((option) => option.value === parsed)
    if (match) {
      emit('update:modelValue', match.value)
      query.value = `${match.label}${props.suffix}`
    }
  }
}

function select(option: SelectOption) {
  emit('update:modelValue', option.value)
  query.value = `${option.label}${props.suffix}`
  isOpen.value = false
}

function onInputFocus() {
  if (!isOpen.value) open()
}

function onInputInput() {
  if (!isOpen.value) isOpen.value = true
  highlightedIndex.value = 0
}

function onInputBlur() {
  window.setTimeout(() => {
    if (!root.value?.contains(document.activeElement)) {
      close(true)
    }
  }, 0)
}

function onKeydown(event: KeyboardEvent) {
  if (!props.searchable && !isOpen.value) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault()
      open()
    }
    return
  }

  if (!isOpen.value) {
    if (event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault()
      open()
    }
    return
  }

  const options = filteredOptions.value

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, options.length - 1)
    scrollToHighlighted()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
    scrollToHighlighted()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const highlighted = options[highlightedIndex.value]
    if (highlighted) {
      select(highlighted)
    } else {
      commitQuery()
      isOpen.value = false
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    close()
  } else if (event.key === 'Tab') {
    close(true)
  }
}

function onClickOutside(event: MouseEvent) {
  if (root.value?.contains(event.target as Node)) return
  close(true)
}

watch(
  () => props.modelValue,
  () => {
    if (!isOpen.value) {
      query.value = displayValue.value
    }
  },
)

onMounted(() => {
  query.value = displayValue.value
  document.addEventListener('mousedown', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
})
</script>

<template>
  <div ref="root" class="relative">
    <div
      class="flex items-center rounded-xl border bg-mundial-dark transition"
      :class="[
        disabled
          ? 'cursor-not-allowed border-white/5 opacity-50'
          : 'cursor-pointer border-white/10 hover:border-white/20',
        isOpen ? 'border-mundial-accent/60 ring-2 ring-mundial-accent/20' : '',
      ]"
      @keydown="onKeydown"
    >
      <template v-if="searchable">
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          :placeholder="placeholder"
          :disabled="disabled"
          class="w-full bg-transparent px-3 py-2.5 text-sm tabular-nums outline-none placeholder:text-slate-500"
          @focus="onInputFocus"
          @input="onInputInput"
          @blur="onInputBlur"
        />
      </template>

      <button
        v-else
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm outline-none"
        :disabled="disabled"
        @click="open"
      >
        <img
          v-if="selectedOption?.image"
          :src="selectedOption.image"
          :alt="selectedOption.imageAlt ?? selectedOption.label"
          class="h-5 w-7 shrink-0 object-cover"
        />
        <span class="min-w-0 flex-1 truncate" :class="selectedOption ? 'text-white' : 'text-slate-500'">
          {{ selectedOption?.label ?? placeholder }}
        </span>
      </button>

      <button
        type="button"
        class="mr-2 shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
        :disabled="disabled"
        tabindex="-1"
        aria-label="Abrir opciones"
        @click.stop="isOpen ? close(true) : open()"
      >
        <ChevronDown
          class="h-4 w-4 transition-transform duration-200"
          :class="isOpen ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </button>
    </div>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="scale-95 opacity-0"
      enter-to-class="scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="scale-100 opacity-100"
      leave-to-class="scale-95 opacity-0"
    >
      <ul
        v-if="isOpen"
        ref="listRef"
        class="app-scrollbar absolute z-20 mt-1 max-h-52 w-full origin-top overflow-y-auto rounded-xl border border-white/10 bg-[#16162a] py-1 shadow-xl shadow-black/40"
        role="listbox"
      >
        <li
          v-if="filteredOptions.length === 0"
          class="px-3 py-2.5 text-sm text-slate-500"
        >
          {{ emptyMessage }}
        </li>
        <li
          v-for="(option, index) in filteredOptions"
          :key="String(option.value)"
          role="option"
          :aria-selected="option.value === modelValue"
          class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition"
          :class="
            index === highlightedIndex
              ? 'bg-mundial-accent/15 text-white'
              : option.value === modelValue
                ? 'bg-white/5 text-mundial-accent'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
          "
          @mousedown.prevent="select(option)"
          @mouseenter="highlightedIndex = index"
        >
          <img
            v-if="option.image"
            :src="option.image"
            :alt="option.imageAlt ?? option.label"
            class="h-5 w-7 shrink-0 object-cover"
          />
          <span class="tabular-nums">{{ option.label }}{{ suffix }}</span>
        </li>
      </ul>
    </Transition>
  </div>
</template>
