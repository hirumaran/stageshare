import { create } from "zustand"
import type { Resource, CatalogueFilters, ResourceCategory, ResourceCondition, ResourceStatus } from "@/types"
import { apiFetch } from "@/lib/api"

interface CatalogueState {
  resources: Resource[]
  filteredResources: Resource[]
  selectedResource: Resource | null
  filters: CatalogueFilters
  isLoading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  totalItems: number

  // Actions
  setFilters: (filters: Partial<CatalogueFilters>) => void
  resetFilters: () => void
  setSelectedResource: (resource: Resource | null) => void
  fetchResources: (page?: number) => Promise<void>
  searchResources: (query: string) => void
  toggleCategory: (category: ResourceCategory) => void
  toggleCondition: (condition: ResourceCondition) => void
  toggleStatus: (status: ResourceStatus) => void
  createItem: (data: CreateItemInput) => Promise<Resource | null>
  updateItem: (id: string, data: UpdateItemInput) => Promise<Resource | null>
  deleteItem: (id: string) => Promise<boolean>
}

export interface CreateItemInput {
  name: string
  description?: string
  condition?: string
  category_id?: number
  quantity_total?: number
  quantity_available?: number
}

export interface UpdateItemInput {
  name?: string
  description?: string
  condition?: string
  category_id?: number
  quantity_total?: number
  is_active?: boolean
}

// ---------------------------------------------------------------------------
// Transform helpers — map backend snake_case / raw DB rows → frontend Resource
// ---------------------------------------------------------------------------

function mapCategory(_categoryId: unknown, categoryName?: string): ResourceCategory {
  if (categoryName) {
    const lower = categoryName.toLowerCase()
    if (lower.includes("costume") || lower.includes("cloth")) return "costumes"
    if (lower.includes("script") || lower.includes("book")) return "scripts"
    if (lower.includes("prop")) return "props"
    if (lower.includes("light")) return "lighting"
    if (lower.includes("sound") || lower.includes("audio")) return "sound"
    if (lower.includes("set") || lower.includes("design")) return "set-design"
    if (lower.includes("makeup")) return "makeup"
    if (lower.includes("music")) return "music"
    if (lower.includes("lesson") || lower.includes("plan")) return "lesson-plans"
  }
  return "other"
}

function mapCondition(condition: unknown): ResourceCondition {
  if (condition === "excellent" || condition === "good" || condition === "fair") return condition
  if (condition === "poor") return "worn" // backend "poor" → frontend "worn"
  return "good"
}

function mapStatus(item: Record<string, unknown>): ResourceStatus {
  if (!item.is_active) return "unavailable"
  const avail = Number(item.quantity_available ?? item.quantityAvailable ?? 0)
  if (avail <= 0) return "borrowed"
  return "available"
}

function mapItem(item: Record<string, unknown>): Resource {
  const images: string[] = []
  if (item.primary_image_url) images.push(item.primary_image_url as string)
  if (Array.isArray(item.images)) {
    for (const img of item.images as Array<{ image_url?: string }>) {
      if (img.image_url) images.push(img.image_url)
    }
  }

  return {
    id: String(item.id),
    title: (item.name as string) ?? "",
    description: (item.description as string) ?? "",
    category: mapCategory(item.category_id ?? item.categoryId, item.category_name as string | undefined),
    condition: mapCondition(item.condition),
    status: mapStatus(item),
    images,
    tags: [],
    ownerId: String(item.school_id ?? item.schoolId ?? ""),
    owner: {
      id: "",
      email: "",
      name: "",
      joinedAt: "",
      resourcesShared: 0,
      resourcesBorrowed: 0,
    },
    createdAt: (item.created_at as string) ?? (item.createdAt as string) ?? "",
    updatedAt: (item.updated_at as string) ?? (item.updatedAt as string) ?? "",
    borrowCount: 0,
    rating: 0,
    reviewCount: 0,
  }
}

