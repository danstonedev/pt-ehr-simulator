# Routing

The app uses a hash‑based router (`app/js/core/router.js`).

## Register a route

```js
import { route } from '../../core/router.js';
import { el } from '../../ui/utils.js';

route('#/feature/foo', async (app, qs, params) => {
  app.replaceChildren(el('h1', {}, 'Foo'));
});
```

Ensure the file that registers the route is imported in `initializeApp()` prior to `startRouter()`.

## Params and query

- Params are supported via simple matching in `router.js`.
- Query is provided as a `URLSearchParams` instance.

## Navigation

- Use anchors: `<a href="#/feature/foo">Open</a>`
- Or programmatic: `navigate('#/feature/foo')` (shortcut), or `url.navigate('/feature/foo')` if using `url` helpers.

## Transitions & a11y

- Route transitions respect `prefers-reduced-motion`.
- A screen‑reader announcer (`#route-announcer`) updates on route change.
