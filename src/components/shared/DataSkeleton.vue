<script setup lang="ts">
import SkeletonBone from '@/components/shared/SkeletonBone.vue'

withDefaults(
  defineProps<{
    /** Layout del placeholder según el contenido que va a cargar. */
    variant?:
      | 'cards'
      | 'table'
      | 'list'
      | 'matrix'
      | 'rounds'
      | 'match-grid'
      | 'profile'
      | 'highlights'
    rows?: number
    cards?: number
  }>(),
  {
    variant: 'list',
    rows: 8,
    cards: 4,
  },
)
</script>

<template>
  <div role="status" aria-busy="true" aria-label="Cargando">
    <!-- Tarjetas de métricas / resumen -->
    <div
      v-if="variant === 'cards'"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      <div
        v-for="n in cards"
        :key="n"
        class="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
      >
        <SkeletonBone class="h-3 w-16" />
        <SkeletonBone class="mt-3 h-7 w-20" />
        <SkeletonBone class="mt-2 h-2.5 w-24" />
      </div>
    </div>

    <!-- Destacados tipo “Lo mejor del torneo” -->
    <div v-else-if="variant === 'highlights'" class="space-y-4">
      <div>
        <SkeletonBone class="h-3 w-24" />
        <SkeletonBone class="mt-2 h-6 w-48" />
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="n in 4"
          :key="n"
          class="rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1 space-y-2">
              <SkeletonBone class="h-3 w-28" />
              <SkeletonBone class="h-3 w-20" />
            </div>
            <SkeletonBone class="h-9 w-9 shrink-0 rounded-xl" />
          </div>
          <SkeletonBone class="h-5 w-36" />
          <SkeletonBone class="mt-2 h-3 w-24" />
        </div>
      </div>
    </div>

    <!-- Tabla de posiciones / goleo -->
    <div
      v-else-if="variant === 'table'"
      class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
    >
      <div class="border-b border-white/10 px-4 py-3">
        <SkeletonBone class="h-3.5 w-32" />
      </div>
      <div class="divide-y divide-white/5 px-3 py-1">
        <div
          v-for="n in rows"
          :key="n"
          class="flex items-center gap-3 py-2.5"
        >
          <SkeletonBone class="h-4 w-5 shrink-0" />
          <SkeletonBone class="h-6 w-6 shrink-0 rounded-full" />
          <SkeletonBone class="h-4 flex-1" :class="n % 3 === 0 ? 'max-w-[40%]' : 'max-w-[55%]'" />
          <SkeletonBone class="ml-auto h-4 w-8 shrink-0" />
          <SkeletonBone class="hidden h-4 w-8 shrink-0 sm:block" />
          <SkeletonBone class="hidden h-4 w-8 shrink-0 md:block" />
          <SkeletonBone class="h-4 w-10 shrink-0" />
        </div>
      </div>
    </div>

    <!-- Lista de ranking / posiciones -->
    <div v-else-if="variant === 'list'" class="space-y-2">
      <div
        v-for="n in rows"
        :key="n"
        class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
      >
        <SkeletonBone class="h-8 w-8 shrink-0 rounded-full" />
        <SkeletonBone class="h-10 w-10 shrink-0 rounded-full" />
        <div class="min-w-0 flex-1 space-y-2">
          <SkeletonBone class="h-4 w-28 sm:w-36" />
          <SkeletonBone class="h-3 w-16" />
        </div>
        <div class="space-y-2 text-right">
          <SkeletonBone class="ml-auto h-5 w-20" />
          <SkeletonBone class="ml-auto h-3 w-12" />
        </div>
      </div>
    </div>

    <!-- Matriz comparativa de pronósticos -->
    <div
      v-else-if="variant === 'matrix'"
      class="overflow-hidden rounded-xl border border-white/10"
    >
      <div class="overflow-x-auto">
        <div class="min-w-[36rem] space-y-0">
          <div class="flex gap-1 border-b border-white/10 bg-white/[0.04] px-2 py-2">
            <SkeletonBone class="h-10 w-28 shrink-0" />
            <SkeletonBone
              v-for="c in 9"
              :key="`h-${c}`"
              class="h-10 w-11 shrink-0 sm:w-12"
            />
          </div>
          <div
            v-for="r in rows"
            :key="`r-${r}`"
            class="flex items-center gap-1 border-b border-white/5 px-2 py-2"
          >
            <div class="flex w-28 shrink-0 items-center gap-2">
              <SkeletonBone class="h-7 w-7 shrink-0 rounded-full" />
              <SkeletonBone class="h-3.5 flex-1" />
            </div>
            <SkeletonBone
              v-for="c in 9"
              :key="`c-${r}-${c}`"
              class="h-8 w-11 shrink-0 rounded-md sm:w-12"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Grid de jornadas / cards navegables -->
    <div
      v-else-if="variant === 'rounds'"
      class="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      <div
        v-for="n in rows"
        :key="n"
        class="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-4"
      >
        <SkeletonBone class="h-12 w-12 shrink-0 rounded-xl" />
        <div class="min-w-0 flex-1 space-y-2">
          <SkeletonBone class="h-4 w-36" />
          <SkeletonBone class="h-3 w-20" />
        </div>
        <SkeletonBone class="h-5 w-5 shrink-0" />
      </div>
    </div>

    <!-- Grilla de partidos L/E/V -->
    <div v-else-if="variant === 'match-grid'" class="space-y-3">
      <div
        v-for="n in rows"
        :key="n"
        class="rounded-xl border border-white/10 bg-white/5 p-4"
      >
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <SkeletonBone class="h-8 w-8 shrink-0 rounded-full" />
            <SkeletonBone class="h-4 flex-1 max-w-[8rem]" />
          </div>
          <SkeletonBone class="h-3 w-6 shrink-0" />
          <div class="flex min-w-0 flex-1 items-center justify-end gap-2">
            <SkeletonBone class="h-4 flex-1 max-w-[8rem]" />
            <SkeletonBone class="h-8 w-8 shrink-0 rounded-full" />
          </div>
        </div>
        <div class="flex gap-2">
          <SkeletonBone class="h-10 flex-1 rounded-lg" />
          <SkeletonBone class="h-10 flex-1 rounded-lg" />
          <SkeletonBone class="h-10 flex-1 rounded-lg" />
        </div>
      </div>
    </div>

    <!-- Estadísticas de perfil -->
    <div v-else-if="variant === 'profile'" class="space-y-4">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          v-for="n in 4"
          :key="n"
          class="rounded-xl border border-white/10 bg-white/5 p-3"
        >
          <SkeletonBone class="h-3 w-20" />
          <SkeletonBone class="mt-2 h-7 w-14" />
        </div>
      </div>
      <div class="rounded-xl border border-white/10 bg-white/5 p-4">
        <SkeletonBone class="mb-4 h-3 w-36" />
        <div class="flex h-28 items-end gap-3">
          <SkeletonBone
            v-for="n in 8"
            :key="n"
            class="w-4 rounded-t-sm"
            :style="{ height: `${35 + ((n * 17) % 55)}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
