/* ─────────────────────────────────────────────
   CAROUSEL. — State Manager
   ───────────────────────────────────────────── */

const STATE = {
  // Creation wizard
  wizard: {
    step: 0,
    slideCount: 6,
    composition: 'cinematic',   // symmetric | asymmetric | cinematic
    contentMode: 'mixed',       // text | image | typography | mixed
    artDirection: 'editorial',  // editorial | cinematic | brutalist | minimal | experimental | luxury
  },

  // Editor
  carousel: {
    title: 'Untitled Carousel',
    format: 'square',   // square | portrait | landscape | story
    zoom: 0.45,
    slides: [],
    selectedSlideId: null,
    selectedElementId: null,
  },

  // Style overrides
  style: {
    fontDisplay: 'Playfair Display',
    fontBody: 'Inter',
    colorScheme: 'dark',
    bgColor: '#111111',
    textColor: '#f0ede8',
    accentColor: '#c9a96e',
  },

  // UI state
  ui: {
    leftTab: 'style',     // style | images | elements
    previewOpen: false,
    previewSlide: 0,
    exportModalOpen: false,
    exportFormat: 'png',
    contextMenu: null,
  },
};

// ── History (undo/redo) ──────────────────────
const HISTORY = {
  past: [],
  future: [],
  MAX: 60,

  snapshot() {
    const snap = JSON.stringify(STATE.carousel);
    if (this.past.length && this.past[this.past.length - 1] === snap) return;
    this.past.push(snap);
    if (this.past.length > this.MAX) this.past.shift();
    this.future = [];
    Events.emit('history:change');
  },

  undo() {
    if (!this.past.length) return;
    this.future.push(JSON.stringify(STATE.carousel));
    const prev = this.past.pop();
    Object.assign(STATE.carousel, JSON.parse(prev));
    Events.emit('history:change');
    Events.emit('canvas:rebuild');
  },

  redo() {
    if (!this.future.length) return;
    this.past.push(JSON.stringify(STATE.carousel));
    const next = this.future.pop();
    Object.assign(STATE.carousel, JSON.parse(next));
    Events.emit('history:change');
    Events.emit('canvas:rebuild');
  },

  canUndo() { return this.past.length > 0; },
  canRedo() { return this.future.length > 0; },
};

// ── Simple Event Bus ─────────────────────────
const Events = {
  _listeners: {},
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return () => this.off(event, fn);
  },
  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  },
  emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  },
};

// ── ID Generator ────────────────────────────
let _idCounter = 1;
function genId(prefix = 'el') {
  return `${prefix}_${Date.now()}_${_idCounter++}`;
}

// ── Format dimensions ────────────────────────
const FORMATS = {
  square:    { w: 1080, h: 1080, label: 'Square 1:1',       icon: '⬜', desc: 'Instagram Feed, Facebook' },
  portrait:  { w: 1080, h: 1350, label: 'Portrait 4:5',     icon: '▯',  desc: 'Instagram Feed (tall)' },
  story:     { w: 1080, h: 1920, label: 'Story 9:16',       icon: '📱', desc: 'Instagram / TikTok Stories' },
  landscape: { w: 1920, h: 1080, label: 'Landscape 16:9',   icon: '🖥',  desc: 'YouTube, Presentations' },
  linkedin:  { w: 1200, h: 627,  label: 'LinkedIn 1.91:1',  icon: '💼', desc: 'LinkedIn Post' },
  twitter:   { w: 1600, h: 900,  label: 'Twitter/X 16:9',   icon: '𝕏',  desc: 'Twitter/X Post' },
  fbcover:   { w: 1640, h: 924,  label: 'FB Cover 16:9',    icon: '📘', desc: 'Facebook Cover Photo' },
};

function getFormatDims() {
  return FORMATS[STATE.carousel.format] || FORMATS.square;
}

// ── Slide roles ──────────────────────────────
const ROLES = ['hook', 'statement', 'image', 'info', 'transition', 'pause', 'peak', 'conclusion'];
const ROLE_ICONS = {
  hook: '⚡', statement: '💬', image: '🖼', info: 'ℹ',
  transition: '↗', pause: '◻', peak: '🔥', conclusion: '✦',
};

// ── Art directions ───────────────────────────
const ART_DIRECTIONS = {
  lookbook:     { label: 'Street Lookbook (OOTD)', color: '#ff2a2a', bg: '#0d0d0f', text: '#f5f5f7', accent: '#ff2a2a', secondaryAccent: '#ffffff', font: 'Playfair Display' },
  editorial:    { label: 'Editorial',              color: '#e8d5b0', bg: '#111111', text: '#f0ede8', accent: '#c9a96e', secondaryAccent: '#ffffff', font: 'Playfair Display' },
  cinematic:    { label: 'Cinematic',              color: '#6b9fd4', bg: '#0d0f14', text: '#e8e4dc', accent: '#6b9fd4', secondaryAccent: '#ffffff', font: 'Playfair Display' },
  brutalist:    { label: 'Brutalist',              color: '#f0f0f0', bg: '#ffffff', text: '#000000', accent: '#e05c5c', secondaryAccent: '#000000', font: 'Inter' },
  minimal:      { label: 'Minimal',                color: '#c8c8c8', bg: '#f5f5f3', text: '#1a1a1a', accent: '#888888', secondaryAccent: '#000000', font: 'Inter' },
  experimental: { label: 'Experimental',           color: '#d4a0e0', bg: '#0f0a18', text: '#e8e0f0', accent: '#d4a0e0', secondaryAccent: '#ffffff', font: 'Playfair Display' },
  luxury:       { label: 'Luxury',                 color: '#c9a96e', bg: '#0c0a06', text: '#f0ede4', accent: '#c9a96e', secondaryAccent: '#ffffff', font: 'Playfair Display' },
};

// ── Composition presets ──────────────────────
const COMPOSITIONS = {
  lookbook: {
    label: 'Street Lookbook',
    description: 'Framed cutouts, 3-stack details, floating PIP cards & bento grids',
    layouts: ['lookbook-framed-hero', 'lookbook-3stack-detail', 'lookbook-pip-cards', 'lookbook-split-floating', 'lookbook-accent-highlight', 'lookbook-contact-grid', 'lookbook-hero-clean'],
  },
  symmetric: {
    label: 'Symmetric',
    description: 'Structured, balanced, editorial',
    layouts: ['full-text-center', 'image-top-text-bottom', 'split-50-50', 'text-left-image-right'],
  },
  asymmetric: {
    label: 'Asymmetric',
    description: 'Intentionally unbalanced',
    layouts: ['text-30-image-70', 'image-20-text-80', 'diagonal-split', 'offset-text'],
  },
  cinematic: {
    label: 'Cinematic',
    description: 'Image-led with strong continuity',
    layouts: ['full-bleed-image', 'image-overlay-text', 'image-bottom-caption', 'cinematic-crop'],
  },
};
