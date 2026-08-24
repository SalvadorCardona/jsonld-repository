import { IdAbleInterface } from "jsonld-item"
import { JsonLdCollection } from "jsonld-item"

export interface AsyncRepositoryInterface<T = IdAbleInterface> {
  getItem: (params: IdAbleInterface) => Promise<{ data: T }>
  getCollection: (
    params?: Record<string, any>
  ) => Promise<{ data: JsonLdCollection<T> }>
  removeItem: (params: IdAbleInterface) => Promise<any>
  createItem: (params: object) => Promise<{ data: T }>
  updateItem: (params: object) => Promise<{ data: T }>
  replaceItem: (params: object) => Promise<{ data: T }>
}
