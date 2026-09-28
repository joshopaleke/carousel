/* ─────────────────────────────────────────────
   CAROUSEL. — UI Utilities
   (toasts, context menu, wizard transitions)
   ───────────────────────────────────────────── */

const UI = (() => {
  /* ── Toast notifications ─────────────────── */
  let _toastContainer;

  function toast(message, icon = '✓', duration = 2800) {
    if (!_toastContainer) {
      _toastContainer = document.getElementById('toast-container');
    }
    const $t = document.createElement('div');
    $t.className = 'toast';
    $t.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    _toastContainer.appendChild($t);

    setTimeout(() => {
      $t.classList.add('exit');
      $t.addEventListener('animationend', () => $t.remove());
    }, duration);
  }

  /* ── Context menu ────────────────────────── */
  let _contextMenu = null;

  function showContextMenu(x, y, items) {
    closeContextMenu();

    const $menu = document.createElement('div');
    $menu.className = 'context-menu';
    $menu.id = 'context-menu';

    items.forEach(item => {
      if (item.type === 'divider') {
        const $d = document.createElement('div');
        $d.className = 'ctx-divider';
        $menu.appendChild($d);
        return;
      }

      const $item = document.createElement('div');
      $item.className = 'ctx-item' + (item.danger ? ' danger' : '');
      if (item.disabled) $item.style.opacity = '0.4';
      $item.innerHTML = `
        <span class="ctx-icon">${item.icon || ''}</span>
        <span>${item.label}</span>
        ${item.shortcut ? `<span class="ctx-shortcut">${item.shortcut}</span>` : ''}
      `;
      if (!item.disabled) {
        $item.addEventListener('click', e => {
          e.stopPropagation();
          item.action?.();
          closeContextMenu();
        });
      }
      $menu.appendChild($item);
    });

    document.body.appendChild($menu);
    _contextMenu = $menu;

    // Position so it doesn't overflow viewport
    const rect = $menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(x, vw - rect.width - 8);
    const top  = Math.min(y, vh - rect.height - 8);
    $menu.style.left = left + 'px';
    $menu.style.top  = top  + 'px';
  }

  function closeContextMenu() {
    if (_contextMenu) {
      _contextMenu.remove();
      _contextMenu = null;
    }
  }

  /* ── Screen transitions ───────────────────── */
  function showScreen(id) {
    document.querySelectorAll('[id^="screen-"]').forEach($s => {
      $s.style.display = 'none';
      $s.classList.remove('active');
    });
    const $target = document.getElementById(id);
    if ($target) {
      $target.style.display = '';
      $target.classList.add('active');
    }
  }

  /* ── Wizard logic ─────────────────────────── */
  const WIZARD_STEPS = ['slide-count', 'composition', 'canvas-size', 'content-mode', 'art-direction'];
  let _currentStep = 0;

  function wizardGoTo(step) {
    _currentStep = Math.max(0, Math.min(step, WIZARD_STEPS.length - 1));
    document.querySelectorAll('.wizard-panel').forEach(($p, i) => {
      $p.classList.toggle('active', i === _currentStep);
    });
    document.querySelectorAll('.wizard-step-dot').forEach(($d, i) => {
      $d.classList.remove('active', 'done');
      if (i === _currentStep) $d.classList.add('active');
      else if (i < _currentStep) $d.classList.add('done');
    });

    // Update footer
    document.getElementById('wizard-back-btn').style.visibility = _currentStep === 0 ? 'hidden' : '';
    const isLast = _currentStep === WIZARD_STEPS.length - 1;
    const $next = document.getElementById('wizard-next-btn');
    $next.textContent = isLast ? 'Create →' : 'Continue →';

    updateWizardSummary();
  }

  function wizardNext() {
    if (_currentStep < WIZARD_STEPS.length - 1) {
      wizardGoTo(_currentStep + 1);
    } else {
      // Launch editor
      generateCarousel();
      HISTORY.snapshot();
      showScreen('screen-editor');
      Canvas.rebuild();
      Canvas.zoomFit();
      LeftPanel.buildStylePanel();
      LeftPanel.buildImagesPanel();
      LeftPanel.buildElementsPanel();
      Navigator.rebuild();
      setTimeout(() => {
        Canvas.zoomFit();
        UI.toast(`${STATE.carousel.slides.length} slides created`, '✦');
      }, 200);
    }
  }

  function wizardBack() {
    if (_currentStep > 0) wizardGoTo(_currentStep - 1);
  }

  function updateWizardSummary() {
    const $s = document.getElementById('wizard-summary');
    if (!$s) return;
    const fmt = FORMATS[STATE.carousel.format];
    const chips = [];
    if (STATE.wizard.slideCount) chips.push({ label: `${STATE.wizard.slideCount} slides` });
    if (STATE.wizard.composition) chips.push({ label: STATE.wizard.composition });
    if (fmt) chips.push({ label: fmt.label });
    if (STATE.wizard.contentMode) chips.push({ label: STATE.wizard.contentMode });
    if (STATE.wizard.artDirection) chips.push({ label: STATE.wizard.artDirection });

    $s.innerHTML = chips.slice(0, _currentStep).map(c =>
      `<div class="wizard-summary-chip"><div class="chip-dot"></div>${c.label}</div>`
    ).join('');
  }

  return { toast, showContextMenu, closeContextMenu, showScreen, wizardGoTo, wizardNext, wizardBack };
})();
