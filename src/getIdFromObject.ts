import { IdAbleInterface } from "jsonld-item"
import { getIdFromIri } from "jsonld-item"

export default function getIdFromObject(
  object: IdAbleInterface,
  forceId: boolean = false
): string | undefined {
  if (object["@id"]) {
    if (forceId) {
      return getIdFromIri(object["@id"])
    }
    return object["@id"]
  }

  return object["id"] ?? undefined
}
