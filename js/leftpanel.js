/* ─────────────────────────────────────────────
   CAROUSEL. — Left Panel (Style Controls)
   ───────────────────────────────────────────── */

const LeftPanel = (() => {
  function init() {
    // Tab switching
    document.querySelectorAll('.panel-tab').forEach($tab => {
      $tab.addEventListener('click', () => {
        STATE.ui.leftTab = $tab.dataset.tab;
        document.querySelectorAll('.panel-tab').forEach($t => $t.classList.toggle('active', $t.dataset.tab === STATE.ui.leftTab));
        document.querySelectorAll('.panel-tab-content').forEach($c => $c.classList.toggle('hidden', $c.dataset.tabContent !== STATE.ui.leftTab));
      });
    });

    // Listen for image library additions from the file input
    document.addEventListener('image-library-add', (e) => {
      const { file, dataUrl } = e.detail;
      _imageLibrary.push({ src: dataUrl, name: file.name });
      const $section = document.getElementById('uploaded-images-section');
      if ($section) $section.style.display = '';
      _renderImageGrid();

      // Add to selected slide
      const slideId = STATE.carousel.selectedSlideId;
      if (slideId) {
        Canvas.handleImageFile(file, slideId, null);
      }
    });
  }

  function buildStylePanel() {
    const $body = document.getElementById('panel-style-content');
    if (!$body) return;

    $body.innerHTML = `
      <!-- Art Direction -->
      <div class="panel-section">
        <div class="panel-section-title">Art Direction</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${Object.entries(ART_DIRECTIONS).map(([key, dir]) => `
            <div class="art-direction-badge${STATE.wizard.artDirection === key ? ' selected' : ''}"
                 data-direction="${key}" style="--card-color:${dir.color};">
              <div class="art-direction-dot" style="background:${dir.color};"></div>
              <div>
                <div class="art-direction-name">${dir.label}</div>
              </div>
              ${STATE.wizard.artDirection === key ? '<div class="art-direction-hint">Active</div>' : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Typography -->
      <div class="panel-section">
        <div class="panel-section-title">Typography</div>
        <div class="font-select-row">
          <select class="panel-select" id="global-font-display">
            ${['Playfair Display','DM Serif Display','Cormorant Garamond','Libre Baskerville','IM Fell English'].map(f =>
              `<option value="${f}" ${STATE.style.fontDisplay === f ? 'selected':''}>${f}</option>`).join('')}
          </select>
        </div>
        <div class="font-select-row">
          <select class="panel-select" id="global-font-body">
            ${['Inter','Space Grotesk','DM Sans','IBM Plex Mono','Outfit'].map(f =>
              `<option value="${f}" ${STATE.style.fontBody === f ? 'selected':''}>${f}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Colour Palette -->
      <div class="panel-section">
        <div class="panel-section-title">Palette</div>
        <div class="swatch-row" style="flex-wrap:wrap;gap:6px;">
          ${[
            ['#0d0d0f','#f5f5f7','#ff2a2a'],
            ['#111111','#f0ede8','#c9a96e'],
            ['#0d0f14','#e8e4dc','#6b9fd4'],
            ['#ffffff','#000000','#e05c5c'],
            ['#f5f5f3','#1a1a1a','#888888'],
            ['#0f0a18','#e8e0f0','#d4a0e0'],
            ['#0c0a06','#f0ede4','#c9a96e'],
          ].map(([bg,text,accent]) => `
            <div class="swatch" title="BG: ${bg}"
                 style="background:${bg};border:2px solid ${accent === STATE.style.accentColor && bg === STATE.style.bgColor ? 'var(--c-text)' : 'transparent'};"
                 data-palette-bg="${bg}" data-palette-text="${text}" data-palette-accent="${accent}">
            </div>
          `).join('')}
        </div>
        <div style="margin-top:10px;">
          <div style="font-size:10px;color:var(--c-text-3);margin-bottom:4px;">Custom BG</div>
          <div style="display:flex;gap:6px;align-items:center;">
            <input type="color" id="custom-bg-color" value="${STATE.style.bgColor}" style="width:28px;height:24px;border:none;background:none;cursor:pointer;padding:0;border-radius:3px;">
            <input class="property-input" id="custom-bg-hex" value="${STATE.style.bgColor}" style="flex:1;font-size:11px;">
          </div>
        </div>
      </div>

      <!-- Composition -->
      <div class="panel-section">
        <div class="panel-section-title">Composition</div>
        <div class="style-chips">
          ${['lookbook','cinematic','symmetric','asymmetric'].map(c => `
            <div class="style-chip${STATE.wizard.composition === c ? ' selected':''}" data-composition="${c}">${c === 'lookbook' ? '✦ lookbook' : c}</div>
          `).join('')}
        </div>
      </div>

      <!-- Stamp / Badge -->
      <div class="panel-section">
        <div class="panel-section-title">Editorial Badge Stamp</div>
        <input class="property-input" id="global-badge-text" value="${STATE.style.badgeText || 'SUNDAY\nOOTD'}" placeholder="e.g. SUNDAY OOTD" style="width:100%;font-size:11px;">
        <div style="font-size:9px;color:var(--c-text-3);margin-top:4px;">Appears on framed hero and lookbook slides</div>
      </div>

      <!-- Format -->
      <div class="panel-section">
        <div class="panel-section-title">Format</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          ${Object.entries(FORMATS).map(([key, fmt]) => `
            <div class="style-chip${STATE.carousel.format === key ? ' selected':''}" data-format="${key}"
                 style="display:flex;flex-direction:column;align-items:flex-start;padding:8px 10px;font-size:10px;" title="${fmt.desc}">
              <span style="font-weight:700;">${fmt.icon} ${fmt.label}</span>
              <span style="font-size:9px;color:var(--c-text-3);margin-top:2px;">${fmt.w}×${fmt.h}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Regenerate -->
      <div class="panel-section">
        <button class="btn-primary" id="btn-regenerate" style="width:100%;justify-content:center;">
          ↺ Regenerate layouts
        </button>
      </div>
    `;

    // Bindings
    $body.querySelectorAll('[data-direction]').forEach($b => {
      $b.addEventListener('click', () => {
        STATE.wizard.artDirection = $b.dataset.direction;
        const dir = ART_DIRECTIONS[$b.dataset.direction];
        STATE.style.bgColor    = dir.bg;
        STATE.style.textColor  = dir.text;
        STATE.style.accentColor= dir.accent;
        STATE.style.fontDisplay= dir.font;
        buildStylePanel();
        generateCarousel();
        Canvas.rebuild();
        UI.toast(`Art direction: ${dir.label}`, '✦');
      });
    });

    $body.querySelectorAll('[data-palette-bg]').forEach($s => {
      $s.addEventListener('click', () => {
        STATE.style.bgColor     = $s.dataset.paletteBg;
        STATE.style.textColor   = $s.dataset.palettText || $s.dataset.paletteText || '#f0ede8';
        STATE.style.accentColor = $s.dataset.paletteAccent;
        document.getElementById('custom-bg-color').value = STATE.style.bgColor;
        document.getElementById('custom-bg-hex').value   = STATE.style.bgColor;
        // Apply bg to all slides
        STATE.carousel.slides.forEach(s => s.bgColor = STATE.style.bgColor);
        HISTORY.snapshot();
        Canvas.rebuild();
        buildStylePanel();
      });
    });

    ['custom-bg-color','custom-bg-hex'].forEach(id => {
      const $el = $body.querySelector(`#${id}`);
      $el?.addEventListener(id.endsWith('color') ? 'input' : 'change', e => {
        STATE.style.bgColor = e.target.value;
        $body.querySelector('#custom-bg-color').value = e.target.value;
        $body.querySelector('#custom-bg-hex').value   = e.target.value;
        const slide = getSelectedSlide();
        if (slide) {
          slide.bgColor = e.target.value;
          const $cs = document.querySelector(`.canvas-slide[data-slide-id="${slide.id}"]`);
          if ($cs) $cs.style.background = slide.bgColor;
        }
        if (id.endsWith('hex')) HISTORY.snapshot();
      });
    });

    $body.querySelectorAll('[data-composition]').forEach($c => {
      $c.addEventListener('click', () => {
        STATE.wizard.composition = $c.dataset.composition;
        buildStylePanel();
        generateCarousel();
        HISTORY.snapshot();
        Canvas.rebuild();
        UI.toast(`Composition: ${$c.dataset.composition}`, '✦');
      });
    });

    $body.querySelectorAll('[data-format]').forEach($f => {
      $f.addEventListener('click', () => {
        STATE.carousel.format = $f.dataset.format;
        // Rebuild slides with new dimensions
        STATE.carousel.slides.forEach(s => {
          const { w, h } = getFormatDims();
          s.width = w; s.height = h;
        });
        buildStylePanel();
        HISTORY.snapshot();
        Canvas.rebuild();
        UI.toast(`Format: ${FORMATS[$f.dataset.format].label}`, '✦');
      });
    });

    $body.querySelector('#global-font-display')?.addEventListener('change', e => {
      STATE.style.fontDisplay = e.target.value;
      // Apply to all text elements
      STATE.carousel.slides.forEach(s => {
        s.elements.forEach(el => {
          if (el.type === 'text' && (el.role === 'hero' || el.role === 'label')) {
            el.fontFamily = e.target.value;
          }
        });
      });
      HISTORY.snapshot();
      Canvas.rebuild();
    });

    $body.querySelector('#global-badge-text')?.addEventListener('change', e => {
      STATE.style.badgeText = e.target.value;
      STATE.carousel.slides.forEach(s => {
        s.elements.forEach(el => {
          if (el.isBadge) el.content = e.target.value;
        });
      });
      HISTORY.snapshot();
      Canvas.rebuild();
    });

    $body.querySelector('#btn-regenerate')?.addEventListener('click', () => {
      generateCarousel();
      HISTORY.snapshot();
      Canvas.rebuild();
      UI.toast('Layouts regenerated', '↺');
    });
  }

  // Global image library (persists across panel rebuilds)
  const _imageLibrary = [];

  function buildImagesPanel() {
    const $body = document.getElementById('panel-images-content');
    if (!$body) return;

    $body.innerHTML = `
      <div class="panel-section">
        <div class="panel-section-title">Upload Folder / Photos</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
          <button class="btn-primary" id="btn-leftpanel-folder" style="font-size:11px;padding:8px 6px;justify-content:center;">
            📁 Select folder
          </button>
          <button class="btn-secondary" id="btn-leftpanel-batch" style="font-size:11px;padding:8px 6px;justify-content:center;">
            🖼 Batch photos
          </button>
        </div>
        <div class="upload-zone" id="upload-zone-main">
          <div class="upload-zone-icon">📁</div>
          <div class="upload-zone-label">Drop entire folder or photos here</div>
          <div class="upload-zone-sublabel">PNG · JPG · HEIC · WebP · Directory</div>
        </div>
      </div>
      <div class="panel-section" id="uploaded-images-section" style="${_imageLibrary.length ? '' : 'display:none;'}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div class="panel-section-title" style="margin:0;">Library (${_imageLibrary.length})</div>
          <div style="display:flex;gap:4px;">
            <button class="btn-ghost" id="btn-leftpanel-shuffle" title="Shuffle images across slides" style="font-size:10px;padding:2px 6px;">🔀 Shuffle</button>
            <button class="btn-primary" id="btn-leftpanel-smart" title="Auto-compose with these photos" style="font-size:10px;padding:2px 8px;">✨ Compose</button>
          </div>
        </div>
        <div id="uploaded-images-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;"></div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Usage tips</div>
        <div style="font-size:11px;color:var(--c-text-3);line-height:1.7;">
          • Click <b>Select folder</b> to import a whole directory<br>
          • Click <b>✨ Compose</b> to smartly generate lookbook slides<br>
          • Click an image thumbnail to add to slide<br>
          • Drag images to reposition & adjust focal point
        </div>
      </div>
    `;

    // Render existing thumbnails
    _renderImageGrid();

    // Folder select
    $body.querySelector('#btn-leftpanel-folder')?.addEventListener('click', () => {
      document.getElementById('folder-upload-hidden')?.click();
    });

    // Batch photos select
    $body.querySelector('#btn-leftpanel-batch')?.addEventListener('click', () => {
      document.getElementById('batch-photos-upload-hidden')?.click();
    });

    // Smart compose button
    $body.querySelector('#btn-leftpanel-smart')?.addEventListener('click', () => {
      openSmartComposeModal(_imageLibrary);
    });

    // Shuffle button
    $body.querySelector('#btn-leftpanel-shuffle')?.addEventListener('click', () => {
      shuffleCarouselImages();
      UI.toast('Images shuffled across slides', '🔀');
    });

    // Upload zone click
    $body.querySelector('#upload-zone-main')?.addEventListener('click', () => {
      const $input = document.getElementById('image-upload-hidden');
      const id = STATE.carousel.selectedSlideId;
      $input.dataset.targetSlide = id || '';
      $input.dataset.targetEl = '';
      $input.dataset.libraryMode = 'true';
      $input.click();
    });

    // Drag and drop with recursive folder traversal
    $body.querySelector('#upload-zone-main')?.addEventListener('dragover', e => {
      e.preventDefault();
      e.currentTarget.style.borderColor = 'var(--c-accent)';
    });
    $body.querySelector('#upload-zone-main')?.addEventListener('dragleave', e => {
      e.currentTarget.style.borderColor = '';
    });
    $body.querySelector('#upload-zone-main')?.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.currentTarget.style.borderColor = '';
      const files = await getFilesFromDataTransfer(e.dataTransfer);
      if (!files.length) return;
      UI.toast(`Processing ${files.length} images…`, '⏳');
      for (const rawFile of files) {
        const file = await convertImageFile(rawFile);
        if (!file) continue;
        _addToLibrary(file);
      }
      setTimeout(() => {
        openSmartComposeModal(_imageLibrary);
      }, 300);
    });
  }

  function _addToLibrary(file) {
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      _imageLibrary.push({ src: dataUrl, name: file.name });

      // Show section
      const $section = document.getElementById('uploaded-images-section');
      if ($section) $section.style.display = '';

      _renderImageGrid();

      // Also add to currently selected slide if one is selected
      const slideId = STATE.carousel.selectedSlideId;
      if (slideId) {
        Canvas.handleImageFile(file, slideId, null);
      }
    };
    reader.readAsDataURL(file);
  }

  function _renderImageGrid() {
    const $grid = document.getElementById('uploaded-images-grid');
    if (!$grid) return;
    const $section = document.getElementById('uploaded-images-section');

    // Update title count
    if ($section) {
      const $title = $section.querySelector('.panel-section-title');
      if ($title) $title.textContent = `Image library (${_imageLibrary.length})`;
    }

    $grid.innerHTML = _imageLibrary.map((img, i) => `
      <div class="uploaded-image-thumb" data-lib-idx="${i}" title="${img.name}" style="
        position:relative;border-radius:6px;overflow:hidden;cursor:pointer;
        border:1px solid var(--c-border);aspect-ratio:1;transition:all 0.15s ease;
      ">
        <img src="${img.src}" style="width:100%;height:100%;object-fit:cover;display:block;" draggable="false" />
        <div style="position:absolute;bottom:0;left:0;right:0;padding:4px 6px;background:linear-gradient(transparent,rgba(0,0,0,0.7));
          font-size:9px;color:rgba(255,255,255,0.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${img.name}
        </div>
      </div>
    `).join('');

    // Bind click to add image to selected slide
    $grid.querySelectorAll('[data-lib-idx]').forEach($thumb => {
      $thumb.addEventListener('click', () => {
        const idx = parseInt($thumb.dataset.libIdx, 10);
        const img = _imageLibrary[idx];
        if (!img) return;
        const slideId = STATE.carousel.selectedSlideId;
        if (!slideId) { UI.toast('Select a slide first', '⚠'); return; }

        const slide = getSlide(slideId);
        if (!slide) return;
        const { w, h } = getFormatDims();
        const el = makeImageElement({ x: 0, y: 0, width: w, height: h, src: img.src });
        slide.elements.unshift(el);
        STATE.carousel.selectedElementId = el.id;
        HISTORY.snapshot();
        Canvas.rebuild();
        UI.toast('Image added to slide', '🖼');
      });

      // Hover effect
      $thumb.addEventListener('mouseenter', () => {
        $thumb.style.borderColor = 'var(--c-accent)';
        $thumb.style.transform = 'scale(1.03)';
      });
      $thumb.addEventListener('mouseleave', () => {
        $thumb.style.borderColor = 'var(--c-border)';
        $thumb.style.transform = '';
      });
    });
  }

  function buildElementsPanel() {
    const $body = document.getElementById('panel-elements-content');
    if (!$body) return;

    $body.innerHTML = `
      <div class="panel-section">
        <div class="panel-section-title">Add elements</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <button class="btn-ghost" style="justify-content:flex-start;border:1px solid var(--c-border);border-radius:6px;padding:10px 12px;" id="add-hero-text">
            <span style="font-size:20px;margin-right:8px;font-family:var(--font-display);">T</span>
            <div>
              <div style="font-weight:600;font-size:12px;">Hero text</div>
              <div style="font-size:10px;color:var(--c-text-3);">Large display type</div>
            </div>
          </button>
          <button class="btn-ghost" style="justify-content:flex-start;border:1px solid var(--c-border);border-radius:6px;padding:10px 12px;" id="add-body-text">
            <span style="font-size:14px;margin-right:8px;">T</span>
            <div>
              <div style="font-weight:600;font-size:12px;">Body text</div>
              <div style="font-size:10px;color:var(--c-text-3);">Supporting copy</div>
            </div>
          </button>
          <button class="btn-ghost" style="justify-content:flex-start;border:1px solid var(--c-border);border-radius:6px;padding:10px 12px;" id="add-label-text">
            <span style="font-size:10px;margin-right:8px;letter-spacing:0.1em;">01</span>
            <div>
              <div style="font-weight:600;font-size:12px;">Label</div>
              <div style="font-size:10px;color:var(--c-text-3);">Small editorial metadata</div>
            </div>
          </button>
          <button class="btn-ghost" style="justify-content:flex-start;border:1px solid var(--c-border);border-radius:6px;padding:10px 12px;" id="add-divider-line">
            <span style="font-size:14px;margin-right:8px;">—</span>
            <div>
              <div style="font-weight:600;font-size:12px;">Divider line</div>
              <div style="font-size:10px;color:var(--c-text-3);">Accent separator</div>
            </div>
          </button>
          <button class="btn-ghost" style="justify-content:flex-start;border:1px solid var(--c-border);border-radius:6px;padding:10px 12px;" id="add-image-block">
            <span style="font-size:14px;margin-right:8px;">🖼</span>
            <div>
              <div style="font-weight:600;font-size:12px;">Image block</div>
              <div style="font-size:10px;color:var(--c-text-3);">Photo or graphic</div>
            </div>
          </button>
        </div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Global spacing</div>
        <div class="slider-row">
          <div class="slider-label">Margin</div>
          <input type="range" class="panel-slider" id="global-margin" min="0" max="200" value="86">
          <div class="slider-value" id="gm-val">8%</div>
        </div>
      </div>
    `;

    const addToSelected = (el) => {
      const id = STATE.carousel.selectedSlideId;
      if (!id) { UI.toast('Select a slide first', '⚠'); return; }
      const slide = getSlide(id);
      slide.elements.push(el);
      STATE.carousel.selectedElementId = el.id;
      HISTORY.snapshot();
      Canvas.rebuild();
    };

    const { w, h } = getFormatDims();

    $body.querySelector('#add-hero-text')?.addEventListener('click', () => {
      addToSelected(makeTextElement({ content:'HEADLINE', fontSize: 90, x: w*0.08, y: h*0.3, width: w*0.84, height: h*0.35, fontFamily: STATE.style.fontDisplay, color: STATE.style.textColor, role:'hero' }));
    });
    $body.querySelector('#add-body-text')?.addEventListener('click', () => {
      addToSelected(makeTextElement({ content:'Supporting text goes here.', fontSize: 22, x: w*0.08, y: h*0.55, width: w*0.7, height: h*0.12, fontFamily: 'Inter', fontWeight: 400, color: STATE.style.textColor, opacity: 0.65, role:'supporting' }));
    });
    $body.querySelector('#add-label-text')?.addEventListener('click', () => {
      addToSelected(makeTextElement({ content:'01 — LABEL', fontSize: 11, x: w*0.08, y: h*0.06, width: w*0.3, height: h*0.04, fontFamily: 'Inter', fontWeight: 600, color: STATE.style.accentColor, opacity: 0.8, letterSpacing: 4, role:'label' }));
    });
    $body.querySelector('#add-divider-line')?.addEventListener('click', () => {
      addToSelected(makeShapeElement({ x: w*0.08, y: h*0.88, width: w*0.15, height: 1, fill: STATE.style.accentColor, opacity: 0.8 }));
    });
    $body.querySelector('#add-image-block')?.addEventListener('click', () => {
      const id = STATE.carousel.selectedSlideId;
      if (!id) { UI.toast('Select a slide first', '⚠'); return; }
      Canvas.triggerImageUpload(id);
    });
  }

  return {
    init,
    buildStylePanel,
    buildImagesPanel,
    buildElementsPanel,
    getImageLibrary: () => _imageLibrary,
    addToLibrary: _addToLibrary,
  };
})();
