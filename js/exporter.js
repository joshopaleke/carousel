/* ─────────────────────────────────────────────
   CAROUSEL. — Export Engine (with preview)
   ───────────────────────────────────────────── */

const Exporter = (() => {
  let _previewDataUrls = []; // cached rendered previews

  function init() {
    document.getElementById('export-cancel')?.addEventListener('click', closeModal);
    document.getElementById('export-confirm')?.addEventListener('click', doExport);

    document.querySelectorAll('.export-option').forEach($o => {
      $o.addEventListener('click', () => {
        document.querySelectorAll('.export-option').forEach($x => $x.classList.remove('selected'));
        $o.classList.add('selected');
        STATE.ui.exportFormat = $o.dataset.format;
      });
    });
  }

  async function openModal() {
    STATE.ui.exportModalOpen = true;
    document.getElementById('export-modal').classList.add('active');

    // Render preview thumbnails
    await renderPreviews();
  }

  function closeModal() {
    STATE.ui.exportModalOpen = false;
    document.getElementById('export-modal').classList.remove('active');
    _previewDataUrls = [];
  }

  async function renderPreviews() {
    const $scroll = document.getElementById('export-preview-scroll');
    const $loading = document.getElementById('export-loading');
    $scroll.innerHTML = '';
    $loading.style.display = 'flex';

    const slides = STATE.carousel.slides;
    const { w, h } = getFormatDims();
    _previewDataUrls = [];

    for (let i = 0; i < slides.length; i++) {
      try {
        const dataUrl = await renderSlideToCanvas(slides[i], w, h);
        _previewDataUrls.push(dataUrl);

        // Create thumbnail
        const $thumb = document.createElement('div');
        $thumb.className = 'export-preview-thumb';
        $thumb.innerHTML = `
          <img src="${dataUrl}" alt="Slide ${i + 1}" draggable="false" />
          <div class="export-thumb-label">${String(i + 1).padStart(2, '0')}</div>
        `;
        $scroll.appendChild($thumb);
      } catch (err) {
        console.warn(`Failed to render slide ${i + 1}`, err);
      }
    }

    $loading.style.display = 'none';
  }

  async function doExport() {
    const fmt = STATE.ui.exportFormat;
    const slides = STATE.carousel.slides;
    const { w, h } = getFormatDims();

    UI.toast('Preparing export…', '⏳');
    closeModal();

    // Use cached previews if available, otherwise re-render
    if (_previewDataUrls.length !== slides.length) {
      _previewDataUrls = [];
      for (let i = 0; i < slides.length; i++) {
        _previewDataUrls.push(await renderSlideToCanvas(slides[i], w, h));
      }
    }

    if (fmt === 'png-zip') {
      for (let i = 0; i < slides.length; i++) {
        UI.toast(`Exporting slide ${i + 1}/${slides.length}`, '⬇');
        await sleep(80);
        downloadDataUrl(_previewDataUrls[i], `${sanitiseTitle()}_${String(i + 1).padStart(2, '0')}.png`);
      }
      UI.toast(`All ${slides.length} slides exported!`, '✓');
    } else {
      for (let i = 0; i < slides.length; i++) {
        downloadDataUrl(_previewDataUrls[i], `${sanitiseTitle()}_${String(i + 1).padStart(2, '0')}.png`);
        await sleep(120);
      }
      UI.toast(`${slides.length} slides exported`, '✓');
    }
    _previewDataUrls = [];
  }

  async function renderSlideToCanvas(slide, w, h) {
    const $canvas = document.createElement('canvas');
    $canvas.width  = w;
    $canvas.height = h;
    const ctx = $canvas.getContext('2d');

    // Background
    ctx.fillStyle = slide.bgColor;
    ctx.fillRect(0, 0, w, h);

    // Elements (sorted by z)
    const sorted = [...slide.elements].sort((a, b) => {
      const defaultOrder = { image: 1, shape: 2, text: 6 };
      const za = a.zIndex ?? defaultOrder[a.type] ?? 1;
      const zb = b.zIndex ?? defaultOrder[b.type] ?? 1;
      return za - zb;
    });

    for (const el of sorted) {
      ctx.save();
      ctx.globalAlpha = el.opacity;

      if (el.rotation) {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      if (el.type === 'shape') {
        if (el.fill && el.fill !== 'transparent') {
          ctx.fillStyle = el.fill;
          ctx.fillRect(el.x, el.y, el.width, el.height);
        }
        if (el.stroke && el.strokeWidth) {
          ctx.lineWidth = el.strokeWidth;
          ctx.strokeStyle = el.stroke;
          ctx.strokeRect(el.x, el.y, el.width, el.height);
        }

      } else if (el.type === 'text') {
        ctx.fillStyle = el.color;
        ctx.font = `${el.fontWeight} ${el.fontSize}px '${el.fontFamily}', serif`;
        ctx.textBaseline = 'top';
        if (el.isBadge) {
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 8;
        }
        if (el.align === 'center') {
          ctx.textAlign = 'center';
          renderWrappedText(ctx, el.content, el.x + el.width / 2, el.y, el.width, el.fontSize * el.lineHeight, el.letterSpacing);
        } else if (el.align === 'right') {
          ctx.textAlign = 'right';
          renderWrappedText(ctx, el.content, el.x + el.width, el.y, el.width, el.fontSize * el.lineHeight, el.letterSpacing);
        } else {
          ctx.textAlign = 'left';
          renderWrappedText(ctx, el.content, el.x, el.y, el.width, el.fontSize * el.lineHeight, el.letterSpacing);
        }

      } else if (el.type === 'image' && el.src) {
        const img = await loadImage(el.src);
        const f = el.filters || {};
        ctx.filter = `brightness(${f.brightness??100}%) contrast(${f.contrast??100}%) saturate(${f.saturation??100}%)`;
        // Cover fit with focal point
        const { sx, sy, sw, sh } = coverFit(img.width, img.height, el.width, el.height, el.focalX/100, el.focalY/100);
        ctx.drawImage(img, sx, sy, sw, sh, el.x, el.y, el.width, el.height);
        ctx.filter = 'none';

        if (el.borderWidth && el.borderColor) {
          ctx.lineWidth = el.borderWidth;
          ctx.strokeStyle = el.borderColor;
          ctx.strokeRect(el.x, el.y, el.width, el.height);
        }
      }

      ctx.restore();
    }

    return $canvas.toDataURL('image/png');
  }

  function renderWrappedText(ctx, text, x, y, maxW, lineH, letterSpacing) {
    const lines = text.split('\n');
    let ly = y;
    lines.forEach(line => {
      // Apply letter spacing manually
      if (letterSpacing && letterSpacing !== 0) {
        let lx = x;
        if (ctx.textAlign === 'center') lx = x - measureTextWithSpacing(ctx, line, letterSpacing) / 2;
        if (ctx.textAlign === 'right')  lx = x - measureTextWithSpacing(ctx, line, letterSpacing);
        for (const ch of line) {
          ctx.fillText(ch, lx, ly);
          lx += ctx.measureText(ch).width + letterSpacing;
        }
      } else {
        ctx.fillText(line, x, ly);
      }
      ly += lineH;
    });
  }

  function measureTextWithSpacing(ctx, text, letterSpacing) {
    let w = 0;
    for (const ch of text) w += ctx.measureText(ch).width + letterSpacing;
    return w;
  }

  function coverFit(imgW, imgH, boxW, boxH, focalX, focalY) {
    const scale = Math.max(boxW / imgW, boxH / imgH);
    const sw = boxW / scale;
    const sh = boxH / scale;
    const sx = Math.max(0, Math.min((imgW - sw) * focalX, imgW - sw));
    const sy = Math.max(0, Math.min((imgH - sh) * focalY, imgH - sh));
    return { sx, sy, sw, sh };
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function downloadDataUrl(dataUrl, filename) {
    const $a = document.createElement('a');
    $a.href     = dataUrl;
    $a.download = filename;
    $a.click();
  }

  function sanitiseTitle() {
    return STATE.carousel.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'carousel';
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  return { init, openModal, closeModal };
})();
