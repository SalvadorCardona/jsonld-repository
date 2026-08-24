# jsonld-repository

CRUD repositories over a JSON-LD API, behind one interface — so the code that
consumes data doesn't care whether it comes from the network or from
`localStorage`.

```ts
import { httpRepository, localStorageRepository } from "jsonld-repository"

const articles = httpRepository<Article>({ path: "/api/articles" })

await articles.getCollection({ published: true })
await articles.getItem({ "@id": "/api/articles/42" })
await articles.createItem({ title: "Draft" })
await articles.updateItem({ "@id": "/api/articles/42", title: "Final" })
await articles.removeItem({ "@id": "/api/articles/42" })
```

Swapping the backing store changes one line:

```ts
const articles = localStorageRepository<Article>({ path: "/api/articles" })
```

## Installation

```bash
pnpm add jsonld-repository
```

It builds on [`jsonld-api-client`](https://github.com/SalvadorCardona/jsonld-api-client)
for HTTP and [`ssr-safe-storage`](https://github.com/SalvadorCardona/ssr-safe-storage)
for the local variant; both come along as dependencies.

## The interface

Every repository satisfies `AsyncRepositoryInterface<T>`:

| Method | Purpose |
| --- | --- |
| `getCollection(params?)` | The collection, optionally filtered |
| `getItem(params)` | One item, by IRI or by id |
| `createItem(body)` | POST |
| `updateItem(body)` | PATCH — a partial update |
| `replaceItem(body)` | PUT — a full replacement |
| `removeItem(params)` | DELETE |

Identifying an item is deliberately forgiving: `{ "@id": "/api/articles/42" }`,
`{ id: "42" }` or the whole JSON-LD object all work. When the value is already
an API IRI it is used as the URL directly, which is what lets you pass an item
straight back to the repository it came from.

## `httpRepository`

Talks to the API through `jsonld-api-client`, so it inherits its authentication
and headers — configure the client once and the repositories follow.

Errors surface as `ApiError`, carrying the `application/problem+json` body:

```ts
try {
  await articles.createItem({})
} catch (error) {
  if (error instanceof ApiError) {
    error.response.data.violations?.forEach((v) =>
      console.log(v.propertyPath, v.message)
    )
  }
}
```

A `204 No Content` on delete resolves with `data: undefined` rather than
throwing on an empty body.

## `localStorageRepository`

Reads a collection stored under `path` and filters it in memory. Filters accept
dotted paths, so `{ "author.name": "Ada" }` reaches into nested objects.

It is **read-only**: it never writes back, and reading a collection that isn't
there returns an empty one without creating the key. It exists to feed views
from fixtures — a demo, a story, a test — with the same calls the HTTP one
serves in production.

## Development

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## License

MIT
