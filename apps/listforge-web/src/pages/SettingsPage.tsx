import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useMeQuery, useSwitchOrgMutation, useListOrgsQuery } from '@listforge/api-rtk';
import { setCurrentOrg, logout } from '../store/authSlice';
import { RootState } from '../store/store';

export default function SettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);
  const { data: meData } = useMeQuery();
  const { data: orgsData } = useListOrgsQuery();
  const [switchOrg] = useSwitchOrgMutation();

  const handleSwitchOrg = async (orgId: string) => {
    try {
      const result = await switchOrg({ orgId }).unwrap();
      dispatch(
        setCurrentOrg({
          org: result.org,
          token: result.token,
        }),
      );
    } catch (err) {
      console.error('Failed to switch org:', err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

          <div className="mt-8 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                User Profile
              </h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Name:</span> {meData?.user.name}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {meData?.user.email}
                </p>
                <p>
                  <span className="font-medium">Role:</span> {meData?.user.globalRole}
                </p>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Switch Organization
              </h2>
              <div className="space-y-2">
                {orgsData?.orgs.map((org) => (
                  <div
                    key={org.id}
                    className={`p-3 rounded border ${
                      currentOrg?.id === org.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-gray-500">{org.role}</p>
                      </div>
                      {currentOrg?.id !== org.id && (
                        <button
                          onClick={() => handleSwitchOrg(org.id)}
                          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Switch
                        </button>
                      )}
                      {currentOrg?.id === org.id && (
                        <span className="text-sm text-indigo-600 font-medium">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

