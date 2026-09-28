/* ─────────────────────────────────────────────
   CAROUSEL. — Slide & Element Factory
   ───────────────────────────────────────────── */

/* ── Default element templates ────────────── */
function makeTextElement(opts = {}) {
  const { w, h } = getFormatDims();
  return {
    id:    genId('txt'),
    type:  'text',
    x:     opts.x ?? w * 0.08,
    y:     opts.y ?? h * 0.1,
    width: opts.width  ?? w * 0.84,
    height:opts.height ?? h * 0.3,
    content:  opts.content  ?? 'Your text here',
    fontSize: opts.fontSize ?? 72,
    fontFamily: opts.fontFamily ?? STATE.style.fontDisplay,
    fontWeight: opts.fontWeight ?? 700,
    color:      opts.color ?? STATE.style.textColor,
    align:      opts.align ?? 'left',
    role:       opts.role  ?? 'hero',
    letterSpacing: opts.letterSpacing ?? -2,
    lineHeight:    opts.lineHeight    ?? 1.0,
    opacity:       opts.opacity       ?? 1,
    rotation:      opts.rotation      ?? 0,
    locked:        false,
  };
}

function makeImageElement(opts = {}) {
  const { w, h } = getFormatDims();
  return {
    id:     genId('img'),
    type:   'image',
    x:      opts.x  ?? 0,
    y:      opts.y  ?? 0,
    width:  opts.width  ?? w,
    height: opts.height ?? h,
    src:    opts.src    ?? null,
    objectFit:  opts.objectFit  ?? 'cover',
    focalX:     opts.focalX     ?? 50,
    focalY:     opts.focalY     ?? 50,
    opacity:    opts.opacity    ?? 1,
    rotation:   opts.rotation   ?? 0,
    filters:    opts.filters    ?? { brightness: 100, contrast: 100, saturation: 100 },
    locked:     false,
  };
}

function makeShapeElement(opts = {}) {
  const { w, h } = getFormatDims();
  return {
    id:     genId('shp'),
    type:   'shape',
    x:      opts.x      ?? w * 0.1,
    y:      opts.y      ?? h * 0.1,
    width:  opts.width  ?? w * 0.8,
    height: opts.height ?? 2,
    shape:  opts.shape  ?? 'rect',
    fill:   opts.fill   ?? STATE.style.accentColor,
    opacity: opts.opacity ?? 0.5,
    rotation: opts.rotation ?? 0,
    locked: false,
  };
}

/* ── Slide factory ────────────────────────── */
function makeSlide(opts = {}) {
  const { w, h } = getFormatDims();
  return {
    id:         genId('slide'),
    role:       opts.role  ?? 'statement',
    bgColor:    opts.bgColor ?? STATE.style.bgColor,
    elements:   opts.elements ?? [],
    width:      w,
    height:     h,
    label:      opts.label ?? '',
  };
}

