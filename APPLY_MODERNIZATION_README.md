# PT EMR Modernization Patch — How to Apply

This package includes a single unified diff you can apply to your project, plus a copy of the new `bootstrap.js`.

## What’s included

- `pt-ehr-modernization.patch` — updates:
  - `app/index.html` (modern head, skip link, live region, bootstrap loader)
  - `app/js/core/router.js` (title/focus/announce on route)
  - `app/js/ui/utils.js` (`el()` supports boolean attrs, dataset, aria, role)
  - **Adds** `app/js/bootstrap.js`
- `app_js_bootstrap.js` — the same contents as added by the patch (in case you want to copy manually).
- `css_additions.css` — small a11y helper classes to paste into your CSS.

## Prereqs

- Have your repo checked out locally.
- Commit or stash any changes first.

## Apply the patch (Git)

1. Save the patch file somewhere inside the repo (or anywhere).
2. From the repo root, run:
   ```powershell
   git apply .\pt-ehr-modernization.patch
   ```
3. If you see path mismatches, open the patch and adjust paths to match your project, then retry.

## Add the bootstrap module if needed

If the patch didn’t add `app/js/bootstrap.js`, copy the provided `app_js_bootstrap.js` into `app/js/bootstrap.js`.

## CSS additions (optional)

Append this to your main CSS file to improve keyboard and SR UX:

```css
/* Visually hidden but accessible */
.visually-hidden {
  position: absolute !important;
  height: 1px;
  width: 1px;
  overflow: hidden;
  clip: rect(1px, 1px, 1px, 1px);
  white-space: nowrap;
  border: 0;
  padding: 0;
  margin: -1px;
}
/* Skip link */
.skip-link {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.skip-link:focus {
  left: 8px;
  top: 8px;
  width: auto;
  height: auto;
  background: #000;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  z-index: 1000;
}
```

## Verify

- Start your static server and navigate around.
- On route change, focus moves to `#app`, page title updates, and a live region announces navigation.

## Rollback

If needed:

```powershell
git reset --hard HEAD
```
