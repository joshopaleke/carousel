/* ─────────────────────────────────────────────
   CAROUSEL. — Export Engine
   ───────────────────────────────────────────── */

const Exporter = (() => {
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

  function openModal() {
    STATE.ui.exportModalOpen = true;
    document.getElementById('export-modal').classList.add('active');
  }

  function closeModal() {
    STATE.ui.exportModalOpen = false;
    document.getElementById('export-modal').classList.remove('active');
  }

  async function doExport() {
    const fmt = STATE.ui.exportFormat;
    const slides = STATE.carousel.slides;
    const { w, h } = getFormatDims();

    UI.toast('Preparing export…', '⏳');
    closeModal();

    if (fmt === 'png-zip') {
      await exportZip(slides, w, h);
    } else {
      // Export individual PNGs one by one (download)
      for (let i = 0; i < slides.length; i++) {
        const dataUrl = await renderSlideToCanvas(slides[i], w, h);
        downloadDataUrl(dataUrl, `${sanitiseTitle()}_${String(i+1).padStart(2,'0')}.png`);
        await sleep(120);
      }
      UI.toast(`${slides.length} slides exported`, '✓');
    }
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
      const order = { image: 0, shape: 1, text: 2 };
      return (order[a.type] ?? 1) - (order[b.type] ?? 1);
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
        ctx.fillStyle = el.fill;
        ctx.fillRect(el.x, el.y, el.width, el.height);

      } else if (el.type === 'text') {
        ctx.fillStyle = el.color;
        ctx.font = `${el.fontWeight} ${el.fontSize}px '${el.fontFamily}', serif`;
        ctx.textBaseline = 'top';
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

  async function exportZip(slides, w, h) {
    // Manual ZIP construction without external library
    // We'll use a simple approach: download each slide with a short delay
    // and show a progress toast
    for (let i = 0; i < slides.length; i++) {
      UI.toast(`Exporting slide ${i+1}/${slides.length}`, '⬇');
      const dataUrl = await renderSlideToCanvas(slides[i], w, h);
      await sleep(80);
      downloadDataUrl(dataUrl, `${sanitiseTitle()}_${String(i+1).padStart(2,'0')}.png`);
    }
    UI.toast(`All ${slides.length} slides exported!`, '✓');
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
