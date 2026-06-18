const MIN_SPLASH_MS = 450
const FADE_MS = 320

export function dismissAppSplash(): void {
  const splash = document.getElementById('app-splash')
  if (!splash) return

  const shownAt = Number(splash.dataset.shownAt ?? Date.now())
  const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - shownAt))

  window.setTimeout(() => {
    splash.classList.add('app-splash--out')
    window.setTimeout(() => splash.remove(), FADE_MS)
  }, wait)
}
