/* ─────────────────────────────────────────────
   CAROUSEL. — Font Manager & Local System Font Access
   ───────────────────────────────────────────── */

const Fonts = (() => {
  // Curated OS System Fonts present on macOS and Windows laptops
  const SYSTEM_FONTS = [
    // macOS Classics & System Display
    'SF Pro Display',
    'Helvetica Neue',
    'Helvetica',
    'Avenir Next',
    'Avenir',
    'Futura',
    'Didot',
    'Bodoni 72',
    'Baskerville',
    'Optima',
    'Gill Sans',
    'Palatino',
    'American Typewriter',
    'Charter',
    'Copperplate',
    'Menlo',
    // Windows Classics
    'Segoe UI',
    'Calibri',
    'Cambria',
    'Constantia',
    'Corbel',
    'Franklin Gothic Medium',
    'Century Gothic',
    'Trebuchet MS',
    'Verdana',
    'Georgia',
    'Tahoma',
    'Consolas',
    'Impact',
    'Courier New',
    'Times New Roman',
    'Arial',
  ];

  // Curated Web & Editorial Fonts
  const WEB_FONTS = [
    'Playfair Display',
    'Inter',
    'DM Serif Display',
    'Cormorant Garamond',
    'Space Grotesk',
    'IBM Plex Mono',
    'Outfit',
    'Syne',
    'Cinzel',
    'Montserrat',
    'Oswald',
    'Lora',
  ];

  let _laptopFonts = [];
  let _customFonts = [];
  let _isScanning = false;

  function init() {
    // Restore cached laptop fonts from localStorage
    try {
      const cached = localStorage.getItem('carousel_laptop_fonts');
      if (cached) {
        _laptopFonts = JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to load cached laptop fonts', e);
    }
  }

  function isLocalFontAccessSupported() {
    return typeof window !== 'undefined' && 'queryLocalFonts' in window;
  }

  async function scanLaptopFonts() {
    if (_isScanning) return { success: false, error: 'Scan already in progress' };
    _isScanning = true;

    if (!isLocalFontAccessSupported()) {
      _isScanning = false;
      return {
        success: false,
        supported: false,
        error: 'The Local Font Access API is supported in Chromium browsers (Chrome, Edge, Brave, Opera). You can still import any font files directly (.ttf, .otf, .woff2)!'
      };
    }

    try {
      // Requests user permission to access local fonts
      const availableFonts = await window.queryLocalFonts();
      const familySet = new Set();

      for (const font of availableFonts) {
        if (font.family && typeof font.family === 'string') {
          const trimmed = font.family.trim();
          if (trimmed && !trimmed.startsWith('.')) {
            familySet.add(trimmed);
          }
        }
      }

      _laptopFonts = Array.from(familySet).sort((a, b) => a.localeCompare(b));
      
      try {
        localStorage.setItem('carousel_laptop_fonts', JSON.stringify(_laptopFonts));
      } catch (err) {
        // quota limit fallback
      }

      _isScanning = false;
      Events.emit('fonts:updated');
      return { success: true, count: _laptopFonts.length, fonts: _laptopFonts };
    } catch (err) {
      _isScanning = false;
      return {
        success: false,
        error: err.name === 'NotAllowedError' ? 'Font access permission was denied.' : err.message
      };
    }
  }

  async function importFontFile(file) {
    if (!file) return null;
    const rawName = file.name.replace(/\.[^/.]+$/, '').trim();
    const cleanName = rawName.replace(/[-_]/g, ' ');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fontFace = new FontFace(cleanName, arrayBuffer);
      await fontFace.load();
      document.fonts.add(fontFace);

      if (!_customFonts.includes(cleanName)) {
        _customFonts.unshift(cleanName);
      }

      Events.emit('fonts:updated');
      return cleanName;
    } catch (err) {
      console.error('Error importing font file:', err);
      throw err;
    }
  }

  function getLaptopFonts() {
    return [..._laptopFonts];
  }

  function getCustomFonts() {
    return [..._customFonts];
  }

  function getSystemFonts() {
    return [...SYSTEM_FONTS];
  }

  function getWebFonts() {
    return [...WEB_FONTS];
  }

  function renderSelectOptions(selectedFont) {
    const selected = (selectedFont || '').trim();
    let html = '';

    // 1. Custom Imported Fonts
    if (_customFonts.length > 0) {
      html += `<optgroup label="🌟 Custom Imported Fonts">`;
      _customFonts.forEach(f => {
        html += `<option value="${f}" ${f.toLowerCase() === selected.toLowerCase() ? 'selected' : ''}>${f}</option>`;
      });
      html += `</optgroup>`;
    }

    // 2. Laptop Local Fonts (if scanned)
    if (_laptopFonts.length > 0) {
      html += `<optgroup label="💻 Laptop Installed Fonts (${_laptopFonts.length})">`;
      _laptopFonts.forEach(f => {
        html += `<option value="${f}" ${f.toLowerCase() === selected.toLowerCase() ? 'selected' : ''}>${f}</option>`;
      });
      html += `</optgroup>`;
    }

    // 3. Editorial & Google Web Fonts
    html += `<optgroup label="✦ Editorial & Web Fonts">`;
    WEB_FONTS.forEach(f => {
      html += `<option value="${f}" ${f.toLowerCase() === selected.toLowerCase() ? 'selected' : ''}>${f}</option>`;
    });
    html += `</optgroup>`;

    // 4. macOS & Windows System Fonts
    html += `<optgroup label="💻 System Fonts (macOS / Windows)">`;
    SYSTEM_FONTS.forEach(f => {
      html += `<option value="${f}" ${f.toLowerCase() === selected.toLowerCase() ? 'selected' : ''}>${f}</option>`;
    });
    html += `</optgroup>`;

    // If current font is not in any list, add it at the top
    const allKnown = [..._customFonts, ..._laptopFonts, ...WEB_FONTS, ...SYSTEM_FONTS].map(s => s.toLowerCase());
    if (selected && !allKnown.includes(selected.toLowerCase())) {
      html = `<option value="${selected}" selected>★ ${selected}</option>` + html;
    }

    return html;
  }

  // Preload / guarantee font is ready before canvas export
  async function ensureFontReady(fontFamily, weight = 400) {
    if (!fontFamily) return;
    try {
      await document.fonts.load(`${weight} 24px "${fontFamily}"`);
    } catch (e) {
      // ignore
    }
  }

  return {
    init,
    isLocalFontAccessSupported,
    scanLaptopFonts,
    importFontFile,
    getLaptopFonts,
    getCustomFonts,
    getSystemFonts,
    getWebFonts,
    renderSelectOptions,
    ensureFontReady,
  };
})();
