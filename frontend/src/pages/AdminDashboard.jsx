import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../api/axiosInstance';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await axios.get('/admin/stats');
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔥 Zylike Admin Dashboard</h1>
          <p className="text-gray-400">Platform Management & Creator Review</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Creators</p>
                <p className="text-2xl font-bold text-white">{stats?.totalCreators || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Creators</p>
                <p className="text-2xl font-bold text-green-400">{stats?.activeCreators || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Applications</p>
                <p className="text-2xl font-bold text-yellow-400">{stats?.pendingApplications || 0}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">With Impact IDs</p>
                <p className="text-2xl font-bold text-purple-400">{stats?.creatorsWithImpactIds || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🆔</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Application Review */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition-colors cursor-pointer"
               onClick={() => navigate('/admin/applications')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              {stats?.pendingApplications > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.pendingApplications}
                </span>
              )}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Review Applications</h3>
            <p className="text-gray-400 mb-4">Approve or reject creator applications and assign Impact IDs</p>
            <div className="flex items-center text-blue-400 font-medium">
              <span>Review Now</span>
              <span className="ml-2">→</span>
            </div>
          </div>

          {/* Creator Management */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-green-500 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚙️</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Manage Creators</h3>
            <p className="text-gray-400 mb-4">Update creator settings, commission rates, and Impact IDs</p>
            <div className="flex items-center text-green-400 font-medium">
              <span>Manage</span>
              <span className="ml-2">→</span>
            </div>
          </div>

          {/* Impact.com Integration */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-orange-500 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔗</span>
              </div>
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">ACTIVE</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Impact.com Integration</h3>
            <p className="text-gray-400 mb-4">WalmartCreator.com program (ID: 16662) - Real API integration</p>
            <div className="flex items-center text-orange-400 font-medium">
              <span>View Integration</span>
              <span className="ml-2">→</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">🚀 Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/admin/applications')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              📋 Review Applications ({stats?.pendingApplications || 0})
            </button>
            <button 
              onClick={() => toast.info('Creator management coming soon')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              👥 Manage Creators
            </button>
            <button 
              onClick={() => toast.info('Analytics dashboard coming soon')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              📊 View Analytics
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">🔍 System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-white">Impact.com API Connected</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-white">Application Review System</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-white">30/70 Revenue Split Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