// ---------------------------------------------------------------------------
// Client-side filtering (unchanged logic)
// ---------------------------------------------------------------------------

const defaultFilters: CatalogueFilters = {
  search: "",
  categories: [],
  conditions: [],
  status: [],
  sortBy: "newest",
}

function applyFilters(resources: Resource[], filters: CatalogueFilters): Resource[] {
  let result = [...resources]

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    result = result.filter(
      (r) =>
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        r.tags.some((t) => t.toLowerCase().includes(searchLower))
    )
  }

  if (filters.categories.length > 0) {
    result = result.filter((r) => filters.categories.includes(r.category))
  }

  if (filters.conditions.length > 0) {
    result = result.filter((r) => filters.conditions.includes(r.condition))
  }

  if (filters.status.length > 0) {
    result = result.filter((r) => filters.status.includes(r.status))
  }

  switch (filters.sortBy) {
    case "newest":
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case "popular":
      result.sort((a, b) => b.borrowCount - a.borrowCount)
      break
    case "rating":
      result.sort((a, b) => b.rating - a.rating)
      break
    case "alphabetical":
      result.sort((a, b) => a.title.localeCompare(b.title))
      break
  }

  return result
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCatalogueStore = create<CatalogueState>((set, get) => ({
  resources: [],
  filteredResources: [],
  selectedResource: null,
  filters: defaultFilters,
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,

  setFilters: (newFilters) => {
    const filters = { ...get().filters, ...newFilters }
    const filteredResources = applyFilters(get().resources, filters)
    set({ filters, filteredResources })
  },

  resetFilters: () => {
    const filteredResources = applyFilters(get().resources, defaultFilters)
    set({ filters: defaultFilters, filteredResources })
  },

  setSelectedResource: (resource) => {
    set({ selectedResource: resource })
  },

  fetchResources: async (page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const json = await apiFetch(`/items?page=${page}&limit=20`)
      const resources: Resource[] = (json.data as Record<string, unknown>[]).map(mapItem)
      const filteredResources = applyFilters(resources, get().filters)
      const pagination = json.pagination as { page: number; total: number; totalPages: number }
      set({
        resources,
        filteredResources,
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.total,
        isLoading: false,
      })
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
    }
  },

  searchResources: (query) => {
    const filters = { ...get().filters, search: query }
    const filteredResources = applyFilters(get().resources, filters)
    set({ filters, filteredResources })
  },

  toggleCategory: (category) => {
    const currentCategories = get().filters.categories
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category]
    get().setFilters({ categories: newCategories })
  },

  toggleCondition: (condition) => {
    const currentConditions = get().filters.conditions
    const newConditions = currentConditions.includes(condition)
      ? currentConditions.filter((c) => c !== condition)
      : [...currentConditions, condition]
    get().setFilters({ conditions: newConditions })
  },

  toggleStatus: (status) => {
    const currentStatus = get().filters.status
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status]
    get().setFilters({ status: newStatus })
  },

  createItem: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const json = await apiFetch("/items", {
        method: "POST",
        body: JSON.stringify(data),
      })
      const resource = mapItem(json as Record<string, unknown>)
      const resources = [...get().resources, resource]
      const filteredResources = applyFilters(resources, get().filters)
      set({ resources, filteredResources, isLoading: false })
      return resource
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
      return null
    }
  },

  updateItem: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const json = await apiFetch(`/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
      const updated = mapItem(json as Record<string, unknown>)
      const resources = get().resources.map((r) => (r.id === id ? updated : r))
      const filteredResources = applyFilters(resources, get().filters)
      set({ resources, filteredResources, isLoading: false, selectedResource: updated })
      return updated
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
      return null
    }
  },

  deleteItem: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await apiFetch(`/items/${id}`, { method: "DELETE" })
      const resources = get().resources.filter((r) => r.id !== id)
      const filteredResources = applyFilters(resources, get().filters)
      set({ resources, filteredResources, isLoading: false })
      return true
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
      return false
    }
  },
}))
