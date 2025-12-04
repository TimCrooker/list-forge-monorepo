import { useListItemsQuery } from '@listforge/api-rtk';
import { Button } from '@listforge/ui';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ItemCard from '../../components/ItemCard';

export default function ItemsListPage() {
  const { data, isLoading, error } = useListItemsQuery({ page: 1, pageSize: 50 });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <p>Loading items...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <p className="text-red-600">Error loading items</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            <Link to="/items/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Item
              </Button>
            </Link>
          </div>

          {data?.items && data.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No items yet</p>
              <Link to="/items/new">
                <Button>Create your first item</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data?.items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

