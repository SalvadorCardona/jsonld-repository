---
"jsonld-repository": patch
---

localStorageRepository: `updateItem`, `replaceItem` and `removeItem` now find an
item stored under an IRI `@id` from its bare `id` too, comparing short forms as
`getItem` already does. `{ id: "12" }` used to miss `{ "@id": "/things/12" }`:
update and replace threw "Item not found", remove silently did nothing.
