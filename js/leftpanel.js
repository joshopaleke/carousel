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
          ${['symmetric','asymmetric','cinematic'].map(c => `
            <div class="style-chip${STATE.wizard.composition === c ? ' selected':''}" data-composition="${c}">${c}</div>
          `).join('')}
        </div>
      </div>

      <!-- Format -->
      <div class="panel-section">
        <div class="panel-section-title">Format</div>
        <div class="style-chips">
          ${Object.entries(FORMATS).map(([key, fmt]) => `
            <div class="style-chip${STATE.carousel.format === key ? ' selected':''}" data-format="${key}"
                 style="font-size:10px;" title="${fmt.label}">${fmt.label}</div>
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

    $body.querySelector('#btn-regenerate')?.addEventListener('click', () => {
      generateCarousel();
      HISTORY.snapshot();
      Canvas.rebuild();
      UI.toast('Layouts regenerated', '↺');
    });
  }

  function buildImagesPanel() {
    const $body = document.getElementById('panel-images-content');
    if (!$body) return;

    $body.innerHTML = `
      <div class="panel-section">
        <div class="panel-section-title">Upload images</div>
        <div class="upload-zone" id="upload-zone-main">
          <div class="upload-zone-icon">📁</div>
          <div class="upload-zone-label">Drop images here<br>or click to browse</div>
          <div class="upload-zone-sublabel">PNG · JPG · WebP · SVG</div>
        </div>
      </div>
      <div class="panel-section" id="uploaded-images-section" style="display:none;">
        <div class="panel-section-title">Uploaded images</div>
        <div id="uploaded-images-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;"></div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Usage tips</div>
        <div style="font-size:11px;color:var(--c-text-3);line-height:1.7;">
          • Click a slide to target it<br>
          • Click an uploaded image to add it<br>
          • Drag images to reposition<br>
          • Use inspector to adjust focal point
        </div>
      </div>
    `;

    $body.querySelector('#upload-zone-main')?.addEventListener('click', () => {
      const id = STATE.carousel.selectedSlideId;
      if (!id) { UI.toast('Select a slide first', '⚠'); return; }
      Canvas.triggerImageUpload(id);
    });

    $body.querySelector('#upload-zone-main')?.addEventListener('dragover', e => {
      e.preventDefault();
      e.currentTarget.style.borderColor = 'var(--c-accent)';
    });
    $body.querySelector('#upload-zone-main')?.addEventListener('dragleave', e => {
      e.currentTarget.style.borderColor = '';
    });
    $body.querySelector('#upload-zone-main')?.addEventListener('drop', e => {
      e.preventDefault();
      e.currentTarget.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      const id = STATE.carousel.selectedSlideId;
      if (!id) { UI.toast('Select a slide first', '⚠'); return; }
      Canvas.handleImageFile(file, id, null);
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

  return { init, buildStylePanel, buildImagesPanel, buildElementsPanel };
})();
