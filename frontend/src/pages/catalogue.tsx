import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, Filter, X, SlidersHorizontal } from "lucide-react"
import { useCatalogueStore } from "@/stores/catalogue-store"
import { ResourceCard } from "@/components/resource-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ResourceCategory, ResourceCondition } from "@/types"

const categories: { value: ResourceCategory; label: string }[] = [
  { value: "scripts", label: "Scripts" },
  { value: "lesson-plans", label: "Lesson Plans" },
  { value: "costumes", label: "Costumes" },
  { value: "props", label: "Props" },
  { value: "lighting", label: "Lighting" },
  { value: "sound", label: "Sound" },
  { value: "set-design", label: "Set Design" },
  { value: "makeup", label: "Makeup" },
  { value: "music", label: "Music" },
  { value: "other", label: "Other" },
]

const conditions: { value: ResourceCondition; label: string }[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "worn", label: "Worn" },
]

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "alphabetical", label: "A-Z" },
]

export default function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const {
    filteredResources,
    filters,
    isLoading,
    currentPage,
    totalPages,
    fetchResources,
    setFilters,
    resetFilters,
    toggleCategory,
    toggleCondition,
  } = useCatalogueStore()

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  useEffect(() => {
    const search = searchParams.get("search")
    if (search) {
      setSearchInput(search)
      setFilters({ search })
    }
  }, [searchParams, setFilters])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ search: searchInput })
    if (searchInput) {
      setSearchParams({ search: searchInput })
    } else {
      setSearchParams({})
    }
  }

  const handleClearFilters = () => {
    resetFilters()
    setSearchInput("")
    setSearchParams({})
  }

  const activeFilterCount =
    filters.categories.length +
    filters.conditions.length +
    (filters.search ? 1 : 0)

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="font-medium mb-3">Categories</h4>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.value} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category.value}`}
                checked={filters.categories.includes(category.value)}
                onCheckedChange={() => toggleCategory(category.value)}
              />
              <Label
                htmlFor={`cat-${category.value}`}
                className="text-sm cursor-pointer"
              >
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Conditions */}
      <div>
        <h4 className="font-medium mb-3">Condition</h4>
        <div className="space-y-2">
          {conditions.map((condition) => (
            <div key={condition.value} className="flex items-center space-x-2">
              <Checkbox
                id={`cond-${condition.value}`}
                checked={filters.conditions.includes(condition.value)}
                onCheckedChange={() => toggleCondition(condition.value)}
              />
              <Label
                htmlFor={`cond-${condition.value}`}
                className="text-sm cursor-pointer"
              >
                {condition.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Availability */}
      <div>
        <h4 className="font-medium mb-3">Availability</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="status-available"
              checked={filters.status.includes("available")}
              onCheckedChange={() => {
                const newStatus = filters.status.includes("available")
                  ? filters.status.filter((s) => s !== "available")
                  : [...filters.status, "available" as const]
                setFilters({ status: newStatus })
              }}
            />
            <Label htmlFor="status-available" className="text-sm cursor-pointer">
              Available Now
            </Label>
          </div>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <>
          <Separator />
          <Button variant="outline" className="w-full" onClick={handleClearFilters}>
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Resource Catalogue</h1>
        <p className="text-muted-foreground">
          Browse and borrow resources from fellow drama educators
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search resources..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {/* Sort */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) =>
            setFilters({ sortBy: value as typeof filters.sortBy })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mobile filter button */}
        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="lg:hidden">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <FilterContent />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <button
                onClick={() => {
                  setFilters({ search: "" })
                  setSearchInput("")
                  setSearchParams({})
                }}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.categories.map((cat) => (
            <Badge key={cat} variant="secondary" className="gap-1 capitalize">
              {cat.replace("-", " ")}
              <button
                onClick={() => toggleCategory(cat)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.conditions.map((cond) => (
            <Badge key={cond} variant="secondary" className="gap-1 capitalize">
              {cond}
              <button
                onClick={() => toggleCondition(cond)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-6 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex gap-6">
        {/* Desktop sidebar filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </h3>
              {activeFilterCount > 0 && (
                <Badge variant="secondary">{activeFilterCount}</Badge>
              )}
            </div>
            <FilterContent />
          </div>
        </aside>

        {/* Resources grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resources found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredResources.length} resource
                {filteredResources.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => fetchResources(currentPage - 1)}
                  >
                    ← Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => fetchResources(currentPage + 1)}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
