import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useListItemsQuery } from '@listforge/api-rtk';
import { Button, ProductGrid, type Product } from '@listforge/ui';
import { Plus, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/items/')({
  component: ItemsListPage,
});

function ItemsListPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useListItemsQuery({ page: 1, pageSize: 100 });

  // Transform items to Product format for ProductGrid
  const products: Product[] = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((item) => {
      const primaryPhoto = item.photos.find((p) => p.isPrimary) || item.photos[0];
      return {
        id: item.id,
        name: item.title || 'Untitled Item',
        description: item.metaListing?.generatedDescription || undefined,
        price: item.metaListing?.priceSuggested || 0,
        images: item.photos.length > 0 ? [primaryPhoto.storagePath] : [],
        category: item.metaListing?.category || undefined,
        tags: item.metaListing?.brand
          ? [item.metaListing.brand, item.metaListing.model].filter((t): t is string => Boolean(t))
          : [],
        inStock: item.status === 'ready' || item.status === 'listed',
        isNew: item.metaListing?.aiStatus === 'complete',
        featured: item.metaListing?.aiStatus === 'complete',
      };
    });
  }, [data?.items]);

  const handleQuickView = (product: Product) => {
    navigate({ to: '/items/$id', params: { id: product.id } });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Inventory</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Inventory</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">Error loading items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-6 py-6 px-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            {data?.total || 0} {data?.total === 1 ? 'item' : 'items'} in your inventory
          </p>
        </div>
        <Link to="/items/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Item
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">No items yet</p>
          <Link to="/items/new">
            <Button>Create your first item</Button>
          </Link>
        </div>
      ) : (
        <ProductGrid
          products={products}
          onQuickView={handleQuickView}
          columns={4}
          showFilters={true}
          showSorting={true}
          showPagination={true}
          itemsPerPage={12}
        />
      )}
    </div>
  );
}

