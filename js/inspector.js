/* ─────────────────────────────────────────────
   CAROUSEL. — Inspector (right panel)
   ───────────────────────────────────────────── */

const Inspector = (() => {
  function refresh() {
    const slide = getSelectedSlide();
    const el    = getSelectedElement();

    if (el) {
      renderElementInspector(el, slide);
    } else if (slide) {
      renderSlideInspector(slide);
    } else {
      renderEmpty();
    }
  }

  function renderEmpty() {
    document.getElementById('inspector-body').innerHTML = `
      <div style="padding:var(--sp-6) var(--sp-4); text-align:center; color:var(--c-text-3);">
        <div style="font-size:24px; margin-bottom:var(--sp-3);">✦</div>
        <div style="font-size:11px; line-height:1.6;">Select a slide or element to inspect its properties</div>
      </div>`;
    document.getElementById('inspector-title').textContent = 'Inspector';
  }

  function renderSlideInspector(slide) {
    const idx = slideIndex(slide.id);
    document.getElementById('inspector-title').textContent = `Slide ${idx + 1}`;

    const html = `
      <div class="inspector-group">
        <div class="inspector-group-title">Slide</div>
        <div class="property-row">
          <div class="property-label">Role</div>
          <select class="panel-select" id="prop-slide-role" style="flex:1;">
            ${ROLES.map(r => `<option value="${r}" ${slide.role === r ? 'selected' : ''}>${ROLE_ICONS[r]} ${r}</option>`).join('')}
          </select>
        </div>
        <div class="property-row">
          <div class="property-label">BG Color</div>
          <div style="display:flex;gap:8px;align-items:center;flex:1;">
            <input type="color" id="prop-slide-bg" value="${slide.bgColor}" style="width:32px;height:28px;border:none;background:none;cursor:pointer;padding:0;border-radius:4px;overflow:hidden;">
            <input class="property-input" id="prop-slide-bg-hex" value="${slide.bgColor}" style="flex:1;font-family:var(--font-mono);">
          </div>
        </div>
      </div>

      <div class="inspector-group">
        <div class="inspector-group-title">Elements (${slide.elements.length})</div>
        <div id="elements-list">
          ${slide.elements.map((el, i) => `
            <div class="property-row" style="cursor:pointer;padding:6px 8px;border-radius:4px;border:1px solid var(--c-border);margin-bottom:4px;${el.id === STATE.carousel.selectedElementId ? 'border-color:var(--c-accent);background:var(--c-accent-dim)' : ''}"
                 data-el-click="${el.id}">
              <span style="font-size:12px;margin-right:6px;">${el.type === 'text' ? 'T' : el.type === 'image' ? '🖼' : '▭'}</span>
              <span style="font-size:11px;color:var(--c-text-2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                ${el.type === 'text' ? el.content.slice(0,24) : el.type === 'image' ? 'Image' : 'Shape'}
              </span>
              <span style="font-size:10px;color:var(--c-text-3);">${el.locked ? '🔒' : ''}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="inspector-group">
        <div class="inspector-group-title">Actions</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <button class="btn-ghost" style="width:100%;justify-content:flex-start;" id="insp-add-text">+ Add text</button>
          <button class="btn-ghost" style="width:100%;justify-content:flex-start;" id="insp-add-image">+ Add image</button>
          <button class="btn-ghost" style="width:100%;justify-content:flex-start;" id="insp-dup-slide">⧉ Duplicate slide</button>
          <button class="btn-ghost" style="width:100%;justify-content:flex-start;color:var(--c-danger);" id="insp-del-slide">✕ Delete slide</button>
        </div>
      </div>
    `;

    const $body = document.getElementById('inspector-body');
    $body.innerHTML = html;

    // Bind events
    $body.querySelector('#prop-slide-role')?.addEventListener('change', e => {
      slide.role = e.target.value;
      HISTORY.snapshot();
      Canvas.rebuild();
    });

    const colorInput = $body.querySelector('#prop-slide-bg');
    const hexInput   = $body.querySelector('#prop-slide-bg-hex');
    colorInput?.addEventListener('input', e => {
      slide.bgColor = e.target.value;
      hexInput.value = e.target.value;
      const $cs = document.querySelector(`.canvas-slide[data-slide-id="${slide.id}"]`);
      if ($cs) $cs.style.background = slide.bgColor;
    });
    colorInput?.addEventListener('change', () => HISTORY.snapshot());
    hexInput?.addEventListener('change', e => {
      slide.bgColor = e.target.value;
      colorInput.value = e.target.value;
      HISTORY.snapshot();
      Canvas.rebuild();
    });

    $body.querySelectorAll('[data-el-click]').forEach($row => {
      $row.addEventListener('click', () => {
        Canvas.selectElement(slide.id, $row.dataset.elClick);
      });
    });

    $body.querySelector('#insp-add-text')?.addEventListener('click', () => Canvas.addTextToSlide(slide.id));
    $body.querySelector('#insp-add-image')?.addEventListener('click', () => Canvas.triggerImageUpload(slide.id));
    $body.querySelector('#insp-dup-slide')?.addEventListener('click', () => Canvas.duplicateSlide(slide.id));
    $body.querySelector('#insp-del-slide')?.addEventListener('click', () => Canvas.deleteSlide(slide.id));
  }

  function renderElementInspector(el, slide) {
    document.getElementById('inspector-title').textContent =
      el.type === 'text' ? 'Text' : el.type === 'image' ? 'Image' : 'Shape';

    let specificHtml = '';

    if (el.type === 'text') {
      specificHtml = `
        <div class="inspector-group">
          <div class="inspector-group-title">Typography</div>
          <div class="property-row">
            <div class="property-label">Family</div>
            <select class="panel-select" id="prop-font-family" style="flex:1;">
              ${['Playfair Display','Inter','DM Serif Display','Space Grotesk','Cormorant Garamond','IBM Plex Mono']
                .map(f => `<option value="${f}" ${el.fontFamily === f ? 'selected' : ''}>${f}</option>`).join('')}
            </select>
          </div>
          <div class="property-row-2col">
            <div>
              <div style="font-size:10px;color:var(--c-text-3);margin-bottom:4px;">Size</div>
              <input class="property-input" id="prop-font-size" type="number" value="${el.fontSize}" style="width:100%;">
            </div>
            <div>
              <div style="font-size:10px;color:var(--c-text-3);margin-bottom:4px;">Weight</div>
              <select class="panel-select" id="prop-font-weight" style="width:100%;">
                ${[300,400,500,600,700,800,900].map(w => `<option value="${w}" ${el.fontWeight == w ? 'selected':''}>${w}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="property-row">
            <div class="property-label">Align</div>
            <div style="display:flex;gap:4px;flex:1;">
              ${['left','center','right'].map(a => `
                <button class="tb-btn${el.align === a ? ' active':''}" id="prop-align-${a}" style="flex:1;" title="${a}">
                  ${a === 'left' ? '⇤' : a === 'center' ? '≡' : '⇥'}
                </button>`).join('')}
            </div>
          </div>
          <div class="slider-row">
            <div class="slider-label">Tracking</div>
            <input type="range" class="panel-slider" id="prop-letter-spacing" min="-10" max="20" value="${el.letterSpacing}">
            <div class="slider-value" id="prop-ls-val">${el.letterSpacing}</div>
          </div>
          <div class="slider-row">
            <div class="slider-label">Leading</div>
            <input type="range" class="panel-slider" id="prop-line-height" min="0.6" max="2.5" step="0.05" value="${el.lineHeight}">
            <div class="slider-value" id="prop-lh-val">${el.lineHeight}</div>
          </div>
        </div>
        <div class="inspector-group">
          <div class="inspector-group-title">Colour</div>
          <div class="property-row">
            <div class="property-label">Text</div>
            <div style="display:flex;gap:8px;align-items:center;flex:1;">
              <input type="color" id="prop-text-color" value="${el.color}" style="width:32px;height:28px;border:none;background:none;cursor:pointer;padding:0;border-radius:4px;">
              <input class="property-input" id="prop-text-hex" value="${el.color}" style="flex:1;font-family:var(--font-mono);">
            </div>
          </div>
        </div>
        <div class="inspector-group">
          <div class="inspector-group-title">Content</div>
          <textarea id="prop-text-content" style="width:100%;background:var(--c-surface);border:1px solid var(--c-border);border-radius:6px;color:var(--c-text);font-family:var(--font-sans);font-size:12px;padding:8px;resize:vertical;min-height:80px;line-height:1.5;">${el.content}</textarea>
        </div>
      `;
    } else if (el.type === 'image') {
      specificHtml = `
        <div class="inspector-group">
          <div class="inspector-group-title">Image</div>
          <button class="btn-ghost" id="prop-replace-img" style="width:100%;justify-content:flex-start;border:1px dashed var(--c-border);border-radius:6px;padding:12px;">
            🖼 Replace image
          </button>
          <div style="margin-top:12px;">
            <div class="inspector-group-title" style="margin-bottom:6px;">Focal Point</div>
            <div class="slider-row">
              <div class="slider-label">X</div>
              <input type="range" class="panel-slider" id="prop-focal-x" min="0" max="100" value="${el.focalX}">
              <div class="slider-value" id="prop-fx-val">${el.focalX}%</div>
            </div>
            <div class="slider-row">
              <div class="slider-label">Y</div>
              <input type="range" class="panel-slider" id="prop-focal-y" min="0" max="100" value="${el.focalY}">
              <div class="slider-value" id="prop-fy-val">${el.focalY}%</div>
            </div>
          </div>
          <div style="margin-top:12px;">
            <div class="inspector-group-title" style="margin-bottom:6px;">Adjustments</div>
            <div class="slider-row">
              <div class="slider-label">Brightness</div>
              <input type="range" class="panel-slider" id="prop-brightness" min="0" max="200" value="${el.filters?.brightness ?? 100}">
              <div class="slider-value" id="prop-br-val">${el.filters?.brightness ?? 100}</div>
            </div>
            <div class="slider-row">
              <div class="slider-label">Contrast</div>
              <input type="range" class="panel-slider" id="prop-contrast" min="0" max="200" value="${el.filters?.contrast ?? 100}">
              <div class="slider-value" id="prop-ct-val">${el.filters?.contrast ?? 100}</div>
            </div>
            <div class="slider-row">
              <div class="slider-label">Saturation</div>
              <input type="range" class="panel-slider" id="prop-saturation" min="0" max="200" value="${el.filters?.saturation ?? 100}">
              <div class="slider-value" id="prop-sa-val">${el.filters?.saturation ?? 100}</div>
            </div>
          </div>
        </div>
      `;
    }

    const $body = document.getElementById('inspector-body');
    $body.innerHTML = `
      <div class="inspector-group">
        <div class="inspector-group-title">Position & Size</div>
        <div class="property-row-2col">
          <div>
            <div style="font-size:10px;color:var(--c-text-3);margin-bottom:4px;">X</div>
            <input class="property-input" id="prop-x" type="number" value="${Math.round(el.x)}">
          </div>
          <div>
            <div style="font-size:10px;color:var(--c-text-3);margin-bottom:4px;">Y</div>
            <input class="property-input" id="prop-y" type="number" value="${Math.round(el.y)}">
          </div>
        </div>
        <div class="property-row-2col">
          <div>
            <div style="font-size:10px;color:var(--c-text-3);margin-bottom:4px;">W</div>
            <input class="property-input" id="prop-w" type="number" value="${Math.round(el.width)}">
          </div>
          <div>
            <div style="font-size:10px;color:var(--c-text-3);margin-bottom:4px;">H</div>
            <input class="property-input" id="prop-h" type="number" value="${Math.round(el.height)}">
          </div>
        </div>
        <div class="property-row">
          <div class="property-label">Opacity</div>
          <input type="range" class="panel-slider" id="prop-opacity" min="0" max="1" step="0.01" value="${el.opacity}" style="flex:1;">
          <div class="slider-value" id="prop-op-val">${Math.round(el.opacity * 100)}%</div>
        </div>
        <div class="property-row">
          <div class="property-label">Rotation</div>
          <input class="property-input" id="prop-rotation" type="number" value="${el.rotation || 0}" style="flex:1;">
          <div style="font-size:11px;color:var(--c-text-3);margin-left:4px;">°</div>
        </div>
      </div>
      ${specificHtml}
      <div class="inspector-group">
        <button class="btn-ghost" id="insp-del-el" style="width:100%;justify-content:flex-start;color:var(--c-danger);">✕ Delete element</button>
      </div>
    `;

    // Position/size bindings
    ['x','y','w','h'].forEach(prop => {
      $body.querySelector(`#prop-${prop}`)?.addEventListener('change', e => {
        const v = parseInt(e.target.value, 10);
        if (prop === 'x') el.x = v;
        else if (prop === 'y') el.y = v;
        else if (prop === 'w') el.width = v;
        else if (prop === 'h') el.height = v;
        HISTORY.snapshot();
        Canvas.rebuild();
      });
    });

    $body.querySelector('#prop-opacity')?.addEventListener('input', e => {
      el.opacity = parseFloat(e.target.value);
      $body.querySelector('#prop-op-val').textContent = Math.round(el.opacity * 100) + '%';
      const $elDom = document.querySelector(`.slide-element[data-el-id="${el.id}"]`);
      if ($elDom) $elDom.style.opacity = el.opacity;
    });
    $body.querySelector('#prop-opacity')?.addEventListener('change', () => HISTORY.snapshot());

    $body.querySelector('#prop-rotation')?.addEventListener('change', e => {
      el.rotation = parseFloat(e.target.value) || 0;
      HISTORY.snapshot();
      Canvas.rebuild();
    });

    // Text-specific
    if (el.type === 'text') {
      $body.querySelector('#prop-font-family')?.addEventListener('change', e => {
        el.fontFamily = e.target.value;
        HISTORY.snapshot();
        Canvas.rebuild();
      });
      $body.querySelector('#prop-font-size')?.addEventListener('change', e => {
        el.fontSize = parseInt(e.target.value, 10);
        HISTORY.snapshot();
        Canvas.rebuild();
      });
      $body.querySelector('#prop-font-weight')?.addEventListener('change', e => {
        el.fontWeight = parseInt(e.target.value, 10);
        HISTORY.snapshot();
        Canvas.rebuild();
      });
      ['left','center','right'].forEach(align => {
        $body.querySelector(`#prop-align-${align}`)?.addEventListener('click', () => {
          el.align = align;
          HISTORY.snapshot();
          Canvas.rebuild();
        });
      });
      const lsSlider = $body.querySelector('#prop-letter-spacing');
      lsSlider?.addEventListener('input', e => {
        el.letterSpacing = parseFloat(e.target.value);
        $body.querySelector('#prop-ls-val').textContent = el.letterSpacing;
        Canvas.rebuild();
      });
      lsSlider?.addEventListener('change', () => HISTORY.snapshot());

      const lhSlider = $body.querySelector('#prop-line-height');
      lhSlider?.addEventListener('input', e => {
        el.lineHeight = parseFloat(e.target.value);
        $body.querySelector('#prop-lh-val').textContent = el.lineHeight;
        Canvas.rebuild();
      });
      lhSlider?.addEventListener('change', () => HISTORY.snapshot());

      const colorI = $body.querySelector('#prop-text-color');
      const hexI   = $body.querySelector('#prop-text-hex');
      colorI?.addEventListener('input', e => {
        el.color = e.target.value;
        hexI.value = e.target.value;
        const $elDom = document.querySelector(`.slide-element[data-el-id="${el.id}"]`);
        if ($elDom) $elDom.style.color = el.color;
      });
      colorI?.addEventListener('change', () => HISTORY.snapshot());
      hexI?.addEventListener('change', e => { el.color = e.target.value; colorI.value = e.target.value; HISTORY.snapshot(); Canvas.rebuild(); });

      const $ta = $body.querySelector('#prop-text-content');
      $ta?.addEventListener('input', e => {
        el.content = e.target.value;
        const $elDom = document.querySelector(`.slide-element[data-el-id="${el.id}"]`);
        if ($elDom) $elDom.textContent = el.content;
      });
      $ta?.addEventListener('change', () => { HISTORY.snapshot(); Navigator.rebuild(); });
    }

    // Image-specific
    if (el.type === 'image') {
      const mkSlider = (id, valId, prop, applyFn) => {
        $body.querySelector(`#${id}`)?.addEventListener('input', e => {
          const v = parseInt(e.target.value, 10);
          $body.querySelector(`#${valId}`).textContent = valId.endsWith('val') ? (prop.startsWith('focal') ? v + '%' : v) : v;
          if (prop.startsWith('focal')) {
            el[prop] = v;
          } else {
            if (!el.filters) el.filters = {};
            el.filters[prop] = v;
          }
          applyFn(el);
        });
        $body.querySelector(`#${id}`)?.addEventListener('change', () => HISTORY.snapshot());
      };

      mkSlider('prop-focal-x', 'prop-fx-val', 'focalX', applyImageFilters);
      mkSlider('prop-focal-y', 'prop-fy-val', 'focalY', applyImageFilters);
      mkSlider('prop-brightness', 'prop-br-val', 'brightness', applyImageFilters);
      mkSlider('prop-contrast',   'prop-ct-val', 'contrast',   applyImageFilters);
      mkSlider('prop-saturation', 'prop-sa-val', 'saturation', applyImageFilters);

      $body.querySelector('#prop-replace-img')?.addEventListener('click', () => Canvas.triggerImageUpload(slide.id, el.id));
    }

    $body.querySelector('#insp-del-el')?.addEventListener('click', () => Canvas.deleteElement(slide.id, el.id));
  }

  function applyImageFilters(el) {
    const $elDom = document.querySelector(`.slide-element[data-el-id="${el.id}"]`);
    if (!$elDom) return;
    const $img = $elDom.querySelector('img');
    if ($img) {
      $img.style.objectPosition = `${el.focalX}% ${el.focalY}%`;
      const f = el.filters || {};
      $img.style.filter = `brightness(${f.brightness ?? 100}%) contrast(${f.contrast ?? 100}%) saturate(${f.saturation ?? 100}%)`;
    }
  }

  return { refresh };
})();
