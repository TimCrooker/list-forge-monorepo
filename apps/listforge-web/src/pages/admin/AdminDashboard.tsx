export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            System overview and management tools.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Users</h3>
              <p className="mt-2 text-sm text-gray-500">
                Manage users and permissions
              </p>
              <a
                href="/admin/users"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
              >
                View Users →
              </a>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Organizations</h3>
              <p className="mt-2 text-sm text-gray-500">
                Manage organizations and memberships
              </p>
              <a
                href="/admin/orgs"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
              >
                View Organizations →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

