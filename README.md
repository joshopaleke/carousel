# Carousel. — Cinematic Carousel Composer

A lightweight, high-craft creative web application for designing artistic, editorial, and cinematic social media carousels.

Unlike traditional slide decks or graphic design tools that treat slides as disconnected pages, **Carousel.** treats the carousel as **one continuous visual composition** across an infinite seamless canvas.

---

## ✨ Features

- **Continuous Visual Flow**: Seamless canvas view allowing elements, typography, and imagery to span across slide boundaries.
- **Direction & Mood Selection**: Curated visual directions (Brutalist, Editorial, Minimalist, Cinematic Noir, Neo-Grotesk, Cyberpunk, etc.) with coordinated color palettes, typography, and layout logic.
- **Dynamic Slide Counts**: Flexible 3 to 10+ slide sequences with intelligent composition balancing.
- **Editorial Typography Engine**: Responsive headline sizing, kicker/eyebrow labels, body typography, pull quotes, and folio numbering.
- **Seamless Slide Spanners**: Drag images and design blocks across slide seams with real-time continuous rendering.
- **Interactive Multi-Mode Workflow**:
  - **Landing / Intro**: Quick-start project launcher.
  - **Generation Wizard**: Step-by-step direction, slide count, aspect ratio, and content setup.
  - **Infinite Canvas Editor**: Full multi-slide continuous viewport with zoom, pan, snap guides, and drag-and-drop elements.
  - **Slide Navigator & Inspector**: Live thumb previews, layer ordering, typography hierarchy controls, and style adjustments.
  - **Live Carousel Preview**: Simulated Instagram / LinkedIn swipe experience with keyboard and touch navigation.
  - **Export Engine**: Export full multi-slide ZIP bundle, high-resolution individual PNGs, continuous strip image, or JSON project state.

---

## 🚀 Getting Started

Since Carousel. is built with vanilla HTML, modern CSS, and ES modules, no complex build pipeline is required.

### Run Locally

Simply serve the directory with any static HTTP server or open directly in modern browsers:

```bash
# Using python
python3 -m http.server 3000

# Or using npx serve
npx serve .
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠 Tech Stack

- **HTML5 & CSS3**: Custom design token system, responsive CSS Grid / Flexbox, glassmorphic UI styling.
- **Vanilla JavaScript (ES Modules)**: Modular architecture without framework bloat.
  - `state.js`: Centralized reactive state store and event bus.
  - `canvas.js`: Seamless multi-slide canvas rendering and seam crossing engine.
  - `slides.js`: Layout presets, typography balancing, and slide element generators.
  - `inspector.js`: Granular element and style manipulation panel.
  - `preview.js`: Social swipe simulation modal.
  - `exporter.js`: Canvas slicing, PNG generation, and project file packaging.

---

## 📄 License

MIT
