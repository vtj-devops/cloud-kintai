# Font System Strategy

## Overview

The Garaku Design System uses a carefully optimized font strategy to support both Japanese and English text with optimal performance and user experience across all platforms.

## Primary Font: Noto Sans JP

**Font Name:** `Noto Sans JP` (not "Noto Sans Japanese" - that's the full name)

### Why Noto Sans JP?

- **Comprehensive character support**: Full coverage for Japanese (Hiragana, Katakana, Kanji), English, and common symbols
- **Google Fonts optimized**: Lightweight, performance-optimized version available via Google Fonts CDN
- **Professional appearance**: Designed for modern interfaces with excellent readability at all sizes
- **Cross-platform consistency**: Renders consistently across macOS, Windows, iOS, and Android

### Google Fonts Integration

**Loading Method:** CSS `@import` in `src/index.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600&display=swap');
```

**Key Parameters:**
- `:wght@400;500;600` - Only load the weights we actually use (reduces bundle size)
- `&display=swap` - Show system font while Noto Sans JP loads (improves perceived performance)

## Font Stack and Fallback Chain

### Complete Font Stack Definition

**Location:** `src/shared/designSystem/tokens.ts` (line 88)

```typescript
fontFamily: "'Noto Sans JP', 'Helvetica Neue', Arial, sans-serif"
```

### Fallback Strategy

The font stack is ordered by platform optimization and availability:

1. **Noto Sans JP** (Primary - loaded from Google Fonts)
   - Best option for Japanese content
   - Loaded via Google Fonts CDN (optimized delivery)
   - Display strategy: `swap` (show system font while loading)

2. **Helvetica Neue** (macOS fallback)
   - System default on macOS/iOS
   - Professional appearance when Noto Sans JP unavailable
   - Better than Arial on Apple platforms

3. **Arial** (Windows fallback)
   - System default on Windows
   - Widely available on all platforms
   - Safe fallback when system fonts unavailable

4. **sans-serif** (Ultimate fallback)
   - Generic serif family (handled by browser/OS)
   - Should never reach this point in practice

### Font Weights

Only three weights are loaded and used:

- **400 (Regular)** - Body text, standard UI elements
- **500 (Medium)** - Emphasis, UI elements, labels
- **600 (Bold)** - Headings, strong emphasis, important text

## CSS Variable Integration

### Design System Variable

**Variable Name:** `--ds-typography-font-family`

**Generated from:** `src/shared/designSystem/tokens.ts` → `src/shared/designSystem/cssVariables.ts`

**Value:** `'Noto Sans JP', 'Helvetica Neue', Arial, sans-serif`

### How It Works

1. Token value from `tokens.ts` is processed by `cssVariables.ts`
2. Path `typography.fontFamily` converts to CSS variable: `--ds-typography-font-family`
3. Variable is bootstrapped to `document.documentElement` (`:root`)
4. All components reference the CSS variable instead of hardcoding font names

## Usage Patterns

### In Components

**Always use the design system variable, NOT hardcoded fonts:**

❌ **Bad:**
```typescript
fontFamily: "'Noto Sans JP', Arial, sans-serif"
```

✅ **Good:**
```typescript
fontFamily: "var(--ds-typography-font-family)"
```

### In Tailwind CSS

**File:** `src/tailwind.config.cjs`

```javascript
fontFamily: {
  sans: [
    "var(--ds-typography-font-family)",  // Primary (references the CSS variable)
    "Noto Sans JP",                       // Explicit fallback
    "-apple-system",                      // System fonts as last resort
    "BlinkMacSystemFont",
    "sans-serif",
  ],
}
```

**Usage in templates:**
```tsx
<div className="font-sans">Text using design system font</div>
```

### In MUI Theme

**File:** `src/shared/lib/theme/components.ts`

```typescript
body: {
  fontFamily: typography.fontFamily,  // References tokens.typography.fontFamily
  // ...
}
```

**File:** `src/shared/lib/theme/typography.ts`

```typescript
const buildTypography = (tokens, helpers) => {
  const { fontFamily } = tokens.typography;
  return {
    fontFamily,  // Passed through to all MUI typography variants
    h1: { /* ... */ },
    body1: { /* ... */ },
    // ...
  };
};
```

### In HTML/CSS

**File:** `src/index.css`

```css
body {
  font-family: var(--ds-typography-font-family, 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif);
}
```

**Fallback structure:** CSS variable → font stack (for when design system not yet bootstrapped)

## Special Cases

### Monospace Fonts (Code)

Monospace text is handled separately and does NOT use the design system font:

```css
code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
}
```

This ensures code blocks maintain proper character alignment and spacing.

### Code Highlighting

Libraries like `react-syntax-highlighter` should be configured to use system monospace fonts, not the body font.

### CJK (Chinese, Japanese, Korean) Considerations

The Noto Sans JP font:
- ✅ Includes full Japanese support (Hiragana, Katakana, Kanji)
- ✅ Includes English/Latin characters
- ✅ Includes common symbols
- ⚠️ Chinese/Korean glyphs may fall back to system fonts (not included in Noto Sans JP)

For multi-language support, update `tokens.ts` fontFamily if needed:
```typescript
fontFamily: "'Noto Sans JP', 'Noto Sans TC', 'Noto Sans SC', 'Noto Sans KR', sans-serif"
```

## Performance Optimization

### Current Optimizations

1. **Selective weight loading** - Only 400, 500, 600 (saves ~30KB per language)
2. **Display strategy `swap`** - No invisible text flash (FOIT)
3. **CSS variable model** - Single source of truth, cacheable styles
4. **System font fallback** - `-apple-system`, `BlinkMacSystemFont` for instant rendering

### Metrics to Monitor

- **FOUT (Flash of Unstyled Text)** - Noto Sans JP replaces with `swap` strategy
- **Font file size** - Currently ~200KB+ combined (optimized by Google Fonts)
- **Load time** - Google Fonts CDN is globally distributed (low latency)

### Future Improvements

- Consider `font-display: optional` if Noto Sans JP load time exceeds 3-4 seconds
- Use `@font-face` with `preload` for faster loading if moving to self-hosted fonts
- Implement subsetting for specific character sets if supporting multiple CJK languages

## Configuration Checklist

When updating fonts, ensure:

- [ ] Update token value in `src/shared/designSystem/tokens.ts`
- [ ] Verify CSS variable in `src/shared/designSystem/cssVariables.ts` (auto-generated)
- [ ] Check Tailwind config `src/tailwind.config.cjs` references variable
- [ ] Verify MUI theme `src/shared/lib/theme/typography.ts` uses tokens
- [ ] Update Google Fonts import in `src/index.css` if needed
- [ ] Test on all supported platforms (macOS, Windows, iOS, Android)
- [ ] Verify fallback chain works when Google Fonts is unavailable
- [ ] Check performance metrics (font load time, rendering)
- [ ] Update this documentation with any changes

## Font System Summary Table

| Aspect | Details |
|--------|---------|
| **Primary Font** | Noto Sans JP |
| **Loading Method** | Google Fonts CDN via `@import` in `src/index.css` |
| **Weights Loaded** | 400 (regular), 500 (medium), 600 (bold) |
| **Font Stack** | `'Noto Sans JP', 'Helvetica Neue', Arial, sans-serif` |
| **CSS Variable** | `--ds-typography-font-family` |
| **Display Strategy** | `swap` (show system font while loading) |
| **Token Location** | `src/shared/designSystem/tokens.ts` (line 88) |
| **CSS Variable Bootstrap** | `src/shared/designSystem/cssVariables.ts` |
| **Tailwind Integration** | `src/tailwind.config.cjs` (fontFamily.sans array) |
| **MUI Integration** | `src/shared/lib/theme/typography.ts` |
| **Global Styles** | `src/index.css` (body font-family fallback) |
| **Monospace Font** | `source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace` |
| **Character Support** | Japanese (Hiragana, Katakana, Kanji), English, common symbols |
| **File Size (estimate)** | ~200KB combined (optimized by Google Fonts) |
| **Performance Impact** | Minimal with `swap` strategy; no layout shift |

## Design Token Integration Overview

```
tokens.ts (fontFamily value)
    ↓
cssVariables.ts (generates --ds-typography-font-family)
    ↓
Bootstrapped to :root (document.documentElement)
    ↓
Used in three places:
  1. Tailwind CSS (fontFamily.sans)
  2. MUI Theme (typography.fontFamily)
  3. Global CSS (body fallback)
    ↓
Referenced by components via CSS variable or utility classes
```

## Quick Start: Using Fonts in Components

### For Regular Text (Use Design Tokens)

**In MUI `sx` prop:**
```tsx
<Box sx={{ fontFamily: "var(--ds-typography-font-family)" }}>
  Regular body text using design system font
</Box>
```

**In Tailwind CSS:**
```tsx
<div className="font-sans">
  Text using design system font (via Tailwind fontFamily config)
</div>
```

**In styled-components or CSS-in-JS:**
```typescript
const StyledText = styled.div`
  font-family: var(--ds-typography-font-family);
`;
```

### For Font Weights

**Use tokens for weight values:**
```typescript
import { designTokenVar } from "@shared/designSystem";

// Regular weight (400)
<Box sx={{ fontWeight: designTokenVar("typography.fontWeight.regular") }}>
  Regular text
</Box>

// Medium weight (500)
<Box sx={{ fontWeight: designTokenVar("typography.fontWeight.medium") }}>
  Slightly emphasized
</Box>

// Bold weight (600)
<Box sx={{ fontWeight: designTokenVar("typography.fontWeight.bold") }}>
  Strongly emphasized
</Box>
```

**Or use MUI Typography variants:**
```tsx
<Typography variant="h1">Heading</Typography>
<Typography variant="body1">Body text</Typography>
```

### For Special Cases: Monospace Fonts

**When you need code/monospace text:**
```tsx
<code style={{ fontFamily: "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace" }}>
  const code = "stays readable";
</code>
```

**Or use MUI's Typography with variant:**
```tsx
<Typography component="code" sx={{ fontFamily: "monospace" }}>
  Code snippet
</Typography>
```

**Note:** Do NOT use the design system fontFamily for code — monospace needs separate handling for character alignment.

### Checking Font Is Loaded

**In browser DevTools Console:**
```javascript
// Check if CSS variable is set
const fontFamily = getComputedStyle(document.documentElement)
  .getPropertyValue('--ds-typography-font-family')
  .trim();
console.log("Font family:", fontFamily);

// Check if Noto Sans JP is actually loaded
document.fonts.check("16px 'Noto Sans JP'")
  ? console.log("✅ Noto Sans JP is loaded")
  : console.log("⚠️ Noto Sans JP not loaded, using fallback");
```

**Debugging font fallback chain:**
```javascript
// If fonts aren't loading, check the Network tab for:
// https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600&display=swap
```

## Verification Checklist

Use this checklist to verify the font system is working correctly:

### Initial Setup ✓
- [ ] Google Fonts import is in `src/index.css`:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600&display=swap');
  ```
- [ ] Design token is defined in `src/shared/designSystem/tokens.ts` (line 88)
- [ ] CSS variable is bootstrapped in `src/shared/designSystem/cssVariables.ts`
- [ ] Tailwind config references the CSS variable in `src/tailwind.config.cjs`

### Visual Verification
- [ ] **Weight 400 (Regular):** Body text appears in regular weight
  - Test in: Any paragraph or standard component text
- [ ] **Weight 500 (Medium):** Medium emphasis appears slightly heavier
  - Test in: Labels, secondary headings, badge text
- [ ] **Weight 600 (Bold):** Strong emphasis appears heavy
  - Test in: Headings (h1-h6), primary labels, important alerts

### Japanese Character Rendering
- [ ] **Hiragana:** ひらがな renders correctly
- [ ] **Katakana:** カタカナ renders correctly  
- [ ] **Kanji:** 漢字 renders clearly (especially complex characters like 尖端)
- [ ] **Mixed text:** 日本語 with English and numbers 123 displays properly

### Fallback Testing

**Test in Chrome DevTools to simulate Noto Sans JP unavailability:**

1. Open DevTools → Network tab
2. Block the Google Fonts request:
   - Right-click `fonts.googleapis.com` → Block request domain
3. Reload page
4. **Expected behavior:**
   - Text should still render using Helvetica Neue (macOS) or Arial (Windows)
   - No layout shift or invisible text
   - Page should be readable

**To restore:** Unblock the domain in DevTools

### CSS Variable Verification
- [ ] Run in browser console:
  ```javascript
  console.log(getComputedStyle(document.documentElement)
    .getPropertyValue('--ds-typography-font-family'));
  ```
- [ ] Output should be: `'Noto Sans JP', 'Helvetica Neue', Arial, sans-serif`

### Performance Metrics
- [ ] Page load time with Noto Sans JP loaded: < 5 seconds
- [ ] No visible flash of unstyled text (FOUT) due to `display=swap`
- [ ] Font file downloads: Check Network tab → Fonts
  - Should see CSS file from googleapis.com
  - Font files themselves may be cached or preloaded

### Component Testing
- [ ] **Button text:** Uses design token (check AppButton, AppIconButton)
- [ ] **Dialog/Modal text:** Uses consistent font
- [ ] **Form inputs:** Placeholder and value text uses consistent font
- [ ] **Tables/Lists:** All content uses consistent font
- [ ] **Code blocks:** Use monospace font (NOT design system font)

### Cross-Platform Testing (if possible)
- [ ] **macOS/Safari:** Text renders with Noto Sans JP or Helvetica Neue fallback
- [ ] **Windows/Chrome:** Text renders with Noto Sans JP or Arial fallback
- [ ] **iOS/Safari:** Text renders appropriately
- [ ] **Android/Chrome:** Text renders appropriately

### Configuration Audit (When Updating Fonts)
When modifying font configuration, verify:
- [ ] `tokens.ts` fontFamily value updated (if changing font stack)
- [ ] `cssVariables.ts` regenerated (usually automatic)
- [ ] `src/index.css` Google Fonts import updated (if adding/removing weights)
- [ ] `tailwind.config.cjs` fontFamily array matches token value
- [ ] `src/shared/lib/theme/typography.ts` uses token (not hardcoded)
- [ ] All components reference `var(--ds-typography-font-family)` (not hardcoded names)
- [ ] Monospace fonts remain separate (not changed by font updates)
- [ ] Tests updated if font-specific snapshots exist

## References

- **Google Fonts Noto Sans JP:** https://fonts.google.com/noto/specimen/Noto+Sans+JP
- **Design Tokens Location:** `src/shared/designSystem/tokens.ts`
- **CSS Variables:** `src/shared/designSystem/cssVariables.ts`
- **Global Styles:** `src/index.css`
- **MUI Integration:** `src/shared/lib/theme/`
- **Tailwind Integration:** `tailwind.config.cjs`

## Related Documentation

- Design System Overview: See `.github/copilot-instructions.md`
- Design Token System: See design system token files
- Typography Variants: See MUI theme typography variants in `src/shared/lib/theme/typography.ts`
- Testing Guide: See `.github/instructions/testing-guide.md`
