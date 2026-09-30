# jsonld-repository

## 0.2.0

### Minor Changes

- 2baaeab: Initial release: CRUD repositories over a JSON-LD API — one HTTP-backed, one
  reading fixtures from localStorage — behind a single interface, so the code
  consuming data doesn't care which one it holds.

  Covered by 5 tests, where the module had none.

### Patch Changes

- 3f582c7: localStorageRepository: `updateItem`, `replaceItem` and `removeItem` now find an
  item stored under an IRI `@id` from its bare `id` too, comparing short forms as
  `getItem` already does. `{ id: "12" }` used to miss `{ "@id": "/things/12" }`:
  update and replace threw "Item not found", remove silently did nothing.