/* ── Layout generators ────────────────────── */
function layoutForSlide(slideIndex, total, composition, artDir, contentMode) {
  const dir = ART_DIRECTIONS[artDir] || ART_DIRECTIONS.editorial;
  const { w, h } = getFormatDims();

  // Determine role based on position in sequence
  let role = 'statement';
  if (slideIndex === 0) role = 'hook';
  else if (slideIndex === total - 1) role = 'conclusion';
  else if (slideIndex === Math.floor(total * 0.4)) role = 'peak';
  else if (slideIndex === Math.floor(total * 0.2)) role = 'image';
  else if (slideIndex % 4 === 1) role = 'pause';

  const slide = makeSlide({ role, bgColor: dir.bg });
  const elements = [];

  // Layouts depend on composition + content mode + slide index
  const layout = pickLayout(composition, contentMode, slideIndex, total);

  if (layout === 'full-text-center') {
    const isHook = slideIndex === 0;
    const texts = isHook
      ? SAMPLE_HOOKS[artDir] || SAMPLE_HOOKS.editorial
      : SAMPLE_STATEMENTS[slideIndex % SAMPLE_STATEMENTS.length];

    elements.push(makeTextElement({
      content: texts.hero,
      fontSize: isHook ? Math.floor(h * 0.12) : Math.floor(h * 0.09),
      x: w * 0.08,
      y: isHook ? h * 0.28 : h * 0.32,
      width: w * 0.84,
      height: h * 0.45,
      color: dir.text,
      fontFamily: dir.font,
      align: 'left',
      role: 'hero',
    }));

    if (texts.sub) {
      elements.push(makeTextElement({
        content: texts.sub,
        fontSize: 18,
        x: w * 0.08,
        y: h * 0.7,
        width: w * 0.7,
        height: h * 0.12,
        color: dir.text,
        fontFamily: 'Inter',
        fontWeight: 400,
        opacity: 0.6,
        role: 'supporting',
      }));
    }

    // Slide number label
    elements.push(makeTextElement({
      content: String(slideIndex + 1).padStart(2, '0'),
      fontSize: 11,
      x: w * 0.08,
      y: h * 0.06,
      width: w * 0.2,
      height: h * 0.04,
      color: dir.accent,
      fontFamily: 'Inter',
      fontWeight: 600,
      opacity: 0.7,
      role: 'label',
      letterSpacing: 3,
    }));

    // Accent line
    elements.push(makeShapeElement({
      x: w * 0.08, y: h * 0.88,
      width: w * 0.15, height: 1,
      fill: dir.accent, opacity: 0.6,
    }));

  } else if (layout === 'image-overlay') {
    elements.push(makeImageElement({
      x: 0, y: 0, width: w, height: h,
      focalX: 50, focalY: 40,
    }));

    // Dark gradient overlay (represented as shape)
    elements.push(makeShapeElement({
      x: 0, y: h * 0.4,
      width: w, height: h * 0.6,
      fill: '#000000', opacity: 0.65,
    }));

    const texts = SAMPLE_STATEMENTS[slideIndex % SAMPLE_STATEMENTS.length];
    elements.push(makeTextElement({
      content: texts.hero,
      fontSize: Math.floor(h * 0.09),
      x: w * 0.08,
      y: h * 0.52,
      width: w * 0.84,
      height: h * 0.35,
      color: '#ffffff',
      fontFamily: dir.font,
      role: 'hero',
    }));

    elements.push(makeTextElement({
      content: String(slideIndex + 1).padStart(2, '0'),
      fontSize: 11,
      x: w * 0.08,
      y: h * 0.06,
      width: w * 0.2,
      height: h * 0.04,
      color: dir.accent,
      fontFamily: 'Inter',
      fontWeight: 600,
      opacity: 0.9,
      role: 'label',
      letterSpacing: 3,
    }));

  } else if (layout === 'split-image-text') {
    const imageRight = slideIndex % 2 === 0;
    const imgX = imageRight ? w * 0.5 : 0;
    elements.push(makeImageElement({
      x: imgX, y: 0,
      width: w * 0.5, height: h,
    }));

    const textX = imageRight ? w * 0.06 : w * 0.56;
    const texts = SAMPLE_STATEMENTS[slideIndex % SAMPLE_STATEMENTS.length];
    elements.push(makeTextElement({
      content: texts.hero,
      fontSize: Math.floor(h * 0.075),
      x: textX,
      y: h * 0.3,
      width: w * 0.38,
      height: h * 0.4,
      color: dir.text,
      fontFamily: dir.font,
      role: 'hero',
    }));
    if (texts.sub) {
      elements.push(makeTextElement({
        content: texts.sub,
        fontSize: 16,
        x: textX,
        y: h * 0.72,
        width: w * 0.38,
        height: h * 0.1,
        color: dir.text,
        fontFamily: 'Inter',
        fontWeight: 400,
        opacity: 0.55,
        role: 'supporting',
      }));
    }
    elements.push(makeTextElement({
      content: String(slideIndex + 1).padStart(2, '0'),
      fontSize: 11,
      x: textX,
      y: h * 0.06,
      width: w * 0.15,
      height: h * 0.04,
      color: dir.accent,
      fontFamily: 'Inter',
      fontWeight: 600,
      opacity: 0.7,
      role: 'label',
      letterSpacing: 3,
    }));

  } else if (layout === 'full-bleed-image') {
    elements.push(makeImageElement({
      x: 0, y: 0, width: w, height: h,
    }));
    elements.push(makeTextElement({
      content: String(slideIndex + 1).padStart(2, '0'),
      fontSize: 11,
      x: w * 0.06,
      y: h * 0.05,
      width: w * 0.15,
      height: h * 0.04,
      color: dir.accent,
      fontFamily: 'Inter',
      fontWeight: 600,
      opacity: 0.8,
      role: 'label',
      letterSpacing: 3,
    }));

  } else if (layout === 'large-type-asymmetric') {
    const texts = slideIndex === 0
      ? SAMPLE_HOOKS[artDir] || SAMPLE_HOOKS.editorial
      : SAMPLE_STATEMENTS[slideIndex % SAMPLE_STATEMENTS.length];

    // Background texture via shape
    elements.push(makeShapeElement({
      x: w * 0.6, y: 0,
      width: w * 0.4, height: h,
      fill: dir.accent, opacity: 0.05,
    }));

    elements.push(makeTextElement({
      content: texts.hero,
      fontSize: Math.floor(h * 0.135),
      x: w * 0.05,
      y: h * 0.08,
      width: w * 0.9,
      height: h * 0.7,
      color: dir.text,
      fontFamily: dir.font,
      role: 'hero',
      lineHeight: 0.9,
      letterSpacing: -4,
    }));

    if (texts.sub) {
      elements.push(makeTextElement({
        content: texts.sub,
        fontSize: 16,
        x: w * 0.6,
        y: h * 0.82,
        width: w * 0.34,
        height: h * 0.1,
        color: dir.text,
        fontFamily: 'Inter',
        fontWeight: 400,
        opacity: 0.5,
        align: 'right',
        role: 'supporting',
      }));
    }

    elements.push(makeShapeElement({
      x: w * 0.05, y: h * 0.88,
      width: w * 0.08, height: 1,
      fill: dir.accent, opacity: 0.8,
    }));
  }

  slide.elements = elements;
  return slide;
}

