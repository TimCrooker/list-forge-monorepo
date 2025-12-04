import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome, {user?.name}! You're in {currentOrg?.name || 'no organization'}.
          </p>
        </div>
      </div>
    </div>
  );
}

