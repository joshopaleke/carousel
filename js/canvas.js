/* ─────────────────────────────────────────────
   CAROUSEL. — Canvas Renderer
   Renders slides onto the continuous canvas DOM
   ───────────────────────────────────────────── */

const Canvas = (() => {
  let $viewport, $scrollInner;
  let _dragState = null;

  /* ── Init ─────────────────────────────────── */
  function init() {
    $viewport   = document.getElementById('canvas-viewport');
    $scrollInner = document.getElementById('canvas-scroll-inner');

    // Keyboard shortcuts on canvas
    document.addEventListener('keydown', onKeyDown);

    // Click-outside deselect
    $viewport.addEventListener('mousedown', e => {
      if (e.target === $viewport || e.target === $scrollInner) {
        deselectAll();
      }
    });

    Events.on('canvas:rebuild', rebuild);
    Events.on('style:change', rebuild);

    // Right-click context menu
    document.addEventListener('contextmenu', onContextMenu);

    // Dismiss context menu
    document.addEventListener('click', () => UI.closeContextMenu());
  }

  /* ── Full rebuild ─────────────────────────── */
  function rebuild() {
    $scrollInner.innerHTML = '';
    const { slides, zoom } = STATE.carousel;
    $scrollInner.style.setProperty('--zoom', zoom);

    slides.forEach((slide, idx) => {
      if (idx > 0) {
        const sep = document.createElement('div');
        sep.className = 'slide-separator';
        const { h } = getFormatDims();
        sep.style.height = Math.round(h * zoom) + 'px';
        $scrollInner.appendChild(sep);
      }
      $scrollInner.appendChild(buildSlideDom(slide, idx, zoom));
    });

    // Scroll selected slide into view
    scrollToSelected();
    Navigator.rebuild();
    Inspector.refresh();
  }

  /* ── Build one slide DOM node ─────────────── */
  function buildSlideDom(slide, idx, zoom) {
    const { w, h } = getFormatDims();
    const pw = Math.round(w * zoom);
    const ph = Math.round(h * zoom);

    const $slide = document.createElement('div');
    $slide.className = 'canvas-slide';
    $slide.dataset.slideId = slide.id;
    $slide.dataset.role = slide.role;
    $slide.style.cssText = `
      width: ${pw}px;
      height: ${ph}px;
      background: ${slide.bgColor};
    `;

    if (slide.id === STATE.carousel.selectedSlideId) {
      $slide.classList.add('selected');
    }

    // Slide number badge
    const $badge = document.createElement('div');
    $badge.className = 'slide-badge';
    $badge.textContent = String(idx + 1).padStart(2, '0');
    $slide.appendChild($badge);

    // Role tag
    const $role = document.createElement('div');
    $role.className = 'slide-role-tag';
    $role.textContent = ROLE_ICONS[slide.role] + ' ' + slide.role;
    $slide.appendChild($role);

    // Elements
    slide.elements.forEach(el => {
      $slide.appendChild(buildElementDom(el, slide, zoom));
    });

    // Click => select slide
    $slide.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.stopPropagation();
      selectSlide(slide.id);

      // If clicking an element, handle element selection in element's own handler
      if (!e.target.closest('.slide-element')) {
        STATE.carousel.selectedElementId = null;
        Inspector.refresh();
        clearElementSelections();
      }
    });

    // Double-click => enter text edit if text element
    $slide.addEventListener('dblclick', e => {
      const $el = e.target.closest('.slide-element[data-type="text"]');
      if ($el) startTextEdit($el, slide.id, $el.dataset.elId);
    });

    return $slide;
  }

  /* ── Build one element DOM node ─────────────── */
  function buildElementDom(el, slide, zoom) {
    const $el = document.createElement('div');
    $el.className = 'slide-element';
    $el.dataset.elId = el.id;
    $el.dataset.type = el.type;

    const pw = Math.round(el.x * zoom);
    const pt = Math.round(el.y * zoom);
    const pw2 = Math.round(el.width * zoom);
    const ph2 = Math.round(el.height * zoom);

    const zIndexVal = el.zIndex ?? (el.type === 'image' ? (el.isFloating ? 4 : 1) : el.type === 'shape' ? (el.strokeWidth ? 5 : 2) : 6);

    $el.style.cssText = `
      left:    ${pw}px;
      top:     ${pt}px;
      width:   ${pw2}px;
      height:  ${ph2}px;
      opacity: ${el.opacity};
      transform: rotate(${el.rotation || 0}deg);
      z-index: ${zIndexVal};
    `;

    if (el.id === STATE.carousel.selectedElementId) {
      $el.classList.add('selected');
    }

    if (el.type === 'text') {
      $el.classList.add('slide-text-el');
      $el.style.fontFamily = `'${el.fontFamily}', serif`;
      $el.style.fontSize   = Math.round(el.fontSize * zoom) + 'px';
      $el.style.fontWeight = el.fontWeight;
      $el.style.color      = el.color;
      $el.style.textAlign  = el.align;
      $el.style.lineHeight = el.lineHeight;
      $el.style.letterSpacing = (el.letterSpacing * zoom) + 'px';
      $el.style.overflow   = 'visible';
      $el.textContent      = el.content;
      if (el.isBadge) {
        $el.style.textShadow = '0 2px 10px rgba(0,0,0,0.6)';
        $el.style.whiteSpace = 'pre-line';
      }

    } else if (el.type === 'image') {
      $el.classList.add('slide-image-el');
      if (el.borderWidth && el.borderColor) {
        const bw = Math.max(1, Math.round(el.borderWidth * zoom));
        $el.style.border = `${bw}px solid ${el.borderColor}`;
        $el.style.boxSizing = 'border-box';
      }
      if (el.borderRadius) {
        $el.style.borderRadius = Math.round(el.borderRadius * zoom) + 'px';
      }
      if (el.boxShadow) {
        $el.style.boxShadow = el.boxShadow;
      }

      if (el.src) {
        const $img = document.createElement('img');
        $img.src = el.src;
        $img.style.objectPosition = `${el.focalX}% ${el.focalY}%`;
        $img.draggable = false;
        $el.appendChild($img);
      } else {
        const $ph = document.createElement('div');
        $ph.className = 'slide-image-placeholder';
        $ph.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>`;
        $el.appendChild($ph);
      }

    } else if (el.type === 'shape') {
      if (el.stroke && el.strokeWidth) {
        const sw = Math.max(1, Math.round(el.strokeWidth * zoom));
        $el.style.border = `${sw}px solid ${el.stroke}`;
        $el.style.background = (el.fill === 'transparent' || !el.fill) ? 'transparent' : el.fill;
        $el.style.boxSizing = 'border-box';
        $el.style.pointerEvents = 'auto';
      } else {
        $el.style.background = el.fill || 'transparent';
        $el.style.borderRadius = '1px';
      }
    }

    // Make element selectable & draggable
    $el.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.stopPropagation();
      selectSlide(slide.id);
      selectElement(slide.id, el.id);
      if (!el.locked) startDrag(e, $el, slide, el, zoom);
    });

    return $el;
  }

  /* ── Selection helpers ────────────────────── */
  function selectSlide(id) {
    if (STATE.carousel.selectedSlideId === id) return;
    STATE.carousel.selectedSlideId = id;

    document.querySelectorAll('.canvas-slide').forEach($s => {
      $s.classList.toggle('selected', $s.dataset.slideId === id);
    });

    Navigator.setActive(id);
    Inspector.refresh();
  }

  function selectElement(slideId, elId) {
    STATE.carousel.selectedElementId = elId;
    clearElementSelections();
    const $el = document.querySelector(`.canvas-slide[data-slide-id="${slideId}"] .slide-element[data-el-id="${elId}"]`);
    if ($el) $el.classList.add('selected');
    Inspector.refresh();
  }

  function deselectAll() {
    STATE.carousel.selectedElementId = null;
    clearElementSelections();
    Inspector.refresh();
  }

  function clearElementSelections() {
    document.querySelectorAll('.slide-element.selected').forEach($e => $e.classList.remove('selected'));
  }

  /* ── Drag ─────────────────────────────────── */
  function startDrag(e, $el, slide, el, zoom) {
    const startX = e.clientX;
    const startY = e.clientY;
    const origX  = el.x;
    const origY  = el.y;

    _dragState = { active: true };

    const onMove = ev => {
      if (!_dragState?.active) return;
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      el.x = Math.round(origX + dx);
      el.y = Math.round(origY + dy);

      $el.style.left = Math.round(el.x * zoom) + 'px';
      $el.style.top  = Math.round(el.y * zoom) + 'px';
      Inspector.refresh();
    };

    const onUp = () => {
      if (_dragState?.active) {
        _dragState = null;
        HISTORY.snapshot();
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  /* ── Text editing ─────────────────────────── */
  function startTextEdit($elDom, slideId, elId) {
    const el = getElement(slideId, elId);
    if (!el || el.type !== 'text') return;

    $elDom.contentEditable = 'true';
    $elDom.focus();
    $elDom.style.cursor = 'text';

    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents($elDom);
    sel.removeAllRanges();
    sel.addRange(range);

    const onBlur = () => {
      el.content = $elDom.textContent;
      $elDom.contentEditable = 'false';
      $elDom.style.cursor = 'move';
      $elDom.removeEventListener('blur', onBlur);
      HISTORY.snapshot();
      Navigator.rebuild();
    };
    $elDom.addEventListener('blur', onBlur);
  }

  /* ── Context menu ─────────────────────────── */
  function onContextMenu(e) {
    const $slide = e.target.closest('.canvas-slide');
    const $el    = e.target.closest('.slide-element');
    if (!$slide) return;

    e.preventDefault();
    const slideId = $slide.dataset.slideId;
    selectSlide(slideId);

    const items = [];
    if ($el) {
      const elId = $el.dataset.elId;
      selectElement(slideId, elId);
      items.push(
        { label: 'Duplicate element', icon: '⧉', action: () => duplicateElement(slideId, elId) },
        { label: 'Bring forward',     icon: '↑', action: () => {} },
        { label: 'Send backward',     icon: '↓', action: () => {} },
        { type: 'divider' },
        { label: 'Delete element', icon: '✕', danger: true, action: () => deleteElement(slideId, elId) },
      );
    } else {
      const idx = slideIndex(slideId);
      items.push(
        { label: 'Duplicate slide',   icon: '⧉', action: () => duplicateSlide(slideId) },
        { label: 'Add slide after',   icon: '+', action: () => addSlideAfter(idx) },
        { type: 'divider' },
        { label: 'Add text',   icon: 'T', action: () => addTextToSlide(slideId) },
        { label: 'Add image',  icon: '🖼', action: () => triggerImageUpload(slideId) },
        { type: 'divider' },
        { label: 'Move left',  icon: '←', action: () => moveSlide(idx, -1), disabled: idx === 0 },
        { label: 'Move right', icon: '→', action: () => moveSlide(idx, 1), disabled: idx === STATE.carousel.slides.length - 1 },
        { type: 'divider' },
        { label: 'Delete slide', icon: '✕', danger: true, action: () => deleteSlide(slideId) },
      );
    }

    UI.showContextMenu(e.clientX, e.clientY, items);
  }

  /* ── Keyboard shortcuts ─────────────────────── */
  function onKeyDown(e) {
    const tag = document.activeElement.tagName.toLowerCase();
    if (['input', 'textarea'].includes(tag)) return;
    if (document.activeElement.contentEditable === 'true') return;

    const meta = e.metaKey || e.ctrlKey;

    if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); HISTORY.undo(); rebuild(); }
    if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); HISTORY.redo(); rebuild(); }
    if (meta && e.key === 'd') { e.preventDefault(); duplicateSelectedSlide(); }
    if (e.key === 'Escape') { deselectAll(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && STATE.carousel.selectedElementId) {
      e.preventDefault();
      deleteElement(STATE.carousel.selectedSlideId, STATE.carousel.selectedElementId);
    }

    // Arrow keys nudge selected element
    if (STATE.carousel.selectedElementId) {
      const el = getSelectedElement();
      if (!el) return;
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); el.x -= step; updateElementDom(el); }
      if (e.key === 'ArrowRight') { e.preventDefault(); el.x += step; updateElementDom(el); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); el.y -= step; updateElementDom(el); }
      if (e.key === 'ArrowDown')  { e.preventDefault(); el.y += step; updateElementDom(el); }
    }
  }

  function updateElementDom(el) {
    const zoom = STATE.carousel.zoom;
    const $el = document.querySelector(`.slide-element[data-el-id="${el.id}"]`);
    if ($el) {
      $el.style.left = Math.round(el.x * zoom) + 'px';
      $el.style.top  = Math.round(el.y * zoom) + 'px';
    }
    Inspector.refresh();
  }

  /* ── Slide/Element mutations ─────────────── */
  function deleteSlide(id) {
    if (STATE.carousel.slides.length <= 1) { UI.toast('Cannot delete the only slide', '⚠'); return; }
    const idx = slideIndex(id);
    STATE.carousel.slides.splice(idx, 1);
    STATE.carousel.selectedSlideId = STATE.carousel.slides[Math.min(idx, STATE.carousel.slides.length - 1)].id;
    STATE.carousel.selectedElementId = null;
    HISTORY.snapshot();
    rebuild();
    UI.toast('Slide deleted', '✓');
  }

  function duplicateSlide(id) {
    const idx = slideIndex(id);
    const orig = getSlide(id);
    const dupe = JSON.parse(JSON.stringify(orig));
    dupe.id = genId('slide');
    dupe.elements = dupe.elements.map(el => ({ ...el, id: genId(el.type.slice(0,3)) }));
    STATE.carousel.slides.splice(idx + 1, 0, dupe);
    STATE.carousel.selectedSlideId = dupe.id;
    HISTORY.snapshot();
    rebuild();
    UI.toast('Slide duplicated', '⧉');
  }

  function duplicateSelectedSlide() {
    if (STATE.carousel.selectedSlideId) duplicateSlide(STATE.carousel.selectedSlideId);
  }

  function addSlideAfter(idx) {
    const { w, h } = getFormatDims();
    const slide = makeSlide({
      bgColor: STATE.style.bgColor,
      elements: [makeTextElement({
        content: 'New slide', fontSize: 72,
        x: w * 0.08, y: h * 0.35,
        width: w * 0.84, height: h * 0.3,
        color: STATE.style.textColor,
        fontFamily: STATE.style.fontDisplay,
      })],
    });
    STATE.carousel.slides.splice(idx + 1, 0, slide);
    STATE.carousel.selectedSlideId = slide.id;
    HISTORY.snapshot();
    rebuild();
    UI.toast('Slide added', '✓');
  }

  function moveSlide(fromIdx, dir) {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= STATE.carousel.slides.length) return;
    const slides = STATE.carousel.slides;
    [slides[fromIdx], slides[toIdx]] = [slides[toIdx], slides[fromIdx]];
    HISTORY.snapshot();
    rebuild();
  }

  function addTextToSlide(slideId) {
    const slide = getSlide(slideId);
    if (!slide) return;
    const { w, h } = getFormatDims();
    const el = makeTextElement({
      content: 'New text', fontSize: 60,
      x: w * 0.1, y: h * 0.4,
      width: w * 0.8, height: h * 0.2,
      color: STATE.style.textColor,
      fontFamily: STATE.style.fontDisplay,
    });
    slide.elements.push(el);
    STATE.carousel.selectedElementId = el.id;
    HISTORY.snapshot();
    rebuild();
  }

  function deleteElement(slideId, elId) {
    const slide = getSlide(slideId);
    if (!slide) return;
    slide.elements = slide.elements.filter(e => e.id !== elId);
    STATE.carousel.selectedElementId = null;
    HISTORY.snapshot();
    rebuild();
    UI.toast('Element deleted', '✓');
  }

  function duplicateElement(slideId, elId) {
    const slide = getSlide(slideId);
    const el    = getElement(slideId, elId);
    if (!slide || !el) return;
    const dupe = JSON.parse(JSON.stringify(el));
    dupe.id = genId(el.type.slice(0,3));
    dupe.x += 20;
    dupe.y += 20;
    slide.elements.push(dupe);
    STATE.carousel.selectedElementId = dupe.id;
    HISTORY.snapshot();
    rebuild();
  }

  function triggerImageUpload(slideId, elId) {
    const $input = document.getElementById('image-upload-hidden');
    $input.dataset.targetSlide = slideId;
    $input.dataset.targetEl = elId || '';
    $input.click();
  }

  /* ── Zoom ─────────────────────────────────── */
  function setZoom(z) {
    STATE.carousel.zoom = Math.min(1, Math.max(0.15, z));
    document.getElementById('zoom-value').textContent = Math.round(STATE.carousel.zoom * 100) + '%';
    rebuild();
  }

  function zoomIn()  { setZoom(STATE.carousel.zoom + 0.05); }
  function zoomOut() { setZoom(STATE.carousel.zoom - 0.05); }
  function zoomFit() {
    const { w } = getFormatDims();
    const vpW   = $viewport.clientWidth - 120;
    setZoom(parseFloat((vpW / (w * 2.5)).toFixed(2)));
  }

  /* ── Scroll selected into view ─────────────── */
  function scrollToSelected() {
    const id = STATE.carousel.selectedSlideId;
    if (!id) return;
    const $slide = $scrollInner.querySelector(`.canvas-slide[data-slide-id="${id}"]`);
    if ($slide) {
      setTimeout(() => {
        $slide.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 50);
    }
  }

  /* ── Image drop on canvas ─────────────────── */
  function handleImageFile(file, slideId, elId) {
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target.result;
      const slide = getSlide(slideId);
      if (!slide) return;

      if (elId) {
        const el = getElement(slideId, elId);
        if (el) { el.src = src; HISTORY.snapshot(); rebuild(); return; }
      }

      // Create new image element
      const { w, h } = getFormatDims();
      const el = makeImageElement({ x: 0, y: 0, width: w, height: h, src });
      slide.elements.unshift(el); // behind everything
      STATE.carousel.selectedElementId = el.id;
      HISTORY.snapshot();
      rebuild();
      UI.toast('Image added', '🖼');
    };
    reader.readAsDataURL(file);
  }

  return {
    init, rebuild, selectSlide, selectElement,
    deleteSlide, duplicateSlide, addSlideAfter, moveSlide,
    addTextToSlide, deleteElement, triggerImageUpload,
    handleImageFile, setZoom, zoomIn, zoomOut, zoomFit,
  };
})();
