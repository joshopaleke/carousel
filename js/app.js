/* ─────────────────────────────────────────────
   CAROUSEL. — App Bootstrap
   ───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Landing screen ───────────────────────── */
  document.getElementById('btn-create')?.addEventListener('click', () => {
    UI.showScreen('screen-wizard');
    UI.wizardGoTo(0);
  });
  document.getElementById('btn-view-demo')?.addEventListener('click', () => {
    // Create a demo carousel directly
    STATE.wizard.slideCount  = 6;
    STATE.wizard.composition = 'cinematic';
    STATE.wizard.contentMode = 'mixed';
    STATE.wizard.artDirection = 'editorial';
    generateCarousel();
    HISTORY.snapshot();
    UI.showScreen('screen-editor');
    Canvas.rebuild();
    LeftPanel.buildStylePanel();
    LeftPanel.buildImagesPanel();
    LeftPanel.buildElementsPanel();
    Navigator.rebuild();
    setTimeout(() => { Canvas.zoomFit(); UI.toast('Demo carousel loaded', '✦'); }, 200);
  });

  /* ── Wizard ───────────────────────────────── */

  // Slide count pills
  document.querySelectorAll('.count-pill').forEach($p => {
    $p.addEventListener('click', () => {
      document.querySelectorAll('.count-pill').forEach($x => $x.classList.remove('selected'));
      $p.classList.add('selected');
      STATE.wizard.slideCount = parseInt($p.dataset.count, 10);
    });
  });
  // Select default
  document.querySelector(`.count-pill[data-count="${STATE.wizard.slideCount}"]`)?.classList.add('selected');

  // Composition cards
  document.querySelectorAll('[data-composition-pick]').forEach($c => {
    $c.addEventListener('click', () => {
      document.querySelectorAll('[data-composition-pick]').forEach($x => $x.classList.remove('selected'));
      $c.classList.add('selected');
      STATE.wizard.composition = $c.dataset.compositionPick;
    });
  });
  document.querySelector(`[data-composition-pick="${STATE.wizard.composition}"]`)?.classList.add('selected');

  // Content mode cards
  document.querySelectorAll('[data-content-pick]').forEach($c => {
    $c.addEventListener('click', () => {
      document.querySelectorAll('[data-content-pick]').forEach($x => $x.classList.remove('selected'));
      $c.classList.add('selected');
      STATE.wizard.contentMode = $c.dataset.contentPick;
    });
  });
  document.querySelector(`[data-content-pick="${STATE.wizard.contentMode}"]`)?.classList.add('selected');

  // Art direction cards
  document.querySelectorAll('[data-artdir-pick]').forEach($c => {
    $c.addEventListener('click', () => {
      document.querySelectorAll('[data-artdir-pick]').forEach($x => $x.classList.remove('selected'));
      $c.classList.add('selected');
      STATE.wizard.artDirection = $c.dataset.artdirPick;
    });
  });
  document.querySelector(`[data-artdir-pick="${STATE.wizard.artDirection}"]`)?.classList.add('selected');

  // Wizard nav
  document.getElementById('wizard-next-btn')?.addEventListener('click', UI.wizardNext.bind(UI));
  document.getElementById('wizard-back-btn')?.addEventListener('click', UI.wizardBack.bind(UI));

  /* ── Toolbar ──────────────────────────────── */
  document.getElementById('btn-home')?.addEventListener('click', () => {
    if (confirm('Return to home? Unsaved changes will be lost.')) {
      UI.showScreen('screen-landing');
    }
  });

  document.getElementById('btn-undo')?.addEventListener('click', () => { HISTORY.undo(); Canvas.rebuild(); });
  document.getElementById('btn-redo')?.addEventListener('click', () => { HISTORY.redo(); Canvas.rebuild(); });

  document.getElementById('btn-zoom-out')?.addEventListener('click', () => Canvas.zoomOut());
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => Canvas.zoomIn());
  document.getElementById('zoom-value')?.addEventListener('click', () => Canvas.zoomFit());

  document.getElementById('btn-preview')?.addEventListener('click', () => {
    const idx = Math.max(0, STATE.carousel.slides.findIndex(s => s.id === STATE.carousel.selectedSlideId));
    Preview.open(idx);
  });
  document.getElementById('btn-export')?.addEventListener('click', () => Exporter.openModal());

  // Title input
  document.getElementById('carousel-title')?.addEventListener('change', e => {
    STATE.carousel.title = e.target.value || 'Untitled Carousel';
  });

  // History change → update undo/redo buttons
  Events.on('history:change', () => {
    const $undo = document.getElementById('btn-undo');
    const $redo = document.getElementById('btn-redo');
    if ($undo) $undo.style.opacity = HISTORY.canUndo() ? '1' : '0.3';
    if ($redo) $redo.style.opacity = HISTORY.canRedo() ? '1' : '0.3';
  });

  /* ── Left panel tabs ──────────────────────── */
  LeftPanel.init();

  /* ── Image upload hidden input ────────────── */
  const $upload = document.getElementById('image-upload-hidden');
  $upload?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const slideId = $upload.dataset.targetSlide;
    const elId    = $upload.dataset.targetEl || null;
    Canvas.handleImageFile(file, slideId, elId);
    $upload.value = '';
  });

  /* ── Canvas drag-drop images ──────────────── */
  const $viewport = document.getElementById('canvas-viewport');
  $viewport?.addEventListener('dragover', e => { e.preventDefault(); });
  $viewport?.addEventListener('drop', e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const id = STATE.carousel.selectedSlideId;
    if (!id) { UI.toast('Select a slide first', '⚠'); return; }
    Canvas.handleImageFile(file, id, null);
  });

  /* ── Keyboard global shortcuts ────────────── */
  document.addEventListener('keydown', e => {
    if (document.getElementById('screen-editor').classList.contains('active')) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'p') { e.preventDefault(); Preview.open(0); }
      if (meta && e.key === 'e') { e.preventDefault(); Exporter.openModal(); }
    }
  });

  /* ── Wheel zoom on canvas ─────────────────── */
  $viewport?.addEventListener('wheel', e => {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) Canvas.zoomIn();
      else Canvas.zoomOut();
    }
  }, { passive: false });

  /* ── Module inits ─────────────────────────── */
  Canvas.init();
  Navigator.init();
  Preview.init();
  Exporter.init();

  /* ── Start on landing ─────────────────────── */
  UI.showScreen('screen-landing');
});
