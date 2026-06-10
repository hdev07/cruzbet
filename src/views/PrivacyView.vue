<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { APP_NAME, APP_URL } from '@/constants/branding'

const lastUpdated = '9 de junio de 2026'
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Política de privacidad</h1>
    <p class="mb-6 text-sm text-slate-400">
      {{ APP_NAME }} · Última actualización: {{ lastUpdated }}
    </p>

    <div class="space-y-8 text-sm leading-relaxed text-slate-300">
      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">1. Responsable</h2>
        <p>
          {{ APP_NAME }} es una quiniela deportiva privada operada por Devifly, accesible en
          <a :href="APP_URL" class="text-mundial-accent hover:underline">{{ APP_URL }}</a>.
          Al usar el servicio o iniciar sesión con Google, aceptas esta política.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">2. Datos que recopilamos</h2>
        <ul class="list-disc space-y-2 pl-5 text-slate-400">
          <li>
            <strong class="text-slate-300">Cuenta de Google:</strong> nombre, correo electrónico y
            foto de perfil cuando eliges «Continuar con Google».
          </li>
          <li>
            <strong class="text-slate-300">Perfil en la app:</strong> nombre de usuario, puntos
            acumulados y avatar (si lo proporciona Google).
          </li>
          <li>
            <strong class="text-slate-300">Actividad:</strong> predicciones de minuto del primer gol y ganador,
            historial de participación y posición en el ranking.
          </li>
          <li>
            <strong class="text-slate-300">Datos técnicos:</strong> información básica del navegador
            y sesión necesaria para mantener tu acceso seguro.
          </li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">3. Para qué usamos tus datos</h2>
        <ul class="list-disc space-y-2 pl-5 text-slate-400">
          <li>Identificarte y mantener tu sesión iniciada.</li>
          <li>Guardar y mostrar tus predicciones y puntos.</li>
          <li>Calcular el ranking y los resultados de la quiniela.</li>
          <li>Administrar el torneo y resolver incidencias técnicas.</li>
        </ul>
        <p class="mt-3 text-slate-400">
          No vendemos tus datos personales ni los usamos para publicidad de terceros.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">4. Servicios de terceros</h2>
        <p class="mb-3 text-slate-400">Compartimos datos solo con proveedores necesarios para operar la app:</p>
        <ul class="list-disc space-y-2 pl-5 text-slate-400">
          <li>
            <strong class="text-slate-300">Google:</strong> autenticación OAuth. Consulta la
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              class="text-mundial-accent hover:underline"
            >política de privacidad de Google</a>.
          </li>
          <li>
            <strong class="text-slate-300">Supabase:</strong> base de datos, autenticación y
            almacenamiento de perfiles y predicciones.
          </li>
          <li>
            <strong class="text-slate-300">Vercel:</strong> alojamiento de la aplicación web.
          </li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">5. Conservación y eliminación</h2>
        <p class="text-slate-400">
          Conservamos tus datos mientras participes en la quiniela o sea necesario para operar el
          servicio. Puedes solicitar la eliminación de tu cuenta y datos escribiendo al administrador
          del torneo. Al cerrar sesión, se invalida tu sesión activa en el dispositivo.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">6. Tus derechos</h2>
        <p class="text-slate-400">
          Puedes solicitar acceso, corrección o eliminación de tus datos personales contactando al
          administrador de {{ APP_NAME }}. También puedes dejar de usar el servicio en cualquier
          momento cerrando sesión desde tu perfil.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">7. Seguridad</h2>
        <p class="text-slate-400">
          Aplicamos medidas razonables para proteger tu información, incluyendo conexiones cifradas
          (HTTPS) y controles de acceso en la base de datos. Ningún sistema en internet es 100 %
          seguro; te recomendamos usar una cuenta de Google que controles.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">8. Cambios</h2>
        <p class="text-slate-400">
          Podemos actualizar esta política. Publicaremos la fecha de la última revisión en esta
          página. El uso continuado del servicio tras un cambio implica tu aceptación.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-slate-200">9. Contacto</h2>
        <p class="text-slate-400">
          Para dudas sobre privacidad o solicitudes relacionadas con tus datos, contacta al
          administrador de {{ APP_NAME }} a través del correo asociado a tu cuenta de Google o del
          organizador del torneo.
        </p>
      </section>
    </div>

    <div class="mt-8 flex flex-wrap gap-4 text-sm">
      <RouterLink to="/login" class="text-mundial-accent hover:underline">Volver al login</RouterLink>
      <RouterLink to="/terminos" class="text-slate-400 hover:text-slate-200">Términos del servicio</RouterLink>
      <RouterLink to="/reglas" class="text-slate-400 hover:text-slate-200">Reglas y pagos</RouterLink>
    </div>
  </div>
</template>