function pickLayout(composition, contentMode, index, total) {
  if (contentMode === 'image') return 'full-bleed-image';
  if (contentMode === 'typography') return 'large-type-asymmetric';

  const cinematicLayouts = ['image-overlay', 'full-bleed-image', 'image-overlay', 'split-image-text'];
  const symmetricLayouts = ['full-text-center', 'split-image-text', 'full-text-center', 'split-image-text'];
  const asymmetricLayouts = ['large-type-asymmetric', 'image-overlay', 'split-image-text', 'large-type-asymmetric'];

  // Hook slide is always strong
  if (index === 0) {
    if (composition === 'cinematic') return 'image-overlay';
    return composition === 'asymmetric' ? 'large-type-asymmetric' : 'full-text-center';
  }
  // Conclusion is always minimal text
  if (index === total - 1) return 'full-text-center';
  // Peak slide = cinematic
  if (index === Math.floor(total * 0.4)) return 'image-overlay';

  if (composition === 'cinematic')   return cinematicLayouts[index % cinematicLayouts.length];
  if (composition === 'asymmetric')  return asymmetricLayouts[index % asymmetricLayouts.length];
  return symmetricLayouts[index % symmetricLayouts.length];
}

/* ── Sample copy ──────────────────────────── */
const SAMPLE_HOOKS = {
  editorial: { hero: 'THE\nFUTURE\nIS HERE.', sub: 'A visual essay in five parts.' },
  cinematic: { hero: 'LIGHT\nAND\nSHADOW.', sub: 'Where stories live between frames.' },
  brutalist: { hero: 'BUILD\nBIG.\nFAIL\nSMALL.', sub: null },
  minimal:   { hero: 'Less noise.\nMore intention.', sub: null },
  experimental: { hero: 'BREAK\nTHE\nGRID.', sub: 'When rules become cages.' },
  luxury:    { hero: 'CRAFTED\nWITH\nINTENTION.', sub: 'Where every detail is a decision.' },
};

const SAMPLE_STATEMENTS = [
  { hero: 'DESIGN IS\nA DECISION.', sub: 'Every element communicates something.' },
  { hero: 'SLOW\nIS\nSMOOTH.', sub: 'Rhythm over speed.' },
  { hero: 'WHITE\nSPACE\nIS BOLD.', sub: 'What you remove matters most.' },
  { hero: 'THE\nSTORY\nMOVES.', sub: 'From frame to frame.' },
  { hero: 'CONTRAST\nCREATES\nCLARITY.', sub: 'See the difference.' },
  { hero: 'LESS\nIS\nNEVER\nLESS.', sub: 'Minimalism is a philosophy.' },
  { hero: 'EVERY\nSLIDE\nHAS A\nPURPOSE.', sub: 'Design with intention.' },
  { hero: 'FORM\nFOLLOWS\nFEELING.', sub: 'Typography is emotion.' },
  { hero: 'ONE\nCONTINUOUS\nSTORY.', sub: 'Made beautiful, slide by slide.' },
  { hero: 'THE END\nIS JUST\nTHE\nBEGINNING.', sub: null },
];

/* ── Generate full carousel ───────────────── */
function generateCarousel() {
  const { slideCount, composition, artDirection, contentMode } = STATE.wizard;
  const slides = [];

  for (let i = 0; i < slideCount; i++) {
    const slide = layoutForSlide(i, slideCount, composition, artDirection, contentMode);
    slides.push(slide);
  }

  STATE.carousel.slides = slides;
  STATE.carousel.selectedSlideId = slides[0]?.id ?? null;
  STATE.carousel.selectedElementId = null;

  const dir = ART_DIRECTIONS[artDirection] || ART_DIRECTIONS.editorial;
  STATE.style.bgColor = dir.bg;
  STATE.style.textColor = dir.text;
  STATE.style.accentColor = dir.accent;
  STATE.style.fontDisplay = dir.font;
}

/* ── Slide helpers ────────────────────────── */
function getSlide(id) {
  return STATE.carousel.slides.find(s => s.id === id);
}
function getSelectedSlide() {
  return getSlide(STATE.carousel.selectedSlideId);
}
function getElement(slideId, elId) {
  const slide = getSlide(slideId);
  return slide?.elements.find(e => e.id === elId);
}
function getSelectedElement() {
  return getElement(STATE.carousel.selectedSlideId, STATE.carousel.selectedElementId);
}
function slideIndex(id) {
  return STATE.carousel.slides.findIndex(s => s.id === id);
}
