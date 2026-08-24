import { beforeEach, describe, expect, it } from "vitest"
import { localStorageRepository } from "@/localStorageRepository"
import { setInStorage } from "ssr-safe-storage"

interface Article {
  "@id"?: string
  id?: string
  title?: string
  author?: { name?: string }
}

const seed = (members: Article[]) =>
  setInStorage("/api/articles", {
    "@id": "/api/articles",
    "@type": "Collection",
    member: members,
    totalItems: members.length,
  })

describe("localStorageRepository", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("returns an empty collection when storage holds nothing", async () => {
    const repo = localStorageRepository<Article>({ path: "/api/articles" })
    const { data } = await repo.getCollection()

    expect(data.member).toEqual([])
    // Reading must not create the key: an absent collection stays absent.
    expect(localStorage.getItem("/api/articles")).toBeNull()
  })

  it("reads back the collection it was seeded with", async () => {
    seed([{ "@id": "/api/articles/1", title: "First" }])
    const repo = localStorageRepository<Article>({ path: "/api/articles" })

    expect((await repo.getCollection()).data.member).toHaveLength(1)
  })

  it("finds one item by its IRI", async () => {
    seed([
      { "@id": "/api/articles/1", title: "First" },
      { "@id": "/api/articles/2", title: "Second" },
    ])
    const repo = localStorageRepository<Article>({ path: "/api/articles" })

    const { data } = await repo.getItem({ "@id": "/api/articles/2" })
    expect(data.title).toBe("Second")
  })

  it("filters the collection on a plain property", async () => {
    seed([
      { "@id": "/api/articles/1", title: "First" },
      { "@id": "/api/articles/2", title: "Second" },
    ])
    const repo = localStorageRepository<Article>({ path: "/api/articles" })

    const { data } = await repo.getCollection({ title: "Second" })
    expect(data.member).toHaveLength(1)
    expect(data.member[0].title).toBe("Second")
  })

  it("filters on a nested property through dotted notation", async () => {
    seed([
      { "@id": "/api/articles/1", author: { name: "Ada" } },
      { "@id": "/api/articles/2", author: { name: "Grace" } },
    ])
    const repo = localStorageRepository<Article>({ path: "/api/articles" })

    const { data } = await repo.getCollection({ "author.name": "Grace" })
    expect(data.member).toHaveLength(1)
  })
})
