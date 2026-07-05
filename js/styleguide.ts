const PRESET_BUTTONS = document.querySelectorAll<HTMLButtonElement>(".sg-preset-btn")
const ACTIVE_PRESET_LABEL = document.getElementById("activePresetLabel")
const SWATCHES = document.querySelectorAll<HTMLElement>(".sg-swatch[data-token]")

function getActivePreset(): string {
  return document.documentElement.dataset.s9Preset || "broadcast"
}

function setActivePreset(preset: string): void {
  document.documentElement.dataset.s9Preset = preset

  PRESET_BUTTONS.forEach((button) => {
    const isActive = button.dataset.preset === preset
    button.setAttribute("aria-pressed", String(isActive))
  })

  if (ACTIVE_PRESET_LABEL) {
    ACTIVE_PRESET_LABEL.textContent = preset
  }

  updateSwatchValues()
}

function updateSwatchValues(): void {
  const styles = getComputedStyle(document.documentElement)

  SWATCHES.forEach((swatch) => {
    const token = swatch.dataset.token
    const valueEl = swatch.querySelector<HTMLElement>(".sg-swatch__value")
    if (!token || !valueEl) return

    const value = styles.getPropertyValue(token).trim()
    valueEl.textContent = value || "—"
  })
}

PRESET_BUTTONS.forEach((button) => {
  button.addEventListener("click", () => {
    const preset = button.dataset.preset
    if (preset) setActivePreset(preset)
  })
})

setActivePreset(getActivePreset())
