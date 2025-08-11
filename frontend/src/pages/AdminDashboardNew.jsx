import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../api/axiosInstance';

const AdminDashboardNew = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch platform stats
      const statsRes = await axios.get('/admin/stats', { headers });
      setDashboardData(statsRes.data);
      console.log('✅ Admin Dashboard Data Loaded:', statsRes.data);

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data. Please try logging in again.');
      navigate('/admin-login'); // Redirect to login on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Admin Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-purple-400">
          🔥 Zylike Admin Dashboard v5.0 🚀
        </h1>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Total Creators</h2>
            <p className="text-4xl font-bold text-white">{dashboardData?.totalCreators || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Active Creators</h2>
            <p className="text-4xl font-bold text-green-400">{dashboardData?.activeCreators || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Pending Applications</h2>
            <p className="text-4xl font-bold text-yellow-400">{dashboardData?.pendingApplications || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-300 mb-2">With Impact IDs</h2>
            <p className="text-4xl font-bold text-blue-400">{dashboardData?.creatorsWithImpactIds || 0}</p>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Total Revenue</h2>
            <p className="text-3xl font-bold text-green-400">${dashboardData?.totalRevenue?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Creator Earnings</h2>
            <p className="text-3xl font-bold text-blue-400">${dashboardData?.totalCreatorEarnings?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Platform Fees</h2>
            <p className="text-3xl font-bold text-purple-400">${dashboardData?.totalPlatformFees?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        {/* Main Actions */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Admin Actions</h2>
          <div className="flex flex-col md:flex-row justify-center gap-6">
            <button
              onClick={() => navigate('/admin/applications')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-300 shadow-md flex items-center justify-center"
            >
              <span className="mr-3 text-3xl">📋</span> Review Applications
            </button>
            {/* Future admin actions can be added here */}
          </div>
        </div>

        {/* System Health */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">System Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Total Links:</span>
              <span className="ml-2 text-white font-semibold">{dashboardData?.totalLinks || 0}</span>
            </div>
            <div>
              <span className="text-gray-400">Total Clicks:</span>
              <span className="ml-2 text-white font-semibold">{dashboardData?.totalClicks || 0}</span>
            </div>
            <div>
              <span className="text-gray-400">Total Conversions:</span>
              <span className="ml-2 text-white font-semibold">{dashboardData?.totalConversions || 0}</span>
            </div>
            <div>
              <span className="text-gray-400">Conversion Rate:</span>
              <span className="ml-2 text-white font-semibold">{dashboardData?.conversionRate || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardNew;
