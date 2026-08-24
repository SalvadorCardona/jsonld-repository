import { AsyncRepositoryInterface } from "@/repository"
import { getInStorage, setInStorage } from "ssr-safe-storage"
import { createJsonLdCollection, JsonLdCollection } from "jsonld-item"
import { createJsonLd } from "jsonld-item"
import getIdFromObject from "@/getIdFromObject"
import {
  isNestedProperty,
  nestedProperty,
} from "@/nestedProperty"
import { getIdFromIri } from "jsonld-item"

export function localStorageRepository<T>({
  path,
}: {
  path: string
}): AsyncRepositoryInterface<T> {
  // Read-only: never persists. With nothing in storage, an empty collection is
  // returned in memory rather than creating a localStorage key.
  const load = (): JsonLdCollection<T> => {
    return (
      getInStorage<JsonLdCollection<T>>(path) ??
      createJsonLdCollection<T>({ type: path })
    )
  }

  // Writing is the only moment the localStorage key is created or updated.
  const save = (data: any) => {
    setInStorage(path, data)
  }

  const getItemsArray = (col: any): T[] => {
    // Forgiving: accepts either "collection" or "member"
    return (col?.collection ?? col?.member ?? []) as T[]
  }

  const setItemsArray = (col: any, items: T[]) => {
    if (Array.isArray(col?.collection)) {
      col.collection = items
    } else if (Array.isArray(col?.member)) {
      col.member = items
    } else {
      // Otherwise follow what createJsonLdCollection produces
      col.collection = items
    }

    col.totalItems = items.length
  }

  // Utilitaires de filtrage
  const normalize = (v: unknown) =>
    typeof v === "string" ? v.toLowerCase().normalize("NFKD") : v

  const matchValue = (candidate: unknown, expected: unknown) => {
    // égalité stricte si non string
    if (typeof candidate !== "string" || typeof expected !== "string") {
      // gestion array includes
      if (Array.isArray(candidate)) {
        return candidate.includes(expected as any)
      }
      return candidate === expected
    }
    // string: match partiel insensible à la casse
    return normalize(candidate)
      ?.toString()
      .includes(normalize(expected)?.toString() ?? "")
  }

  const matchItemByParams = (
    item: any,
    params?: Record<string, unknown>
  ): boolean => {
    if (!params || Object.keys(params).length === 0) return true

    return Object.entries(params).every(([path, expected]) => {
      // support clé simple et clé imbriquée "a.b.c"
      const has = isNestedProperty(item as Record<string, any>, path)
      if (!has) return false
      const value = nestedProperty<any, any>(item, path)
      return matchValue(value, expected)
    })
  }

  return {
    getItem: async (params) => {
      const col = load()
      const items = getItemsArray(col)
      const id = getIdFromObject(params)

      if (!id) {
        throw new Error("Id Not founds")
      }

      const found = items.find((it: any) => {
        return getIdFromObject(it, true) === getIdFromIri(id)
      })

      if (!found) {
        throw new Error("Item not found in local storage repository with id : " + id)
      }

      return { data: found as T }
    },
    getCollection: async (params) => {
      // params: objet de filtre { "clé" ou "clé.nestée": valeur }
      const col = load()
      const items = getItemsArray(col)

      const filtered = items.filter((it: any) =>
        matchItemByParams(it, params as any)
      )

      // On renvoie une nouvelle collection JSON-LD filtrée tout en préservant la forme
      const data = {
        ...col,
      }

      setItemsArray(data, filtered as T[])

      return { data }
    },
    // ... existing code ...
    removeItem: async (params) => {
      const col = load()
      const items = getItemsArray(col)
      const id = getIdFromObject(params)
      const newItems = items.filter((it: any) => getIdFromObject(it) !== id)
      setItemsArray(col, newItems as T[])
      save(col)
      return { success: true }
    },
    createItem: async (params) => {
      const col = load()
      const items = getItemsArray(col)

      // Création d’un @id s’il n’existe pas
      const item = createJsonLd({ type: path, object: params })

      items.push(item as T)
      setItemsArray(col, items as T[])
      save(col)

      return { data: item as T }
    },
    updateItem: async (params) => {
      const col = load()
      const items = getItemsArray(col)
      const id = getIdFromObject(params)
      if (!id) {
        throw new Error("updateItem requires an @id or id")
      }

      const idx = items.findIndex((it: any) => getIdFromObject(it) === id)
      if (idx === -1) {
        throw new Error("Item not found to update with id :" + id)
      }
      const updated = { ...(items[idx] as any), ...(params as any) }
      items[idx] = updated as T
      setItemsArray(col, items as T[])
      save(col)

      return { data: updated as T }
    },
    replaceItem: async (params) => {
      const col = load()
      const items = getItemsArray(col)
      const id = getIdFromObject(params)
      if (!id) {
        throw new Error("replaceItem requires an @id or id")
      }
      const idx = items.findIndex((it: any) => getIdFromObject(it) === id)
      if (idx === -1) {
        throw new Error("Item not found to replace")
      }
      const replacement = { ...(params as any) }
      // Garantir la conservation de l'identifiant
      if (!getIdFromObject(replacement)) {
        replacement["@id"] = id
      }
      items[idx] = replacement as T
      setItemsArray(col, items as T[])
      save(col)
      return { data: replacement as T }
    },
  }
}
