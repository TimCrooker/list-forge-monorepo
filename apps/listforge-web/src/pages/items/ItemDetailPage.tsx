import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useGetItemQuery,
  useDeleteItemMutation,
} from '@listforge/api-rtk';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@listforge/ui';
import { ArrowLeft, Loader2, Edit, Trash2 } from 'lucide-react';
import AiStatusBadge from '../../components/AiStatusBadge';

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useGetItemQuery(id!);
  const [deleteItem] = useDeleteItemMutation();

  const item = data?.item;
  const metaListing = item?.metaListing;

  // Poll for updates when AI is processing
  useEffect(() => {
    if (
      metaListing &&
      (metaListing.aiStatus === 'pending' || metaListing.aiStatus === 'in_progress')
    ) {
      const interval = setInterval(() => {
        refetch();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [metaListing?.aiStatus, refetch]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id!).unwrap();
        navigate('/items');
      } catch (err) {
        console.error('Failed to delete item:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <p className="text-red-600">Item not found</p>
            <Link to="/items">
              <Button variant="outline" className="mt-4">
                Back to Inventory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isProcessing =
    metaListing?.aiStatus === 'pending' ||
    metaListing?.aiStatus === 'in_progress';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link to="/items">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Inventory
              </Button>
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {item.title || 'Untitled Item'}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">
                    {item.status}
                  </Badge>
                  {metaListing && <AiStatusBadge status={metaListing.aiStatus} />}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {isProcessing && (
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      AI is processing your photos...
                    </p>
                    <p className="text-sm text-blue-700">
                      This may take a minute. The page will update automatically.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Photos */}
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
              </CardHeader>
              <CardContent>
                {item.photos.length === 0 ? (
                  <p className="text-gray-500">No photos</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {item.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className={`aspect-square rounded-lg overflow-hidden bg-gray-100 ${
                          photo.isPrimary ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <img
                          src={photo.storagePath}
                          alt="Item photo"
                          className="w-full h-full object-cover"
                        />
                        {photo.isPrimary && (
                          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meta Listing */}
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Listing</CardTitle>
              </CardHeader>
              <CardContent>
                {!metaListing ? (
                  <p className="text-gray-500">No meta listing yet</p>
                ) : (
                  <div className="space-y-4">
                    {metaListing.generatedTitle && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">
                          Title
                        </h3>
                        <p className="text-lg">{metaListing.generatedTitle}</p>
                      </div>
                    )}

                    {(metaListing.brand || metaListing.model || metaListing.category) && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                          Details
                        </h3>
                        <div className="space-y-1 text-sm">
                          {metaListing.category && (
                            <p>
                              <span className="font-medium">Category:</span>{' '}
                              {metaListing.category}
                            </p>
                          )}
                          {metaListing.brand && (
                            <p>
                              <span className="font-medium">Brand:</span>{' '}
                              {metaListing.brand}
                            </p>
                          )}
                          {metaListing.model && (
                            <p>
                              <span className="font-medium">Model:</span>{' '}
                              {metaListing.model}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {metaListing.priceSuggested && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">
                          Pricing
                        </h3>
                        <p className="text-2xl font-bold">
                          ${metaListing.priceSuggested.toFixed(2)}
                        </p>
                        {(metaListing.priceMin || metaListing.priceMax) && (
                          <p className="text-sm text-gray-500">
                            Range: ${metaListing.priceMin?.toFixed(2)} - $
                            {metaListing.priceMax?.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}

                    {metaListing.generatedDescription && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">
                          Description
                        </h3>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {metaListing.generatedDescription}
                        </p>
                      </div>
                    )}

                    {metaListing.bulletPoints &&
                      metaListing.bulletPoints.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-1">
                            Key Features
                          </h3>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {metaListing.bulletPoints.map((point, index) => (
                              <li key={index}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {metaListing.missingFields &&
                      metaListing.missingFields.length > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <h3 className="text-sm font-medium text-yellow-900 mb-1">
                            Missing Fields
                          </h3>
                          <ul className="list-disc list-inside text-sm text-yellow-800">
                            {metaListing.missingFields.map((field, index) => (
                              <li key={index}>{field}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

