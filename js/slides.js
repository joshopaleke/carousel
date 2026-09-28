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
    zIndex:        opts.zIndex        ?? 6,
    isBadge:       opts.isBadge       ?? false,
    badgeBg:       opts.badgeBg       ?? null,
    locked:        false,
  };
}

function makeImageElement(opts = {}) {
  const { w, h } = getFormatDims();
  return {
    id:          genId('img'),
    type:        'image',
    x:           opts.x  ?? 0,
    y:           opts.y  ?? 0,
    width:       opts.width  ?? w,
    height:      opts.height ?? h,
    src:         opts.src    ?? null,
    objectFit:   opts.objectFit  ?? 'cover',
    focalX:      opts.focalX     ?? 50,
    focalY:      opts.focalY     ?? 50,
    opacity:     opts.opacity    ?? 1,
    rotation:    opts.rotation   ?? 0,
    filters:     opts.filters    ?? { brightness: 100, contrast: 100, saturation: 100 },
    borderWidth: opts.borderWidth ?? 0,
    borderColor: opts.borderColor ?? '#ffffff',
    borderRadius: opts.borderRadius ?? 0,
    boxShadow:   opts.boxShadow   ?? null,
    zIndex:      opts.zIndex      ?? (opts.borderWidth ? 4 : 1),
    isFloating:  opts.isFloating  ?? false,
    locked:      false,
  };
}

