export function nestedProperty<T, R>(obj: T, path: string): R | undefined {
  return path.split(".").reduce((acc: any, part: string) => acc && acc[part], obj)
}

export function isNestedProperty(obj: Record<string, any>, path: string): boolean {
  return (
    path.split(".").reduce((acc, part) => {
      if (acc && typeof acc === "object" && part in acc) {
        return acc[part]
      }
      return undefined
    }, obj) !== undefined
  )
}

export function getDataFromKey<T extends object, R>(
  obj: T,
  key: string
): R | undefined {
  if (!key || !obj) return undefined

  if (isNestedProperty(obj, key)) {
    return nestedProperty(obj, key)
  }
  if (Object.hasOwn(obj, key)) {
    return (obj as any)[key]
  }

  return undefined
}

export function setDataFromKey<T extends object>(
  obj: T,
  key: string,
  value: any
): T {
  if (!key || !obj) return obj

  const keys = key.split(".")

  if (keys.length === 1) {
    // Propriété simple
    return { ...obj, [key]: value }
  }

  // Propriété imbriquée
  const [firstKey, ...restKeys] = keys
  const remainingPath = restKeys.join(".")

  return {
    ...obj,
    [firstKey]: setDataFromKey((obj as any)[firstKey] || {}, remainingPath, value),
  }
}
