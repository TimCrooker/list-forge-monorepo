import { useListUsersQuery, useUpdateUserAdminMutation } from '@listforge/api-rtk';
import { useState } from 'react';

export default function AdminUsersPage() {
  const { data, isLoading } = useListUsersQuery();
  const [updateUser] = useUpdateUserAdminMutation();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  const handleRoleChange = async (userId: string) => {
    try {
      await updateUser({
        userId,
        data: { globalRole: newRole as any },
      }).unwrap();
      setEditingUserId(null);
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <div className="mt-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {data?.users.map((user) => (
                  <li key={user.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Role: {user.globalRole} | Created:{' '}
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        {editingUserId === user.id ? (
                          <div className="flex items-center space-x-2">
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              className="border rounded px-2 py-1"
                            >
                              <option value="user">user</option>
                              <option value="staff">staff</option>
                              <option value="superadmin">superadmin</option>
                            </select>
                            <button
                              onClick={() => handleRoleChange(user.id)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-3 py-1 bg-gray-300 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingUserId(user.id);
                              setNewRole(user.globalRole);
                            }}
                            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            Edit Role
                          </button>
                        )}
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

