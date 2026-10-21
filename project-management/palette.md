# Palette

Source of truth is the CSS. If a value here disagrees with the CSS, the CSS wins; update this file.

## Bright Ledger (`html.proto`)

Defined in `prototype.css` (`html.proto`). One mode, dark. Used by `index.html` and the pages that set `<html class="proto">` (recipes, projects, Radiculae, conferences, PhD). `prototype.css` re-maps the `style.css` tokens, so components keep their old token names.

| Role | Token | Value |
|------|-------|-------|
| Page background | `--ds-paper` → `--bg-body` | `#0f172a` |
| Card / surface | `--ds-card` → `--bg-surface` | `#172238` |
| Hover / offset section | `--ds-paper-2` → `--bg-surface-hover`, `--bg-offset` | `#1e293b` |
| Nav bar, Topics panel | `--ds-bar` | `#020617` |
| Text | `--ds-ink` → `--text-primary` | `#f8fafc` |
| Text, secondary | `--ds-ink-2` → `--text-secondary` | `#cbd5e1` |
| Text, muted | `--text-muted` | `#aab4c4` |
| Accent (amber) | `--ds-accent` | `#f2b233` |
| Accent as text/link | `--ds-accent-ink` → `--primary` | `#f6c15a` |
| Accent hover | `--ds-accent-hover` | `#f7c25c` |
| Secondary (sky) | `--secondary` | `#7fc3d9` |
| Border | `--ds-line` → `--border` | `#2c3a52` |
| Border, light | `--ds-line-2` → `--border-light` | `#3a4a66` |
| Tint: mint / peach / sky | `--ds-mint`, `--ds-peach`, `--ds-sky` | `#213a2c` / `#3b2a20` / `#1f3140` |

## Soft Pastel Earthy (`style.css`)

Fallback for pages without `html.proto`. Light by default, dark with `[data-theme="dark"]`.

| Role | Token | Light | Dark |
|------|-------|-------|------|
| Page background | `--bg-body` | `#fdfdfb` | `#141714` |
| Card / surface | `--bg-surface` | `#f5f5ed` | `#1e231f` |
| Surface hover | `--bg-surface-hover` | `#eeeee3` | `#282e29` |
| Offset section | `--bg-offset` | `#f0efe5` | `#181b18` |
| Text | `--text-primary` | `#3d3d3d` | `#e8eae6` |
| Text, secondary | `--text-secondary` | `#5c5c5c` | `#a8b2a7` |
| Text, muted | `--text-muted` | `#666666` | `#788277` |
| Primary (sage) | `--primary` | `#7a9e77` | `#8cb389` |
| Primary as text/link | `--primary-ink` | `#4f744c` | `#a2c79f` |
| Secondary (tan) | `--secondary` | `#c4a48e` | `#d4b59f` |
| Border | `--border` | `#e8e6db` | `#2b302c` |
| Border, light | `--border-light` | `#d9d7cc` | `#363e37` |

## Radiculae page (`projects/radiculae.html`)

On Bright Ledger like the other pages. `radiculae-proto.css` adds layout only and has no palette of its own; the old forest and cream palette is gone.