function makeShapeElement(opts = {}) {
  const { w, h } = getFormatDims();
  return {
    id:          genId('shp'),
    type:        'shape',
    x:           opts.x      ?? w * 0.1,
    y:           opts.y      ?? h * 0.1,
    width:       opts.width  ?? w * 0.8,
    height:      opts.height ?? 2,
    shape:       opts.shape  ?? 'rect',
    fill:        opts.fill   ?? STATE.style.accentColor,
    stroke:      opts.stroke ?? null,
    strokeWidth: opts.strokeWidth ?? 0,
    opacity:     opts.opacity ?? 1,
    rotation:    opts.rotation ?? 0,
    zIndex:      opts.zIndex ?? (opts.strokeWidth ? 5 : 2),
    locked:      false,
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

/* ── Image Pool & Curated Demo Assets ─────── */
let _imagePool = [];

// High-aesthetic fashion & editorial fallback assets for Lookbook template demo
const LOOKBOOK_DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', // Fashion model portrait
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', // Streetwear detail / tie
  'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1200&q=80', // Casual male portrait outdoors
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80', // Chic street pose
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80', // Editorial accessories / watch / belt
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80', // Outfit full body walking
  'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80', // Shoes / streetwear details
];

function setImagePool(images) {
  _imagePool = images.map(img => typeof img === 'string' ? img : (img.src || img.dataUrl || ''));
}

function getImagePool() {
  return _imagePool.length > 0 ? _imagePool : LOOKBOOK_DEMO_IMAGES;
}

function getPoolImage(preferredIdx = 0, fallbackIdx = 0) {
  const pool = getImagePool();
  if (!pool.length) return null;
  const idx = preferredIdx % pool.length;
  return pool[idx] || pool[fallbackIdx % pool.length] || pool[0];
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

  const layout = pickLayout(composition, contentMode, slideIndex, total);

  /* ───────────────────────────────────────────────────────────
     LOOKBOOK / STREETWEAR OOTD TEMPLATE LAYOUTS
     (Faithfully matches the user's reference editorial style)
     ─────────────────────────────────────────────────────────── */
  if (layout === 'lookbook-framed-hero') {
    // 1. Full-bleed background hero photo
    elements.push(makeImageElement({
      x: 0, y: 0, width: w, height: h,
      src: getPoolImage(0),
      focalX: 50, focalY: 45,
      zIndex: 1,
    }));

    // 2. Signature white framed cutout overlay box bounding the torso/subject
    const frameInsetX = Math.round(w * 0.08);
    const frameInsetY = Math.round(h * 0.12);
    elements.push(makeShapeElement({
      x: frameInsetX,
      y: frameInsetY,
      width: w - frameInsetX * 2,
      height: h - frameInsetY * 2,
      fill: 'transparent',
      stroke: dir.secondaryAccent || '#ffffff',
      strokeWidth: Math.max(3, Math.round(w * 0.005)),
      zIndex: 4,
    }));

    // 3. Vintage rubber stamp / editorial badge in top-right corner ("SUNDAY OOTD")
    const badgeText = STATE.style.badgeText || 'SUNDAY\nOOTD';
    elements.push(makeTextElement({
      content: badgeText,
      fontSize: Math.floor(h * 0.038),
      x: Math.round(w * 0.45),
      y: Math.round(h * 0.04),
      width: Math.round(w * 0.48),
      height: Math.round(h * 0.08),
      color: dir.accent || '#ff2a2a',
      fontFamily: 'Playfair Display',
      fontWeight: 900,
      align: 'right',
      letterSpacing: 2,
      lineHeight: 0.95,
      zIndex: 6,
      isBadge: true,
      role: 'hero',
    }));

  } else if (layout === 'lookbook-3stack-detail') {
    // 3 horizontal macro/detail slices stacked vertically
    const sliceH = Math.floor(h * 0.328);
    const gap = Math.floor(h * 0.008);

    // Slice 1: Collar / Tie / Sunglasses / Macro detail (focal top)
    elements.push(makeImageElement({
      x: 0, y: 0, width: w, height: sliceH,
      src: getPoolImage(1, 0),
      focalX: 50, focalY: 15,
      zIndex: 1,
    }));

    // Slice 2: Belt / Watch / Hands / Waist detail (focal center)
    elements.push(makeImageElement({
      x: 0, y: sliceH + gap, width: w, height: sliceH,
      src: getPoolImage(2, 0),
      focalX: 50, focalY: 50,
      zIndex: 1,
    }));

    // Slice 3: Pants / Footwear / Shoes ground detail (focal bottom)
    elements.push(makeImageElement({
      x: 0, y: (sliceH + gap) * 2, width: w, height: sliceH,
      src: getPoolImage(3, 0),
      focalX: 50, focalY: 88,
      zIndex: 1,
    }));

    // Subtle gap dividers
    elements.push(makeShapeElement({
      x: 0, y: sliceH, width: w, height: gap,
      fill: dir.bg, stroke: null, zIndex: 3,
    }));
    elements.push(makeShapeElement({
      x: 0, y: (sliceH * 2) + gap, width: w, height: gap,
      fill: dir.bg, stroke: null, zIndex: 3,
    }));

  } else if (layout === 'lookbook-pip-cards') {
    // Full bleed background photo
    elements.push(makeImageElement({
      x: 0, y: 0, width: w, height: h,
      src: getPoolImage(4, 0),
      focalX: 50, focalY: 35,
      zIndex: 1,
    }));

    // Dark subtle gradient at bottom for card separation
    elements.push(makeShapeElement({
      x: 0, y: Math.round(h * 0.45),
      width: w, height: Math.round(h * 0.55),
      fill: 'rgba(0,0,0,0.3)', stroke: null, zIndex: 2,
    }));

    // 3 floating picture-in-picture framed cards overlapping lower third
    const cardW = Math.round(w * 0.27);
    const cardH = Math.round(h * 0.43);
    const cardY = Math.round(h * 0.52);

    // Left card: white border
    elements.push(makeImageElement({
      x: Math.round(w * 0.05),
      y: cardY,
      width: cardW,
      height: cardH,
      src: getPoolImage(1, 0),
      focalX: 50, focalY: 30,
      borderWidth: 3,
      borderColor: dir.secondaryAccent || '#ffffff',
      boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
      zIndex: 4,
      isFloating: true,
    }));

    // Center card: striking bold RED accent border! (Key focal pop)
    const centerW = Math.round(w * 0.29);
    const centerH = Math.round(h * 0.47);
    elements.push(makeImageElement({
      x: Math.round(w * 0.355),
      y: Math.round(h * 0.48),
      width: centerW,
      height: centerH,
      src: getPoolImage(2, 0),
      focalX: 50, focalY: 40,
      borderWidth: 4,
      borderColor: dir.accent || '#ff2a2a',
      boxShadow: '0 16px 36px rgba(0,0,0,0.7)',
      zIndex: 5,
      isFloating: true,
    }));

    // Right card: white border
    elements.push(makeImageElement({
      x: Math.round(w * 0.68),
      y: cardY,
      width: cardW,
      height: cardH,
      src: getPoolImage(3, 0),
      focalX: 50, focalY: 45,
      borderWidth: 3,
      borderColor: dir.secondaryAccent || '#ffffff',
      boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
      zIndex: 4,
      isFloating: true,
    }));

  } else if (layout === 'lookbook-split-floating') {
    // Seamless vertical bleed photo on the left
    elements.push(makeImageElement({
      x: 0, y: 0, width: Math.round(w * 0.60), height: h,
      src: getPoolImage(5, 0),
      focalX: 50, focalY: 40,
      zIndex: 1,
    }));

    // Floating framed portrait on the right with white border
    elements.push(makeImageElement({
      x: Math.round(w * 0.52),
      y: Math.round(h * 0.22),
      width: Math.round(w * 0.43),
      height: Math.round(h * 0.58),
      src: getPoolImage(6, 0),
      focalX: 50, focalY: 45,
      borderWidth: 4,
      borderColor: dir.secondaryAccent || '#ffffff',
      boxShadow: '0 14px 34px rgba(0,0,0,0.65)',
      zIndex: 4,
      isFloating: true,
    }));

  } else if (layout === 'lookbook-accent-highlight') {
    // Action / dynamic pose photo
    elements.push(makeImageElement({
      x: 0, y: 0, width: w, height: h,
      src: getPoolImage(0, 1),
      focalX: 50, focalY: 40,
      zIndex: 1,
    }));

    // Accent highlight frame framing the action / thumbs-up pose
    elements.push(makeShapeElement({
      x: Math.round(w * 0.48),
      y: Math.round(h * 0.08),
      width: Math.round(w * 0.48),
      height: Math.round(h * 0.72),
      fill: 'transparent',
      stroke: dir.accent || '#ff2a2a',
      strokeWidth: 5,
      zIndex: 5,
    }));

  } else if (layout === 'lookbook-contact-grid') {
    // 6-photo (2 cols x 3 rows) contact sheet bento grid
    const cols = 2;
    const rows = 3;
    const gutter = 4;
    const colW = Math.floor((w - (cols - 1) * gutter) / cols);
    const rowH = Math.floor((h - (rows - 1) * gutter) / rows);

    let cellIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * (colW + gutter);
        const cy = r * (rowH + gutter);
        elements.push(makeImageElement({
          x: cx,
          y: cy,
          width: colW,
          height: rowH,
          src: getPoolImage(cellIdx, cellIdx % 3),
          focalX: 50,
          focalY: cellIdx % 2 === 0 ? 30 : 70,
          zIndex: 1,
        }));
        cellIdx++;
      }
    }

  } else if (layout === 'lookbook-hero-clean') {
    // Clean full bleed portrait with minimalist sign-off
    elements.push(makeImageElement({
      x: 0, y: 0, width: w, height: h,
      src: getPoolImage(4, 2),
      focalX: 50, focalY: 40,
      zIndex: 1,
    }));

    // Slide label
    elements.push(makeTextElement({
      content: String(slideIndex + 1).padStart(2, '0'),
      fontSize: 12,
      x: Math.round(w * 0.08),
      y: Math.round(h * 0.06),
      width: Math.round(w * 0.2),
      height: Math.round(h * 0.04),
      color: dir.accent,
      fontFamily: 'Inter',
      fontWeight: 700,
      letterSpacing: 3,
      zIndex: 6,
      role: 'label',
    }));

  /* ───────────────────────────────────────────────────────────
     CLASSIC CINEMATIC / EDITORIAL / ASYMMETRIC LAYOUTS
     ─────────────────────────────────────────────────────────── */
  } else if (layout === 'full-text-center') {
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

    elements.push(makeShapeElement({
      x: w * 0.08, y: h * 0.88,
      width: w * 0.15, height: 1,
      fill: dir.accent, opacity: 0.6,
    }));

  } else if (layout === 'image-overlay') {
    elements.push(makeImageElement({
      x: 0, y: 0, width: w, height: h,
      src: getPoolImage(slideIndex),
      focalX: 50, focalY: 40,
    }));

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
      src: getPoolImage(slideIndex),
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
      src: getPoolImage(slideIndex),
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
  // If lookbook composition is selected:
  if (composition === 'lookbook' || STATE.wizard.artDirection === 'lookbook') {
    const lookbookOrder = [
      'lookbook-framed-hero',
      'lookbook-3stack-detail',
      'lookbook-pip-cards',
      'lookbook-split-floating',
      'lookbook-accent-highlight',
      'lookbook-contact-grid',
      'lookbook-hero-clean',
    ];
    return lookbookOrder[index % lookbookOrder.length];
  }

  if (contentMode === 'image') return 'full-bleed-image';
  if (contentMode === 'typography') return 'large-type-asymmetric';

  const cinematicLayouts = ['image-overlay', 'full-bleed-image', 'image-overlay', 'split-image-text'];
  const symmetricLayouts = ['full-text-center', 'split-image-text', 'full-text-center', 'split-image-text'];
  const asymmetricLayouts = ['large-type-asymmetric', 'image-overlay', 'split-image-text', 'large-type-asymmetric'];

  if (index === 0) {
    if (composition === 'cinematic') return 'image-overlay';
    return composition === 'asymmetric' ? 'large-type-asymmetric' : 'full-text-center';
  }
  if (index === total - 1) return 'full-text-center';
  if (index === Math.floor(total * 0.4)) return 'image-overlay';

  if (composition === 'cinematic')   return cinematicLayouts[index % cinematicLayouts.length];
  if (composition === 'asymmetric')  return asymmetricLayouts[index % asymmetricLayouts.length];
  return symmetricLayouts[index % symmetricLayouts.length];
}

