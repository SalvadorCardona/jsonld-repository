import { AsyncRepositoryInterface } from "@/repository"
import { ApiError, ApiJsonLdError, client } from "jsonld-api-client"
import getIdFromObject from "@/getIdFromObject"
import { IdAbleInterface, JsonLDItem } from "jsonld-item"
import { isApiIri } from "jsonld-item"

function throwOnError<T>(result: {
  data?: T
  error?: unknown
  response: Response
}): { data: T } {
  if (result.error !== undefined) {
    throw new ApiError({
      status: result.response.status,
      statusText: result.response.statusText,
      url: result.response.url,
      data: result.error as ApiJsonLdError,
    })
  }

  return { data: result.data as T }
}

function resolveUrl(
  template: string,
  params: Record<string, unknown>
): {
  url: string
  pathParams: Record<string, string>
  remaining: Record<string, unknown>
} {
  const current = { ...params }

  if (!current.id && current["@id"]) {
    current.id = getIdFromObject(current as JsonLDItem<any>, true)
  }

  if (current.id && isApiIri(current.id as string)) {
    const url = current.id as string
    delete current.id
    return { url, pathParams: {}, remaining: current }
  }

  const pathParams: Record<string, string> = {}
  const remaining = { ...current }
  template.replace(/{(\w+)}/g, (_, key) => {
    if (remaining[key] !== undefined) {
      pathParams[key] = String(remaining[key])
      delete remaining[key]
    }
    return key
  })

  return { url: template, pathParams, remaining }
}

export function httpRepository<T extends IdAbleInterface>({
  path,
}: {
  path: string
}): AsyncRepositoryInterface<T> {
  return {
    getCollection: async (params?: Record<string, unknown>) => {
      const result = await client.GET(path as any, {
        params: { query: params },
      })

      return throwOnError(result)
    },
    getItem: async (params: Record<string, unknown>) => {
      const { url, pathParams, remaining } = resolveUrl(`${path}/{id}`, params)
      const result = await client.GET(url as any, {
        params: { path: pathParams, query: remaining },
      })

      return throwOnError(result)
    },
    updateItem: async (params: object) => {
      const { url, pathParams, remaining } = resolveUrl(
        `${path}/{id}`,
        params as Record<string, unknown>
      )

      const result = await client.PATCH(url as string, {
        params: { path: pathParams },
        body: remaining as any,
      })

      return throwOnError(result)
    },
    replaceItem: async (params: object) => {
      const { url, pathParams, remaining } = resolveUrl(
        `${path}/{id}`,
        params as Record<string, unknown>
      )
      const result = await client.PUT(url as any, {
        params: { path: pathParams },
        body: remaining as any,
      })

      return throwOnError(result)
    },
    createItem: async (params: object) => {
      const result = await client.POST(path, {
        body: params as any,
      })

      return throwOnError(result)
    },
    removeItem: async (params: Record<string, unknown>) => {
      const { url, pathParams } = resolveUrl(`${path}/{id}`, params)
      const result = await client.DELETE(url as any, {
        params: { path: pathParams },
      })
      if (result.response.status === 204) {
        return { data: undefined }
      }

      return throwOnError(result)
    },
  }
}
