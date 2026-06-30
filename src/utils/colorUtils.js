// Helper: Convert hex to HSL
export function hexToHsl(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Helper: Convert HSL to Hex
export function hslToHex(h, s, l) {
  l /= 100;
  let a = s * Math.min(l, 1 - l) / 100;
  let f = n => {
    let k = (n + h / 30) % 12;
    let color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Helper: Adjust project colors for better contrast based on theme
export function getAdjustedProjectColor(hex, theme) {
  if (!hex || typeof hex !== 'string') return '#0010AE';
  try {
    const { h, s, l } = hexToHsl(hex);
    if (theme === 'dark') {
      const newL = Math.max(l, 70);
      const newS = Math.max(s, 60);
      return hslToHex(h, newS, newL);
    } else {
      let targetL = 40;
      let targetS = s;
      if (h >= 35 && h <= 70) {
        targetL = 32;
        targetS = Math.min(Math.max(s, 85), 100);
      } else if (h > 70 && h <= 150) {
        targetL = 35;
        targetS = Math.min(Math.max(s, 75), 100);
      } else {
        targetL = 42;
        targetS = Math.min(Math.max(s, 70), 95);
      }
      const newL = Math.min(l, targetL);
      return hslToHex(h, targetS, newL);
    }
  } catch (e) {
    console.error("Error adjusting project color:", hex, e);
    return hex;
  }
}