/* ── Sample copy ──────────────────────────── */
const SAMPLE_HOOKS = {
  lookbook:     { hero: 'SUNDAY\nOOTD', sub: 'Streetwear & lifestyle editorial archive.' },
  editorial:    { hero: 'THE\nFUTURE\nIS HERE.', sub: 'A visual essay in five parts.' },
  cinematic:    { hero: 'LIGHT\nAND\nSHADOW.', sub: 'Where stories live between frames.' },
  brutalist:    { hero: 'BUILD\nBIG.\nFAIL\nSMALL.', sub: null },
  minimal:      { hero: 'Less noise.\nMore intention.', sub: null },
  experimental: { hero: 'BREAK\nTHE\nGRID.', sub: 'When rules become cages.' },
  luxury:       { hero: 'CRAFTED\nWITH\nINTENTION.', sub: 'Where every detail is a decision.' },
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

/* ── Smart Composer Engine ────────────────── */
function smartComposeCarousel(images = [], opts = {}) {
  if (images && images.length) {
    setImagePool(images);
  }

  const template = opts.template || 'lookbook';
  const format = opts.format || 'portrait'; // 4:5 Instagram portrait default for lookbooks
  const accentColor = opts.accentColor || '#ff2a2a';
  const badgeText = opts.badgeText || 'SUNDAY\nOOTD';
  const count = opts.slideCount || 7;

  // Set State
  STATE.carousel.format = format;
  STATE.wizard.slideCount = count;
  STATE.wizard.artDirection = template === 'lookbook' ? 'lookbook' : template;
  STATE.wizard.composition = template;
  STATE.wizard.contentMode = 'image';
  STATE.style.accentColor = accentColor;
  STATE.style.badgeText = badgeText;

  const dir = ART_DIRECTIONS[STATE.wizard.artDirection] || ART_DIRECTIONS.lookbook;
  STATE.style.bgColor = dir.bg;
  STATE.style.textColor = dir.text;
  STATE.style.fontDisplay = dir.font;

  const { w, h } = getFormatDims();
  const slides = [];

  for (let i = 0; i < count; i++) {
    const slide = layoutForSlide(i, count, STATE.wizard.composition, STATE.wizard.artDirection, STATE.wizard.contentMode);
    slide.width = w;
    slide.height = h;
    slides.push(slide);
  }

  STATE.carousel.slides = slides;
  STATE.carousel.selectedSlideId = slides[0]?.id ?? null;
  STATE.carousel.selectedElementId = null;

  HISTORY.snapshot();
  return slides;
}

/* ── Smart Image Shuffle ──────────────────── */
function shuffleCarouselImages() {
  const pool = getImagePool();
  if (!pool.length) return;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  let poolIdx = 0;
  STATE.carousel.slides.forEach(slide => {
    slide.elements.forEach(el => {
      if (el.type === 'image') {
        el.src = shuffled[poolIdx % shuffled.length];
        poolIdx++;
      }
    });
  });

  HISTORY.snapshot();
  Canvas.rebuild();
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
