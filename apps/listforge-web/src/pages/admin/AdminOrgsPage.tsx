import { useListOrgsAdminQuery } from '@listforge/api-rtk';

export default function AdminOrgsPage() {
  const { data, isLoading } = useListOrgsAdminQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <div className="mt-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {data?.orgs.map((org) => (
                  <li key={org.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {org.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Status: {org.status} | Members: {org.memberCount || 0}{' '}
                          | Created: {new Date(org.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

