/* ─────────────────────────────────────────────
   CAROUSEL. — App Bootstrap & Smart Composer
   ───────────────────────────────────────────── */

/* ── HEIC / image conversion helper ───────── */
function convertImageFile(file) {
  return new Promise((resolve) => {
    const name = (file.name || '').toLowerCase();
    const isHeic = name.endsWith('.heic') || name.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';

    if (!isHeic) {
      resolve(file);
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(url);
          if (blob) {
            const converted = new File([blob], file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), { type: 'image/jpeg' });
            resolve(converted);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.92);
      } catch (e) {
        URL.revokeObjectURL(url);
        resolve(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      UI.toast('HEIC format decoded with fallback', 'ℹ');
      resolve(file);
    };
    img.src = url;
  });
}

/* ── Recursive Folder Traversal for Web ───── */
async function getFilesFromDataTransfer(dataTransfer) {
  const files = [];
  const items = dataTransfer.items;
  if (items && items.length && items[0].webkitGetAsEntry) {
    const entries = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) entries.push(entry);
    }
    for (const entry of entries) {
      await traverseFileTree(entry, files);
    }
  } else {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      files.push(dataTransfer.files[i]);
    }
  }
  return files.filter(f => f.type.startsWith('image/') || /\.(heic|heif|jpg|jpeg|png|webp|svg|gif|avif)$/i.test(f.name));
}

function traverseFileTree(item, fileList) {
  return new Promise((resolve) => {
    if (item.isFile) {
      item.file((file) => {
        fileList.push(file);
        resolve();
      }, () => resolve());
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      const readEntries = () => {
        dirReader.readEntries(async (entries) => {
          if (entries.length === 0) {
            resolve();
          } else {
            for (const entry of entries) {
              await traverseFileTree(entry, fileList);
            }
            readEntries();
          }
        }, () => resolve());
      };
      readEntries();
    } else {
      resolve();
    }
  });
}

/* ── Smart Composer Modal State & Manager ─── */
let _smartComposerImages = [];

function openSmartComposeModal(initialImages = []) {
  const $modal = document.getElementById('smart-compose-modal');
  if (!$modal) return;

  if (initialImages && initialImages.length) {
    initialImages.forEach(img => {
      if (typeof img === 'string') {
        if (!_smartComposerImages.some(x => x.src === img)) {
          _smartComposerImages.push({ src: img, name: 'Image' });
        }
      } else if (img.src && !_smartComposerImages.some(x => x.src === img.src)) {
        _smartComposerImages.push(img);
      }
    });
  }

  _renderSmartPreviewStrip();
  $modal.classList.add('active');
}

function closeSmartComposeModal() {
  document.getElementById('smart-compose-modal')?.classList.remove('active');
}

function _renderSmartPreviewStrip() {
  const $strip = document.getElementById('smart-images-preview-strip');
  const $section = document.getElementById('smart-images-preview-section');
  const $badge = document.getElementById('smart-image-count-badge');
  const $count = document.getElementById('smart-loaded-count');

  const count = _smartComposerImages.length;
  if ($badge) $badge.textContent = `${count} photos loaded`;
  if ($count) $count.textContent = count;

  if (count === 0) {
    if ($section) $section.style.display = 'none';
    return;
  }

  if ($section) $section.style.display = 'block';
  if ($strip) {
    $strip.innerHTML = _smartComposerImages.map((img, i) => `
      <div class="smart-preview-thumb" title="${img.name || `Photo ${i+1}`}">
        <img src="${img.src}" draggable="false" />
        <div style="position:absolute;bottom:0;left:0;right:0;padding:2px 4px;background:rgba(0,0,0,0.6);font-size:8px;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${i + 1}
        </div>
      </div>
    `).join('');
  }
}

