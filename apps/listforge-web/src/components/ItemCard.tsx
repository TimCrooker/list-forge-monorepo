import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@listforge/ui';
import { ItemDto } from '@listforge/api-types';
import AiStatusBadge from './AiStatusBadge';

interface ItemCardProps {
  item: ItemDto;
}

export default function ItemCard({ item }: ItemCardProps) {
  const primaryPhoto = item.photos.find((p) => p.isPrimary) || item.photos[0];

  return (
    <Link to={`/items/${item.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden mb-4">
            {primaryPhoto ? (
              <img
                src={primaryPhoto.storagePath}
                alt={item.title || 'Item photo'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No photo
              </div>
            )}
          </div>
          <CardTitle className="text-lg line-clamp-2">
            {item.title || 'Untitled Item'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 capitalize">{item.status}</span>
            {item.metaListing && (
              <AiStatusBadge status={item.metaListing.aiStatus} />
            )}
          </div>
          {item.metaListing?.priceSuggested && (
            <p className="text-lg font-semibold mt-2">
              ${item.metaListing.priceSuggested.toFixed(2)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

