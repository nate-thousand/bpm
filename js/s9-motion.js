import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.7/+esm';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let motionEnabled = !prefersReducedMotion;
let micScanTween = null;
let keyScanTween = null;
let initialized = false;

function canAnimate() {
  return motionEnabled && typeof gsap !== 'undefined';
}

export function initS9Motion() {
  if (initialized) return;
  initialized = true;

  if (!canAnimate()) return;

  const shell = document.querySelector('.s9-app-enter');
  if (shell) shell.style.animation = 'none';

  gsap.set('[data-s9-reveal]', { opacity: 0, y: 10 });

  bindButtonPressFeedback();
  animateStartupReveal();
  animateAsciiLogoFlicker();
}

export function animateStartupReveal() {
  if (!canAnimate()) return;

  gsap.to('[data-s9-reveal]', {
    opacity: 1,
    y: 0,
    duration: 0.45,
    stagger: 0.08,
    ease: 'power2.out',
    clearProps: 'transform',
  });
}

export function animateAsciiLogoFlicker() {
  if (!canAnimate()) return;

  const logo = document.querySelector('.s9-ascii-logo');
  if (!logo) return;

  gsap.fromTo(
    logo,
    { opacity: 0.35, filter: 'brightness(0.7)' },
    {
      opacity: 1,
      filter: 'brightness(1.15)',
      duration: 0.7,
      ease: 'steps(8)',
      clearProps: 'filter',
    },
  );
}

export function animateTapPulse() {
  if (!canAnimate()) return;

  const tapReadout = document.querySelector('#tapPanel .s9-bpm-readout');
  const eqBars = document.querySelector('.s9-ascii-eq__bars');
  const signalBar = document.querySelector('#signalLockBar');
  const rhythmGrid = document.querySelector('#rhythmGrid');

  if (tapReadout) {
    gsap.fromTo(
      tapReadout,
      { scale: 1 },
      {
        scale: 1.035,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
        transformOrigin: 'center center',
      },
    );
  }

  if (eqBars) {
    gsap.fromTo(
      eqBars,
      { opacity: 0.65 },
      {
        opacity: 1,
        duration: 0.16,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
      },
    );
  }

  if (signalBar) {
    gsap.fromTo(
      signalBar,
      { opacity: 0.55 },
      {
        opacity: 1,
        duration: 0.18,
        ease: 'power2.out',
      },
    );
  }

  if (rhythmGrid) {
    gsap.fromTo(
      rhythmGrid,
      { opacity: 0.7 },
      {
        opacity: 1,
        duration: 0.14,
        ease: 'power2.out',
      },
    );
  }
}

export function animateSignalLock(target) {
  if (!canAnimate()) return;

  const bar = target || document.querySelector('#signalLockBar');
  if (!bar) return;

  gsap.fromTo(
    bar,
    { opacity: 0.65 },
    {
      opacity: 1,
      duration: 0.2,
      ease: 'power2.out',
    },
  );
}

export function animateAsciiEq(target) {
  if (!canAnimate()) return;

  const bars = target || document.querySelector('.s9-ascii-eq__bars');
  if (!bars) return;

  gsap.fromTo(
    bars,
    { opacity: 0.72 },
    {
      opacity: 1,
      duration: 0.16,
      ease: 'power2.out',
    },
  );
}

export function animateMicScan(isActive) {
  if (micScanTween) {
    micScanTween.kill();
    micScanTween = null;
  }

  const eqPanel = document.querySelector('.s9-ascii-eq');
  if (!eqPanel) return;

  if (!canAnimate()) {
    gsap.set(eqPanel, { opacity: 1 });
    return;
  }

  if (isActive) {
    gsap.set(eqPanel, { opacity: 1 });
    micScanTween = gsap.to(eqPanel, {
      opacity: 0.78,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
    });
    return;
  }

  gsap.to(eqPanel, {
    opacity: 1,
    duration: 0.2,
    ease: 'power2.out',
  });
}

export function animateKeyScan(target, state) {
  if (!canAnimate()) return;

  const scanBlock = target || document.querySelector('.s9-key-scan');
  if (!scanBlock) return;

  if (keyScanTween) {
    keyScanTween.kill();
    keyScanTween = null;
  }

  if (state === 'pending' || state === 'decoding') {
    keyScanTween = gsap.to(scanBlock, {
      opacity: 0.82,
      duration: 0.9,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
    });
    return;
  }

  gsap.to(scanBlock, {
    opacity: 1,
    duration: 0.2,
    ease: 'power2.out',
  });
}

function bindButtonPressFeedback() {
  document.querySelectorAll('.s9-broadcast__btn').forEach((button) => {
    button.addEventListener('pointerdown', () => {
      if (!canAnimate() || button.disabled) return;
      gsap.to(button, {
        scale: 0.985,
        duration: 0.08,
        ease: 'power2.out',
        transformOrigin: 'center center',
      });
    });

    const resetScale = () => {
      if (!canAnimate()) return;
      gsap.to(button, {
        scale: 1,
        duration: 0.12,
        ease: 'power2.out',
      });
    };

    button.addEventListener('pointerup', resetScale);
    button.addEventListener('pointerleave', resetScale);
  });
}

export function killAllMotion() {
  if (micScanTween) {
    micScanTween.kill();
    micScanTween = null;
  }

  if (keyScanTween) {
    keyScanTween.kill();
    keyScanTween = null;
  }

  gsap.killTweensOf('.s9-ascii-eq');
  gsap.set('.s9-ascii-eq', { opacity: 1 });
}
