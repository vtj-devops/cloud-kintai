type RGB = {
  r: number;
  g: number;
  b: number;
};

const clampChannel = (value: number) => Math.min(255, Math.max(0, value));

const toHex = (value: number) =>
  value.toString(16).padStart(2, "0").toUpperCase();

export const normalizeHex = (value: string) => {
  const trimmed = value.trim();
  const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (prefixed.length === 7) {
    return prefixed.toUpperCase();
  }

  if (prefixed.length === 4) {
    const [, r, g, b] = prefixed;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return prefixed.slice(0, 7).toUpperCase();
};

const hexToRgb = (value: string): RGB => {
  const normalized = normalizeHex(value);
  const numeric = parseInt(normalized.slice(1), 16);
  return {
    r: (numeric >> 16) & 0xff,
    g: (numeric >> 8) & 0xff,
    b: numeric & 0xff,
  };
};

export const hexToRgba = (value: string, alpha: number) => {
  const rgb = hexToRgb(value);
  const clamped = Math.min(1, Math.max(0, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamped})`;
};

const mixWithTarget = (value: string, amount: number, target: number) => {
  const rgb = hexToRgb(value);
  const ratio = Math.min(1, Math.max(0, Math.abs(amount)));
  const mix = (channel: number) =>
    clampChannel(Math.round(channel + (target - channel) * ratio));
  return `#${toHex(mix(rgb.r))}${toHex(mix(rgb.g))}${toHex(mix(rgb.b))}`;
};

export const tint = (value: string, amount: number) =>
  mixWithTarget(value, amount, 255);

export const shade = (value: string, amount: number) =>
  mixWithTarget(value, amount, 0);
