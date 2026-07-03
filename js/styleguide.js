const PRESET_BUTTONS = document.querySelectorAll('.sg-preset-btn');
const ACTIVE_PRESET_LABEL = document.getElementById('activePresetLabel');
const SWATCHES = document.querySelectorAll('.sg-swatch[data-token]');

function getActivePreset() {
  return document.documentElement.dataset.s9Preset || 'broadcast';
}

function setActivePreset(preset) {
  document.documentElement.dataset.s9Preset = preset;

  PRESET_BUTTONS.forEach((button) => {
    const isActive = button.dataset.preset === preset;
    button.setAttribute('aria-pressed', String(isActive));
  });

  if (ACTIVE_PRESET_LABEL) {
    ACTIVE_PRESET_LABEL.textContent = preset;
  }

  updateSwatchValues();
}

function updateSwatchValues() {
  const styles = getComputedStyle(document.documentElement);

  SWATCHES.forEach((swatch) => {
    const token = swatch.dataset.token;
    const valueEl = swatch.querySelector('.sg-swatch__value');
    if (!token || !valueEl) return;

    const value = styles.getPropertyValue(token).trim();
    valueEl.textContent = value || '—';
  });
}

PRESET_BUTTONS.forEach((button) => {
  button.addEventListener('click', () => {
    const preset = button.dataset.preset;
    if (preset) setActivePreset(preset);
  });
});

setActivePreset(getActivePreset());
