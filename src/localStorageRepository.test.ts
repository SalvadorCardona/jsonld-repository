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

describe("localStorageRepository, finding an item from its short id", () => {
  interface Thing {
    "@id"?: string
    id?: string | number
    title?: string
  }

  const seedThings = (members: Thing[]) =>
    setInStorage("/things", {
      "@id": "/things",
      "@type": "Collection",
      member: members,
      totalItems: members.length,
    })

  const stored = () =>
    JSON.parse(localStorage.getItem("/things") ?? "{}").member as Thing[]

  beforeEach(() => {
    localStorage.clear()
    seedThings([
      { "@id": "/things/12", id: "12", title: "Twelve" },
      { "@id": "/things/13", id: "13", title: "Thirteen" },
    ])
  })

  it.each([{ id: "12" }, { "@id": "/things/12" }])(
    "updates the item from %o",
    async (identity) => {
      const repo = localStorageRepository<Thing>({ path: "/things" })

      await repo.updateItem({ ...identity, title: "x" })

      expect(stored().find((it) => it["@id"] === "/things/12")?.title).toBe("x")
      expect(stored()[1].title).toBe("Thirteen")
    }
  )

  it.each([{ id: "12" }, { "@id": "/things/12" }])(
    "replaces the item from %o",
    async (identity) => {
      const repo = localStorageRepository<Thing>({ path: "/things" })

      await repo.replaceItem({ ...identity, title: "x" })

      expect(stored()).toHaveLength(2)
      expect(stored()[0].title).toBe("x")
      expect(stored()[1].title).toBe("Thirteen")
    }
  )

  it.each([{ id: "12" }, { "@id": "/things/12" }])(
    "removes the item from %o",
    async (identity) => {
      const repo = localStorageRepository<Thing>({ path: "/things" })

      await repo.removeItem(identity)

      expect(stored().map((it) => it["@id"])).toEqual(["/things/13"])
    }
  )

  it("still finds an item stored with a numeric id and no @id", async () => {
    seedThings([{ id: 12, title: "Twelve" }])
    const repo = localStorageRepository<Thing>({ path: "/things" })

    await repo.updateItem({ id: 12, title: "x" } as any)

    expect(stored()[0].title).toBe("x")
  })
})
