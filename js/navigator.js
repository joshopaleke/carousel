/* ─────────────────────────────────────────────
   CAROUSEL. — Slide Navigator (bottom strip)
   ───────────────────────────────────────────── */

const Navigator = (() => {
  let $nav;

  function init() {
    $nav = document.getElementById('nav-slides');
    document.getElementById('nav-add-btn').addEventListener('click', () => {
      const idx = slideIndex(STATE.carousel.selectedSlideId);
      Canvas.addSlideAfter(idx >= 0 ? idx : STATE.carousel.slides.length - 1);
    });
  }

  function rebuild() {
    $nav.innerHTML = '';
    const { w, h }  = getFormatDims();
    const zoom = STATE.carousel.zoom;
    const navH = 90;
    const navW = Math.round(navH * (w / h));

    STATE.carousel.slides.forEach((slide, idx) => {
      const $item = document.createElement('div');
      $item.className = 'nav-slide';
      $item.dataset.slideId = slide.id;
      if (slide.id === STATE.carousel.selectedSlideId) $item.classList.add('active');
      $item.style.width  = navW + 'px';
      $item.style.height = navH + 'px';

      const $inner = document.createElement('div');
      $inner.className = 'nav-slide-inner';
      $inner.style.cssText = `width:${navW}px;height:${navH}px;position:relative;overflow:hidden;`;

      // Mini render of the slide
      const $mini = renderMiniSlide(slide, navW, navH, w, h);
      $inner.appendChild($mini);

      const $num = document.createElement('div');
      $num.className = 'nav-slide-number';
      $num.textContent = String(idx + 1).padStart(2, '0');
      $inner.appendChild($num);

      const $role = document.createElement('div');
      $role.className = 'nav-slide-role';
      $role.textContent = slide.role;
      $inner.appendChild($role);

      $item.appendChild($inner);

      $item.addEventListener('click', () => {
        Canvas.selectSlide(slide.id);
        // Scroll main canvas to this slide
        const $cs = document.querySelector(`.canvas-slide[data-slide-id="${slide.id}"]`);
        if ($cs) $cs.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });

      // Drag-to-reorder (basic: click in nav reorders if dragged)
      $item.draggable = true;
      $item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', slide.id);
        $item.style.opacity = '0.4';
      });
      $item.addEventListener('dragend', () => { $item.style.opacity = ''; });
      $item.addEventListener('dragover', e => { e.preventDefault(); $item.style.boxShadow = '2px 0 0 var(--c-accent)'; });
      $item.addEventListener('dragleave', () => { $item.style.boxShadow = ''; });
      $item.addEventListener('drop', e => {
        e.preventDefault();
        $item.style.boxShadow = '';
        const fromId = e.dataTransfer.getData('text/plain');
        const fromIdx = slideIndex(fromId);
        const toIdx   = slideIndex(slide.id);
        if (fromIdx === toIdx) return;
        const slides = STATE.carousel.slides;
        const [moved] = slides.splice(fromIdx, 1);
        slides.splice(toIdx, 0, moved);
        HISTORY.snapshot();
        Canvas.rebuild();
      });

      $nav.appendChild($item);
    });

    // Add button
    const $add = document.getElementById('nav-add-btn');
    $nav.appendChild($add);
  }

  function renderMiniSlide(slide, W, H, origW, origH) {
    const scaleX = W / origW;
    const scaleY = H / origH;

    const $container = document.createElement('div');
    $container.style.cssText = `
      position: absolute; inset: 0;
      background: ${slide.bgColor};
      overflow: hidden;
    `;

    slide.elements.forEach(el => {
      if (el.type === 'text') {
        const $t = document.createElement('div');
        $t.style.cssText = `
          position:absolute;
          left:${Math.round(el.x * scaleX)}px;
          top:${Math.round(el.y * scaleY)}px;
          width:${Math.round(el.width * scaleX)}px;
          font-size:${Math.max(3, Math.round(el.fontSize * scaleX))}px;
          font-family:"${el.fontFamily}",sans-serif;
          font-weight:${el.fontWeight};
          color:${el.color};
          opacity:${el.opacity};
          line-height:${el.lineHeight};
          letter-spacing:${el.letterSpacing * scaleX}px;
          overflow:hidden;
          white-space:pre-wrap;
          pointer-events:none;
        `;
        $t.textContent = el.content;
        $container.appendChild($t);

      } else if (el.type === 'image') {
        const $i = document.createElement('div');
        $i.style.cssText = `
          position:absolute;
          left:${Math.round(el.x * scaleX)}px;
          top:${Math.round(el.y * scaleY)}px;
          width:${Math.round(el.width * scaleX)}px;
          height:${Math.round(el.height * scaleY)}px;
          overflow:hidden;
          pointer-events:none;
        `;
        if (el.src) {
          const $img = document.createElement('img');
          $img.src = el.src;
          $img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
          $i.appendChild($img);
        } else {
          $i.style.background = 'rgba(255,255,255,0.06)';
        }
        $container.appendChild($i);

      } else if (el.type === 'shape') {
        const $s = document.createElement('div');
        $s.style.cssText = `
          position:absolute;
          left:${Math.round(el.x * scaleX)}px;
          top:${Math.round(el.y * scaleY)}px;
          width:${Math.round(el.width * scaleX)}px;
          height:${Math.max(1, Math.round(el.height * scaleY))}px;
          background:${el.fill};
          opacity:${el.opacity};
          pointer-events:none;
          border-radius:1px;
        `;
        $container.appendChild($s);
      }
    });

    return $container;
  }

  function setActive(id) {
    document.querySelectorAll('.nav-slide').forEach($n => {
      $n.classList.toggle('active', $n.dataset.slideId === id);
    });
  }

  return { init, rebuild, setActive };
})();