async function handleSmartFilesBatch(files) {
  if (!files || !files.length) return;
  UI.toast(`Importing ${files.length} images…`, '⏳');

  let imported = 0;
  for (const rawFile of files) {
    const file = await convertImageFile(rawFile);
    if (!file) continue;
    await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = ev => {
        const item = { src: ev.target.result, name: file.name };
        _smartComposerImages.push(item);
        if (typeof LeftPanel !== 'undefined' && LeftPanel.addToLibrary) {
          LeftPanel.addToLibrary(file);
        }
        imported++;
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }

  _renderSmartPreviewStrip();
  openSmartComposeModal();
  UI.toast(`${imported} images imported and ready!`, '✓');
}

document.addEventListener('DOMContentLoaded', () => {

  /* ── Landing screen actions ───────────────── */
  document.getElementById('btn-smart-create')?.addEventListener('click', () => {
    openSmartComposeModal();
  });

  document.getElementById('btn-create')?.addEventListener('click', () => {
    UI.showScreen('screen-wizard');
    UI.wizardGoTo(0);
  });

  document.getElementById('btn-view-demo')?.addEventListener('click', () => {
    // Generate Lookbook demo carousel directly
    STATE.wizard.slideCount = 7;
    STATE.wizard.composition = 'lookbook';
    STATE.wizard.artDirection = 'lookbook';
    STATE.carousel.format = 'portrait';
    STATE.style.accentColor = '#ff2a2a';
    STATE.style.badgeText = 'SUNDAY\nOOTD';

    smartComposeCarousel([], {
      template: 'lookbook',
      format: 'portrait',
      accentColor: '#ff2a2a',
      badgeText: 'SUNDAY\nOOTD',
      slideCount: 7,
    });

    UI.showScreen('screen-editor');
    Canvas.rebuild();
    LeftPanel.buildStylePanel();
    LeftPanel.buildImagesPanel();
    LeftPanel.buildElementsPanel();
    Navigator.rebuild();
    setTimeout(() => { Canvas.zoomFit(); UI.toast('Street Lookbook demo loaded!', '✦'); }, 200);
  });

  /* ── Smart Composer Modal Event Bindings ──── */
  document.getElementById('smart-compose-cancel')?.addEventListener('click', closeSmartComposeModal);

  // Folder browse button in modal
  document.getElementById('btn-smart-browse-folder')?.addEventListener('click', () => {
    document.getElementById('folder-upload-hidden')?.click();
  });

  // Batch photos browse button in modal
  document.getElementById('btn-smart-browse-files')?.addEventListener('click', () => {
    document.getElementById('batch-photos-upload-hidden')?.click();
  });

  // Load Lookbook Demo Photos button in modal
  document.getElementById('btn-smart-load-demo')?.addEventListener('click', () => {
    LOOKBOOK_DEMO_IMAGES.forEach((url, i) => {
      if (!_smartComposerImages.some(x => x.src === url)) {
        _smartComposerImages.push({ src: url, name: `Lookbook Model ${i+1}` });
      }
    });
    _renderSmartPreviewStrip();
    UI.toast('Lookbook demo photos loaded', '✦');
  });

  // Clear loaded images
  document.getElementById('btn-smart-clear-images')?.addEventListener('click', () => {
    _smartComposerImages = [];
    _renderSmartPreviewStrip();
  });

  // Drag and drop into smart modal dropzone
  const $smartDrop = document.getElementById('smart-modal-dropzone');
  $smartDrop?.addEventListener('dragover', e => {
    e.preventDefault();
    e.currentTarget.style.borderColor = 'var(--c-accent)';
  });
  $smartDrop?.addEventListener('dragleave', e => {
    e.currentTarget.style.borderColor = 'var(--c-border)';
  });
  $smartDrop?.addEventListener('drop', async e => {
    e.preventDefault();
    e.currentTarget.style.borderColor = 'var(--c-border)';
    const files = await getFilesFromDataTransfer(e.dataTransfer);
    handleSmartFilesBatch(files);
  });

  // Template cards selection
  document.querySelectorAll('.smart-template-card').forEach($c => {
    $c.addEventListener('click', () => {
      document.querySelectorAll('.smart-template-card').forEach(x => {
        x.classList.remove('selected');
        const check = x.querySelector('div:last-child');
        if (check && check.textContent === '✓') check.remove();
      });
      $c.classList.add('selected');
      const $chk = document.createElement('div');
      $chk.style.color = 'var(--c-accent)';
      $chk.style.fontSize = '16px';
      $chk.textContent = '✓';
      $c.appendChild($chk);
    });
  });

  // Canvas size chips selection
  document.querySelectorAll('[data-smart-format]').forEach($f => {
    $f.addEventListener('click', () => {
      document.querySelectorAll('[data-smart-format]').forEach(x => x.classList.remove('selected'));
      $f.classList.add('selected');
    });
  });

  // Stamp badge text chips
  document.querySelectorAll('.smart-badge-chip').forEach($chip => {
    $chip.addEventListener('click', () => {
      const inp = document.getElementById('smart-badge-input');
      if (inp) inp.value = $chip.dataset.badge;
    });
  });

  // Accent color swatches
  document.querySelectorAll('.smart-color-swatch').forEach($sw => {
    $sw.addEventListener('click', () => {
      document.querySelectorAll('.smart-color-swatch').forEach(x => x.classList.remove('selected'));
      $sw.classList.add('selected');
      const picker = document.getElementById('smart-accent-color-picker');
      if (picker) picker.value = $sw.dataset.color;
    });
  });
  document.getElementById('smart-accent-color-picker')?.addEventListener('input', e => {
    document.querySelectorAll('.smart-color-swatch').forEach(x => x.classList.remove('selected'));
  });

  // Confirm / Compose Smart Carousel
  document.getElementById('smart-compose-confirm')?.addEventListener('click', () => {
    const selectedTmpl = document.querySelector('.smart-template-card.selected')?.dataset.smartTemplate || 'lookbook';
    const selectedFormat = document.querySelector('[data-smart-format].selected')?.dataset.smartFormat || 'portrait';
    const accentColor = document.getElementById('smart-accent-color-picker')?.value || '#ff2a2a';
    const badgeText = document.getElementById('smart-badge-input')?.value || 'SUNDAY\nOOTD';

    // Calculate smart slide count based on photo count (default 7 for complete lookbook experience)
    const photoCount = _smartComposerImages.length;
    let slideCount = 7;
    if (photoCount >= 10) slideCount = 8;
    else if (photoCount <= 3 && photoCount > 0) slideCount = 5;

    smartComposeCarousel(_smartComposerImages, {
      template: selectedTmpl,
      format: selectedFormat,
      accentColor: accentColor,
      badgeText: badgeText,
      slideCount: slideCount,
    });

    closeSmartComposeModal();
    UI.showScreen('screen-editor');
    Canvas.rebuild();
    LeftPanel.buildStylePanel();
    LeftPanel.buildImagesPanel();
    LeftPanel.buildElementsPanel();
    Navigator.rebuild();
    setTimeout(() => {
      Canvas.zoomFit();
      UI.toast(`✨ Smart Carousel created with ${slideCount} slides!`, '✦');
    }, 200);
  });

  /* ── Hidden Upload Inputs: Folder & Batch ─── */
  const $folderInput = document.getElementById('folder-upload-hidden');
  $folderInput?.addEventListener('change', async e => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/') || /\.(heic|heif|jpg|jpeg|png|webp|svg|gif|avif)$/i.test(f.name));
    if (files.length) {
      await handleSmartFilesBatch(files);
      $folderInput.value = '';
    }
  });

  const $batchInput = document.getElementById('batch-photos-upload-hidden');
  $batchInput?.addEventListener('change', async e => {
    const files = Array.from(e.target.files);
    if (files.length) {
      await handleSmartFilesBatch(files);
      $batchInput.value = '';
    }
  });

  /* ── Wizard Options ───────────────────────── */
  document.querySelectorAll('.count-pill').forEach($p => {
    $p.addEventListener('click', () => {
      document.querySelectorAll('.count-pill').forEach($x => $x.classList.remove('selected'));
      $p.classList.add('selected');
      STATE.wizard.slideCount = parseInt($p.dataset.count, 10);
    });
  });
  document.querySelector(`.count-pill[data-count="${STATE.wizard.slideCount}"]`)?.classList.add('selected');

  document.querySelectorAll('[data-composition-pick]').forEach($c => {
    $c.addEventListener('click', () => {
      document.querySelectorAll('[data-composition-pick]').forEach($x => $x.classList.remove('selected'));
      $c.classList.add('selected');
      STATE.wizard.composition = $c.dataset.compositionPick;
      if ($c.dataset.compositionPick === 'lookbook') {
        STATE.wizard.artDirection = 'lookbook';
        STATE.style.accentColor = '#ff2a2a';
      }
    });
  });

  document.querySelectorAll('[data-format-pick]').forEach($c => {
    $c.addEventListener('click', () => {
      document.querySelectorAll('[data-format-pick]').forEach($x => $x.classList.remove('selected'));
      $c.classList.add('selected');
      STATE.carousel.format = $c.dataset.formatPick;
    });
  });

  document.querySelectorAll('[data-content-pick]').forEach($c => {
    $c.addEventListener('click', () => {
      document.querySelectorAll('[data-content-pick]').forEach($x => $x.classList.remove('selected'));
      $c.classList.add('selected');
      STATE.wizard.contentMode = $c.dataset.contentPick;
    });
  });

  document.querySelectorAll('[data-artdir-pick]').forEach($c => {
    $c.addEventListener('click', () => {
      document.querySelectorAll('[data-artdir-pick]').forEach($x => $x.classList.remove('selected'));
      $c.classList.add('selected');
      STATE.wizard.artDirection = $c.dataset.artdirPick;
      if ($c.dataset.artdirPick === 'lookbook') {
        STATE.wizard.composition = 'lookbook';
        STATE.style.accentColor = '#ff2a2a';
      }
    });
  });

  document.getElementById('wizard-next-btn')?.addEventListener('click', UI.wizardNext.bind(UI));
  document.getElementById('wizard-back-btn')?.addEventListener('click', UI.wizardBack.bind(UI));

  /* ── Toolbar Actions ──────────────────────── */
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

  // Smart Compose Toolbar Button
  document.getElementById('btn-tb-smart-compose')?.addEventListener('click', () => {
    openSmartComposeModal();
  });

  // Shuffle Toolbar Button
  document.getElementById('btn-tb-shuffle')?.addEventListener('click', () => {
    shuffleCarouselImages();
    UI.toast('Images shuffled across slides', '🔀');
  });

  document.getElementById('carousel-title')?.addEventListener('change', e => {
    STATE.carousel.title = e.target.value || 'Untitled Carousel';
  });

  Events.on('history:change', () => {
    const $undo = document.getElementById('btn-undo');
    const $redo = document.getElementById('btn-redo');
    if ($undo) $undo.style.opacity = HISTORY.canUndo() ? '1' : '0.3';
    if ($redo) $redo.style.opacity = HISTORY.canRedo() ? '1' : '0.3';
  });

  /* ── Left panel tabs ──────────────────────── */
  LeftPanel.init();

  /* ── Hidden single image upload input ─────── */
  const $upload = document.getElementById('image-upload-hidden');
  $upload?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const slideId = $upload.dataset.targetSlide;
    const elId    = $upload.dataset.targetEl || null;
    const isLibraryMode = $upload.dataset.libraryMode === 'true';

    for (const rawFile of files) {
      const file = await convertImageFile(rawFile);
      if (!file) continue;
      
      if (isLibraryMode) {
        const reader = new FileReader();
        reader.onload = ev => {
          const item = { src: ev.target.result, name: file.name };
          _smartComposerImages.push(item);
          const event = new CustomEvent('image-library-add', { detail: { file, dataUrl: ev.target.result } });
          document.dispatchEvent(event);
        };
        reader.readAsDataURL(file);
      } else if (slideId) {
        Canvas.handleImageFile(file, slideId, elId);
      }
    }
    $upload.value = '';
    $upload.dataset.libraryMode = 'false';
  });

  /* ── Drag & drop on Canvas & Whole Window ─── */
  window.addEventListener('dragover', e => { e.preventDefault(); });
  window.addEventListener('drop', async e => {
    // Only capture if not inside specific text inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    const files = await getFilesFromDataTransfer(e.dataTransfer);
    if (files.length) {
      handleSmartFilesBatch(files);
    }
  });

  /* ── Keyboard shortcuts ───────────────────── */
  document.addEventListener('keydown', e => {
    if (document.getElementById('screen-editor').classList.contains('active')) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'p') { e.preventDefault(); Preview.open(0); }
      if (meta && e.key === 'e') { e.preventDefault(); Exporter.openModal(); }
    }
  });

  /* ── Canvas wheel zoom ────────────────────── */
  const $viewport = document.getElementById('canvas-viewport');
  $viewport?.addEventListener('wheel', e => {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) Canvas.zoomIn();
      else Canvas.zoomOut();
    }
  }, { passive: false });

  /* ── Font Manager Modal Controller ─────────── */
  let _activeFontFilter = 'all';
  let _fontSearchQuery = '';

  function openFontManagerModal() {
    const $modal = document.getElementById('font-manager-modal');
    if (!$modal) return;
    $modal.classList.remove('hidden');
    $modal.style.display = 'flex';
    renderFontCards(_activeFontFilter, _fontSearchQuery);
    updateSpecimenPreview(STATE.style.fontDisplay);
  }

  function closeFontManagerModal() {
    const $modal = document.getElementById('font-manager-modal');
    if (!$modal) return;
    $modal.classList.add('hidden');
    $modal.style.display = 'none';
  }

  function renderFontCards(filter = 'all', searchQuery = '') {
    const $container = document.getElementById('font-cards-container');
    if (!$container || typeof Fonts === 'undefined') return;

    const laptopList = Fonts.getLaptopFonts();
    const customList = Fonts.getCustomFonts();
    const systemList = Fonts.getSystemFonts();
    const webList = Fonts.getWebFonts();

    // Update counts in filter chips
    const totalCount = laptopList.length + customList.length + systemList.length + webList.length;
    const countAll = document.getElementById('count-all-fonts');
    const countLaptop = document.getElementById('count-laptop-fonts');
    const countCustom = document.getElementById('count-custom-fonts');
    const countSystem = document.getElementById('count-system-fonts');
    const countWeb = document.getElementById('count-web-fonts');

    if (countAll) countAll.textContent = totalCount;
    if (countLaptop) countLaptop.textContent = laptopList.length;
    if (countCustom) countCustom.textContent = customList.length;
    if (countSystem) countSystem.textContent = systemList.length;
    if (countWeb) countWeb.textContent = webList.length;

    let fonts = [];

    if (filter === 'all' || filter === 'custom') {
      customList.forEach(f => fonts.push({ name: f, type: 'custom', label: 'Custom' }));
    }
    if (filter === 'all' || filter === 'laptop') {
      laptopList.forEach(f => fonts.push({ name: f, type: 'laptop', label: 'Laptop' }));
    }
    if (filter === 'all' || filter === 'system') {
      systemList.forEach(f => fonts.push({ name: f, type: 'system', label: 'macOS/Win' }));
    }
    if (filter === 'all' || filter === 'web') {
      webList.forEach(f => fonts.push({ name: f, type: 'web', label: 'Editorial' }));
    }

    // Deduplicate by name
    const seen = new Set();
    fonts = fonts.filter(item => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      fonts = fonts.filter(item => item.name.toLowerCase().includes(q));
    }

    if (fonts.length === 0) {
      $container.innerHTML = `
        <div style="grid-column:1/-1;padding:40px 20px;text-align:center;color:var(--c-text-3);">
          <div style="font-size:28px;margin-bottom:8px;">🔍</div>
          <div style="font-size:13px;font-weight:600;margin-bottom:4px;">No fonts found matching "${searchQuery}"</div>
          <div style="font-size:11px;">Try clicking "Scan Installed Laptop Fonts" or import a .ttf/.otf font file.</div>
        </div>
      `;
      return;
    }

    const selectedEl = getSelectedElement();
    const hasSelectedText = selectedEl && selectedEl.type === 'text';

    $container.innerHTML = fonts.map(f => {
      const isCurrentDisplay = STATE.style.fontDisplay.toLowerCase() === f.name.toLowerCase();
      const isCurrentBody = (STATE.style.fontBody || 'Inter').toLowerCase() === f.name.toLowerCase();
      return `
        <div class="font-specimen-card${isCurrentDisplay ? ' active-display' : ''}" data-font-family="${f.name}">
          <div class="font-card-meta">
            <div style="display:flex;align-items:center;gap:6px;min-width:0;">
              <span style="font-weight:700;font-size:12px;color:var(--c-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${f.name}
              </span>
              ${isCurrentDisplay ? '<span style="font-size:9px;color:var(--c-accent);font-weight:700;">★ DISPLAY</span>' : ''}
              ${isCurrentBody ? '<span style="font-size:9px;color:#60a5fa;font-weight:700;">BODY</span>' : ''}
            </div>
            <span class="font-badge ${f.type}">${f.label}</span>
          </div>

          <div class="font-specimen-preview" style="font-family:'${f.name}', sans-serif;">
            Aa Bb Gg 123 — Editorial
          </div>

          <div style="display:flex;gap:4px;margin-top:2px;">
            <button class="btn-ghost font-set-display-btn" data-font="${f.name}" style="flex:1;height:24px;font-size:10px;padding:0 4px;justify-content:center;background:var(--c-surface-1);">
              Set Display
            </button>
            <button class="btn-ghost font-set-body-btn" data-font="${f.name}" style="flex:1;height:24px;font-size:10px;padding:0 4px;justify-content:center;background:var(--c-surface-1);">
              Set Body
            </button>
            ${hasSelectedText ? `
              <button class="btn-ghost font-apply-selection-btn" data-font="${f.name}" style="height:24px;font-size:10px;padding:0 6px;justify-content:center;border-color:var(--c-accent);color:var(--c-accent);background:var(--c-surface-1);">
                Apply
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Wire specimen click & buttons
    $container.querySelectorAll('.font-specimen-card').forEach($card => {
      $card.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        const font = $card.dataset.fontFamily;
        updateSpecimenPreview(font);
      });
    });

    $container.querySelectorAll('.font-set-display-btn').forEach($btn => {
      $btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const font = $btn.dataset.font;
        STATE.style.fontDisplay = font;
        STATE.carousel.slides.forEach(s => {
          s.elements.forEach(el => {
            if (el.type === 'text' && (el.role === 'hero' || el.role === 'label' || !el.role)) {
              el.fontFamily = font;
            }
          });
        });
        HISTORY.snapshot();
        Canvas.rebuild();
        LeftPanel.buildStylePanel();
        Inspector.refresh();
        renderFontCards(_activeFontFilter, _fontSearchQuery);
        updateSpecimenPreview(font);
        UI.toast(`Headline font set to "${font}"`, 'Aa');
      });
    });

    $container.querySelectorAll('.font-set-body-btn').forEach($btn => {
      $btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const font = $btn.dataset.font;
        STATE.style.fontBody = font;
        STATE.carousel.slides.forEach(s => {
          s.elements.forEach(el => {
            if (el.type === 'text' && (el.role === 'supporting' || el.role === 'info')) {
              el.fontFamily = font;
            }
          });
        });
        HISTORY.snapshot();
        Canvas.rebuild();
        LeftPanel.buildStylePanel();
        Inspector.refresh();
        renderFontCards(_activeFontFilter, _fontSearchQuery);
        updateSpecimenPreview(font);
        UI.toast(`Body font set to "${font}"`, 'Aa');
      });
    });

    $container.querySelectorAll('.font-apply-selection-btn').forEach($btn => {
      $btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const font = $btn.dataset.font;
        const el = getSelectedElement();
        if (el && el.type === 'text') {
          el.fontFamily = font;
          HISTORY.snapshot();
          Canvas.rebuild();
          Inspector.refresh();
          updateSpecimenPreview(font);
          UI.toast(`Applied "${font}" to selected text`, 'Aa');
        }
      });
    });
  }

  function updateSpecimenPreview(font) {
    const $sample = document.getElementById('font-specimen-sample');
    const $name = document.getElementById('font-specimen-name');
    if ($sample) {
      $sample.style.fontFamily = `"${font}", sans-serif`;
    }
    if ($name) {
      $name.textContent = font;
    }
  }

  // Toolbar font button
  document.getElementById('btn-tb-fonts')?.addEventListener('click', openFontManagerModal);
  document.getElementById('font-manager-close')?.addEventListener('click', closeFontManagerModal);
  document.getElementById('font-manager-done-btn')?.addEventListener('click', closeFontManagerModal);

  // Scan laptop fonts modal button
  document.getElementById('btn-scan-laptop-fonts-modal')?.addEventListener('click', async () => {
    if (typeof Fonts === 'undefined') return;
    UI.toast('Accessing installed laptop fonts...', '⏳');
    const res = await Fonts.scanLaptopFonts();
    if (res.success) {
      UI.toast(`Discovered ${res.count} fonts from your laptop!`, '💻');
      _activeFontFilter = 'laptop';
      document.querySelectorAll('#font-filter-chips .style-chip').forEach($c => {
        $c.classList.toggle('selected', $c.dataset.fontFilter === 'laptop');
      });
      renderFontCards(_activeFontFilter, _fontSearchQuery);
      LeftPanel.buildStylePanel();
      Inspector.refresh();
    } else {
      alert(res.error);
    }
  });

  // Import font file button
  document.getElementById('btn-import-font-file-modal')?.addEventListener('click', () => {
    document.getElementById('font-upload-hidden')?.click();
  });

  document.getElementById('font-upload-hidden')?.addEventListener('change', async (e) => {
    if (typeof Fonts === 'undefined') return;
    const files = Array.from(e.target.files);
    if (!files.length) return;
    for (const f of files) {
      try {
        const loadedName = await Fonts.importFontFile(f);
        UI.toast(`Imported font "${loadedName}"!`, '🌟');
      } catch (err) {
        UI.toast(`Could not load ${f.name}`, '⚠');
      }
    }
    e.target.value = '';
    _activeFontFilter = 'custom';
    document.querySelectorAll('#font-filter-chips .style-chip').forEach($c => {
      $c.classList.toggle('selected', $c.dataset.fontFilter === 'custom');
    });
    renderFontCards(_activeFontFilter, _fontSearchQuery);
    LeftPanel.buildStylePanel();
    Inspector.refresh();
  });

  // Filter chips in modal
  document.querySelectorAll('#font-filter-chips .style-chip').forEach($chip => {
    $chip.addEventListener('click', () => {
      document.querySelectorAll('#font-filter-chips .style-chip').forEach($x => $x.classList.remove('selected'));
      $chip.classList.add('selected');
      _activeFontFilter = $chip.dataset.fontFilter;
      renderFontCards(_activeFontFilter, _fontSearchQuery);
    });
  });

  // Search input in modal
  document.getElementById('font-search-input')?.addEventListener('input', (e) => {
    _fontSearchQuery = e.target.value;
    renderFontCards(_activeFontFilter, _fontSearchQuery);
  });

  // Expose on App
  window.App = {
    openFontManagerModal,
    closeFontManagerModal,
    openSmartComposeModal,
    closeSmartComposeModal,
  };

  /* ── Module inits ─────────────────────────── */
  if (typeof Fonts !== 'undefined') Fonts.init();
  Canvas.init();
  Navigator.init();
  Preview.init();
  Exporter.init();

  /* ── Start on landing ─────────────────────── */
  UI.showScreen('screen-landing');
});
