import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../api/axiosInstance';

// Chart Component for Analytics
const MetricChart = ({ data, title, color = '#8B5CF6', type = 'bar' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-xl mb-2">📊</div>
          <p className="text-xs">No data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="h-32">
      <div className="flex items-end h-24 space-x-1">
        {data.slice(0, 12).map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full rounded-t transition-all duration-300 hover:opacity-80"
              style={{
                height: maxValue > 0 ? `${Math.max((item.value / maxValue) * 100, 2)}%` : '2%',
                backgroundColor: color,
                minHeight: '2px'
              }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-xs text-gray-500 mt-1 truncate text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Traffic Source Component
const TrafficSourceAnalytics = ({ trafficData }) => (
  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
      <span className="mr-2">🌐</span>
      Traffic Sources
    </h3>
    <div className="space-y-3">
      {trafficData?.sources?.map((source, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></div>
            <span className="text-gray-300">{source.name}</span>
          </div>
          <div className="text-right">
            <div className="text-white font-semibold">{source.visits}</div>
            <div className="text-xs text-gray-400">{source.percentage}%</div>
          </div>
        </div>
      )) || <p className="text-gray-400 text-center py-4">No traffic data available</p>}
    </div>
  </div>
);

// Creator Performance Table
const CreatorPerformanceTable = ({ creators, onViewDetails }) => (
  <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
    <div className="p-6 border-b border-gray-700">
      <h3 className="text-lg font-semibold text-white flex items-center">
        <span className="mr-2">👥</span>
        Creator Performance
      </h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-700/50">
          <tr>
            <th className="text-left py-3 px-6 text-gray-300 font-medium">Creator</th>
            <th className="text-left py-3 px-6 text-gray-300 font-medium">Traffic Sources</th>
            <th className="text-left py-3 px-6 text-gray-300 font-medium">Earnings</th>
            <th className="text-left py-3 px-6 text-gray-300 font-medium">Conversion</th>
            <th className="text-left py-3 px-6 text-gray-300 font-medium">Status</th>
            <th className="text-left py-3 px-6 text-gray-300 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {creators.map((creator) => (
            <tr key={creator.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
              <td className="py-4 px-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {creator.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-medium">{creator.name}</div>
                    <div className="text-gray-400 text-sm">{creator.email}</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="flex flex-wrap gap-1">
                  {creator.trafficSources?.slice(0, 3).map((source, idx) => (
                    <span key={idx} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                      {source}
                    </span>
                  )) || <span className="text-gray-400 text-sm">No data</span>}
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="text-green-400 font-semibold">
                  ${creator.totalEarnings?.toFixed(2) || '0.00'}
                </div>
                <div className="text-gray-400 text-sm">
                  {creator.totalClicks || 0} clicks
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="text-white">
                  {creator.conversionRate?.toFixed(1) || '0.0'}%
                </div>
              </td>
              <td className="py-4 px-6">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  creator.applicationStatus === 'APPROVED' 
                    ? 'bg-green-500/20 text-green-300'
                    : creator.applicationStatus === 'PENDING'
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {creator.applicationStatus}
                </span>
              </td>
              <td className="py-4 px-6">
                <button
                  onClick={() => onViewDetails(creator)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Application Review Component
const ApplicationReview = ({ applications, onApprove, onReject }) => (
  <div className="bg-gray-800 rounded-xl border border-gray-700">
    <div className="p-6 border-b border-gray-700">
      <h3 className="text-lg font-semibold text-white flex items-center">
        <span className="mr-2">📋</span>
        Pending Applications ({applications.length})
      </h3>
    </div>
    <div className="space-y-4 p-6">
      {applications.map((app) => (
        <div key={app.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {app.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{app.name}</h4>
                  <p className="text-gray-400 text-sm">{app.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-gray-400 text-xs">Social Media</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {app.socialInstagram && <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded">Instagram</span>}
                    {app.socialTiktok && <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">TikTok</span>}
                    {app.socialYoutube && <span className="text-xs bg-red-600/20 text-red-300 px-2 py-1 rounded">YouTube</span>}
                    {app.socialTwitter && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Twitter</span>}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Applied</p>
                  <p className="text-gray-300 text-sm">{new Date(app.appliedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Bio</p>
                <p className="text-gray-300 text-sm mt-1">{app.bio}</p>
              </div>
            </div>
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => onApprove(app.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(app.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
      {applications.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">✅</div>
          <p>No pending applications</p>
        </div>
      )}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    creators: [],
    applications: [],
    trafficAnalytics: null,
    revenueData: [],
    conversionData: []
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const decoded = JSON.parse(atob(token.split('.')[1]));
    if (decoded.role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    fetchDashboardData();
  }, [selectedTimeframe, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        creatorsRes,
        applicationsRes,
        analyticsRes
      ] = await Promise.all([
        axios.get('/admin/stats'),
        axios.get('/admin/creators'),
        axios.get('/application/admin/pending'),
        axios.get(`/admin/analytics/comprehensive?timeFrame=${selectedTimeframe}`)
      ]);

      setDashboardData({
        stats: statsRes.data,
        creators: creatorsRes.data.creators || [],
        applications: applicationsRes.data.applications || [],
        trafficAnalytics: analyticsRes.data.traffic || null,
        revenueData: analyticsRes.data.revenue || [],
        conversionData: analyticsRes.data.conversions || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      await axios.post(`/application/admin/review/${applicationId}`, {
        action: 'approve'
      });
      toast.success('Application approved successfully!');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to approve application');
    }
  };

  const handleRejectApplication = async (applicationId) => {
    try {
      await axios.post(`/application/admin/review/${applicationId}`, {
        action: 'reject',
        rejectionReason: 'Application does not meet requirements'
      });
      toast.success('Application rejected');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to reject application');
    }
  };

  const handleViewCreatorDetails = (creator) => {
    // Navigate to detailed creator view or open modal
    navigate(`/admin/creator/${creator.id}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'creators', label: 'Creators', icon: '👥' },
    { id: 'applications', label: 'Applications', icon: '📋' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">Z</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Zylike Admin</h1>
                <p className="text-gray-400 text-sm">Platform Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/login');
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(dashboardData.stats?.totalRevenue)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-green-400 text-xl">💰</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-green-400 text-sm">
                    +{dashboardData.stats?.revenueGrowth || 0}% from last period
                  </span>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Creators</p>
                    <p className="text-2xl font-bold text-white">
                      {dashboardData.stats?.activeCreators || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-400 text-xl">👥</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-blue-400 text-sm">
                    {dashboardData.stats?.pendingApplications || 0} pending applications
                  </span>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Clicks</p>
                    <p className="text-2xl font-bold text-white">
                      {dashboardData.stats?.totalClicks?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-purple-400 text-xl">🔗</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-purple-400 text-sm">
                    {dashboardData.stats?.conversionRate || 0}% conversion rate
                  </span>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending Payouts</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(dashboardData.stats?.pendingPayouts)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-400 text-xl">⏳</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-yellow-400 text-sm">
                    Next payout: {dashboardData.stats?.nextPayoutDate || 'Not scheduled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
                <MetricChart
                  data={dashboardData.revenueData}
                  color="#10B981"
                  title="Daily Revenue"
                />
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Conversion Trend</h3>
                <MetricChart
                  data={dashboardData.conversionData}
                  color="#8B5CF6"
                  title="Daily Conversions"
                />
              </div>
            </div>

            {/* Traffic Analytics and Applications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TrafficSourceAnalytics trafficData={dashboardData.trafficAnalytics} />
              <ApplicationReview
                applications={dashboardData.applications.slice(0, 3)}
                onApprove={handleApproveApplication}
                onReject={handleRejectApplication}
              />
            </div>
          </div>
        )}

        {/* Creators Tab */}
        {activeTab === 'creators' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Creator Management</h2>
              <button
                onClick={() => navigate('/admin/creators/new')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add Creator
              </button>
            </div>
            <CreatorPerformanceTable
              creators={dashboardData.creators}
              onViewDetails={handleViewCreatorDetails}
            />
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Application Management</h2>
            <ApplicationReview
              applications={dashboardData.applications}
              onApprove={handleApproveApplication}
              onReject={handleRejectApplication}
            />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TrafficSourceAnalytics trafficData={dashboardData.trafficAnalytics} />
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg. Order Value</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(dashboardData.stats?.avgOrderValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer Lifetime Value</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(dashboardData.stats?.customerLTV)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Return Rate</span>
                    <span className="text-white font-semibold">
                      {dashboardData.stats?.returnRate || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Payment Management</h2>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <p className="text-gray-400">Payment management interface coming soon...</p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <p className="text-gray-400">Platform settings interface coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
