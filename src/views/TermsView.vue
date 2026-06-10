<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { APP_NAME, APP_URL } from '@/constants/branding'
import { ENTRY_FEE_MXN } from '@/constants/quiniela-rules'

const lastUpdated = '9 de junio de 2026'
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Términos del servicio</h1>
    <p class="mb-6 text-sm text-slate-400">
      {{ APP_NAME }} · Última actualización: {{ lastUpdated }}
    </p>

    <div class="space-y-8 text-sm leading-relaxed text-slate-300">
      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">1. Aceptación</h2>
        <p class="text-slate-400">
          Al acceder a
          <a :href="APP_URL" class="text-mundial-accent hover:underline">{{ APP_URL }}</a>,
          crear una cuenta o participar en la quiniela, aceptas estos términos y nuestra
          <RouterLink to="/privacidad" class="text-mundial-accent hover:underline">
            política de privacidad
          </RouterLink>.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">2. Naturaleza del servicio</h2>
        <p class="text-slate-400">
          {{ APP_NAME }} es una quiniela deportiva privada entre participantes invitados para el
          Mundial 2026. No es una casa de apuestas regulada ni un servicio de juego comercial
          abierto al público. El organizador define las reglas, los premios y la administración del
          torneo.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">3. Elegibilidad y cuenta</h2>
        <ul class="list-disc space-y-2 pl-5 text-slate-400">
          <li>Debes tener al menos 18 años para participar.</li>
          <li>El acceso se realiza con una cuenta de Google válida bajo tu responsabilidad.</li>
          <li>Eres responsable de la actividad realizada con tu cuenta.</li>
          <li>El organizador puede suspender cuentas por uso indebido, fraude o incumplimiento.</li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">4. Participación y cuota</h2>
        <p class="mb-3 text-slate-400">
          La cuota de entrada es de <strong class="text-slate-300">${{ ENTRY_FEE_MXN }} MXN</strong>
          por partido, según se indica en
          <RouterLink to="/reglas" class="text-mundial-accent hover:underline">reglas y pagos</RouterLink>.
        </p>
        <ul class="list-disc space-y-2 pl-5 text-slate-400">
          <li>Las predicciones solo son válidas antes del inicio del partido.</li>
          <li>El depósito debe realizarse según las instrucciones publicadas en la app.</li>
          <li>La participación sin cumplir la cuota acordada puede quedar sin efecto a criterio del organizador.</li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">5. Predicciones y puntos</h2>
        <p class="text-slate-400">
          Los límites por partido, el sistema de puntuación y la determinación de ganadores se
          describen en la sección de reglas. Los resultados oficiales registrados por el
          administrador del torneo son definitivos para el cálculo de puntos y premios.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">6. Premios y pagos</h2>
        <p class="text-slate-400">
          Los premios, reparto de fondos y plazos de pago son responsabilidad del organizador del
          torneo. {{ APP_NAME }} es una plataforma para registrar predicciones y el ranking; no
          procesa pagos bancarios ni garantiza la entrega de premios entre participantes.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">7. Uso permitido</h2>
        <p class="mb-3 text-slate-400">Te comprometes a no:</p>
        <ul class="list-disc space-y-2 pl-5 text-slate-400">
          <li>Intentar acceder sin autorización a cuentas, datos o áreas de administración.</li>
          <li>Manipular resultados, predicciones o el ranking de forma fraudulenta.</li>
          <li>Usar la plataforma para actividades ilegales o que afecten a otros participantes.</li>
          <li>Automatizar el uso del servicio sin permiso del organizador.</li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">8. Disponibilidad</h2>
        <p class="text-slate-400">
          El servicio se ofrece «tal cual». Pueden ocurrir interrupciones por mantenimiento,
          actualizaciones o causas fuera de nuestro control. No garantizamos disponibilidad continua
          durante todo el torneo.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">9. Limitación de responsabilidad</h2>
        <p class="text-slate-400">
          En la medida permitida por la ley, Devifly y el organizador no serán responsables por
          pérdidas indirectas, errores de terceros (Google, Supabase, proveedores de hosting) ni
          disputas entre participantes sobre pagos o premios, más allá de lo razonablemente exigible
          por el funcionamiento de la plataforma.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">10. Cambios y terminación</h2>
        <p class="text-slate-400">
          Podemos actualizar estos términos publicando la nueva versión en esta página. El
          organizador puede finalizar o modificar el torneo comunicándolo a los participantes. Puedes
          dejar de participar cerrando sesión y dejando de usar el servicio.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">11. Contacto</h2>
        <p class="text-slate-400">
          Para dudas sobre estos términos, contacta al administrador de {{ APP_NAME }} o al
          organizador del torneo.
        </p>
      </section>
    </div>

    <div class="mt-8 flex flex-wrap gap-4 text-sm">
      <RouterLink to="/login" class="text-mundial-accent hover:underline">Volver al login</RouterLink>
      <RouterLink to="/privacidad" class="text-slate-400 hover:text-slate-200">Privacidad</RouterLink>
      <RouterLink to="/reglas" class="text-slate-400 hover:text-slate-200">Reglas y pagos</RouterLink>
    </div>
  </div>
</template>
