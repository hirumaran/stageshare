import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem, Resource } from "@/types"
import { generateId } from "@/lib/utils"

interface CartState {
  items: CartItem[]
  
  // Actions
  addItem: (resource: Resource, startDate: string, endDate: string, message?: string) => void
  removeItem: (itemId: string) => void
  updateItem: (itemId: string, updates: Partial<Omit<CartItem, "id" | "resource">>) => void
  clearCart: () => void
  isInCart: (resourceId: string) => boolean
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (resource, startDate, endDate, message) => {
        // Don't add duplicates
        if (get().items.some((item) => item.resource.id === resource.id)) {
          return
        }
        
        const newItem: CartItem = {
          id: generateId(),
          resource,
          startDate,
          endDate,
          message,
        }
        
        set((state) => ({
          items: [...state.items, newItem],
        }))
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }))
      },

      updateItem: (itemId, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      isInCart: (resourceId) => {
        return get().items.some((item) => item.resource.id === resourceId)
      },

      getItemCount: () => {
        return get().items.length
      },
    }),
    {
      name: "skene-cart",
    }
  )
)
