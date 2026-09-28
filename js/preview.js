/* ─────────────────────────────────────────────
   CAROUSEL. — Preview Mode
   ───────────────────────────────────────────── */

const Preview = (() => {
  let $screen, $slideWrapper, $counter, $dots;
  let currentIdx = 0;

  function init() {
    $screen      = document.getElementById('screen-preview');
    $slideWrapper= document.getElementById('preview-slide-wrapper');
    $counter     = document.getElementById('preview-counter');
    $dots        = document.getElementById('preview-dots');

    document.getElementById('preview-close')?.addEventListener('click', close);
    document.getElementById('preview-prev')?.addEventListener('click', () => navigate(-1));
    document.getElementById('preview-next')?.addEventListener('click', () => navigate(1));

    // Keyboard navigation in preview
    document.addEventListener('keydown', e => {
      if (!STATE.ui.previewOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate(1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   navigate(-1);
      if (e.key === 'Escape') close();
    });

    // Touch swipe
    let touchStartX = 0;
    $screen?.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
    $screen?.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1);
    });
  }

  function open(startIdx = 0) {
    currentIdx = startIdx;
    STATE.ui.previewOpen = true;
    $screen.classList.add('active');

    const { w, h } = getFormatDims();
    // Size preview to 80vh
    const maxH = window.innerHeight * 0.78;
    const maxW = window.innerWidth * 0.65;
    const scale = Math.min(maxH / h, maxW / w);
    const pw = Math.round(w * scale);
    const ph = Math.round(h * scale);
    $slideWrapper.style.width  = pw + 'px';
    $slideWrapper.style.height = ph + 'px';

    // Store scale for use in renderSlide
    $slideWrapper._scale = scale;
    $slideWrapper._pw = pw;
    $slideWrapper._ph = ph;

    buildDots();
    renderSlide('');
  }

  function close() {
    STATE.ui.previewOpen = false;
    $screen.classList.remove('active');
  }

  function navigate(dir) {
    const total = STATE.carousel.slides.length;
    const next = currentIdx + dir;
    if (next < 0 || next >= total) return;

    const anim = dir > 0 ? 'anim-next' : 'anim-prev';
    currentIdx = next;
    renderSlide(anim);
    updateDots();
  }

  function renderSlide(animClass) {
    const slide  = STATE.carousel.slides[currentIdx];
    const scale  = $slideWrapper._scale;
    const pw     = $slideWrapper._pw;
    const ph     = $slideWrapper._ph;
    const { w, h } = getFormatDims();

    // Build slide HTML
    const $content = document.createElement('div');
    $content.className = 'preview-slide-content';
    $content.style.cssText = `
      width:${pw}px;height:${ph}px;
      background:${slide.bgColor};
      position:relative;overflow:hidden;
    `;

    slide.elements.forEach(el => {
      const $el = document.createElement('div');
      $el.style.cssText = `
        position:absolute;
        left:${Math.round(el.x * scale)}px;
        top:${Math.round(el.y * scale)}px;
        width:${Math.round(el.width * scale)}px;
        height:${Math.round(el.height * scale)}px;
        opacity:${el.opacity};
        transform:rotate(${el.rotation||0}deg);
        overflow:hidden;
        z-index:${el.type==='image'?1:el.type==='shape'?2:3};
      `;

      if (el.type === 'text') {
        $el.style.fontFamily = `'${el.fontFamily}',serif`;
        $el.style.fontSize   = Math.round(el.fontSize * scale) + 'px';
        $el.style.fontWeight = el.fontWeight;
        $el.style.color      = el.color;
        $el.style.textAlign  = el.align;
        $el.style.lineHeight = el.lineHeight;
        $el.style.letterSpacing = (el.letterSpacing * scale) + 'px';
        $el.style.whiteSpace = 'pre-wrap';
        $el.style.wordBreak  = 'break-word';
        $el.textContent      = el.content;
        $el.style.overflow   = 'visible';
      } else if (el.type === 'image') {
        if (el.src) {
          const $img = document.createElement('img');
          $img.src = el.src;
          $img.style.cssText = `width:100%;height:100%;object-fit:cover;object-position:${el.focalX}% ${el.focalY}%;display:block;`;
          const f = el.filters || {};
          $img.style.filter = `brightness(${f.brightness??100}%) contrast(${f.contrast??100}%) saturate(${f.saturation??100}%)`;
          $el.appendChild($img);
        } else {
          $el.style.background = 'rgba(255,255,255,0.05)';
          $el.style.display = 'flex';
          $el.style.alignItems = 'center';
          $el.style.justifyContent = 'center';
          $el.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;
        }
      } else if (el.type === 'shape') {
        $el.style.background = el.fill;
        $el.style.borderRadius = '1px';
      }

      $content.appendChild($el);
    });

    $slideWrapper.innerHTML = '';
    $slideWrapper.appendChild($content);

    if (animClass) {
      $slideWrapper.classList.remove('anim-next', 'anim-prev');
      void $slideWrapper.offsetWidth; // reflow
      $slideWrapper.classList.add(animClass);
    }

    $counter.textContent = `${currentIdx + 1} / ${STATE.carousel.slides.length}`;
    document.getElementById('preview-prev').disabled = currentIdx === 0;
    document.getElementById('preview-next').disabled = currentIdx === STATE.carousel.slides.length - 1;
  }

  function buildDots() {
    $dots.innerHTML = '';
    STATE.carousel.slides.forEach((_, i) => {
      const $d = document.createElement('div');
      $d.className = 'preview-dot' + (i === 0 ? ' active' : '');
      $d.addEventListener('click', () => { currentIdx = i; renderSlide('anim-next'); updateDots(); });
      $dots.appendChild($d);
    });
  }

  function updateDots() {
    $dots.querySelectorAll('.preview-dot').forEach(($d, i) => {
      $d.classList.toggle('active', i === currentIdx);
    });
  }

  return { init, open, close };
})();
