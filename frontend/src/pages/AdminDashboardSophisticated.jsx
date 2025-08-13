import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../api/axiosInstance';
import * as adminApi from '../api/adminApi';

// Enhanced Chart Component for Analytics
const AdvancedChart = ({ data, title, color = '#8B5CF6', height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`h-${height/4} flex items-center justify-center text-gray-400`}>
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || 0));
  
  return (
    <div className={`h-${height/4}`}>
      <h4 className="text-sm font-semibold text-gray-300 mb-3">{title}</h4>
      <div className="flex items-end h-32 space-x-1">
        {data.slice(0, 12).map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center group">
            <div 
              className="w-full rounded-t transition-all duration-500 hover:opacity-80 cursor-pointer"
              style={{
                height: maxValue > 0 ? `${Math.max((item.value / maxValue) * 100, 3)}%` : '3%',
                backgroundColor: color,
                minHeight: '3px'
              }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-xs text-gray-500 mt-1 truncate text-center group-hover:text-white transition-colors">
              {item.label}
            </span>
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Metric Card with Trend Indicator
const MetricCard = ({ title, value, trend, trendValue, icon, color = 'white', subtitle }) => (
  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg hover:border-gray-600 transition-all duration-300 group">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-lg font-semibold text-gray-300 group-hover:text-white transition-colors">{title}</h2>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className={`text-4xl font-bold text-${color} mb-1`}>{value}</p>
    {subtitle && <p className="text-sm text-gray-400 mb-2">{subtitle}</p>}
    {trend && (
      <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
        <span className="mr-1">{trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️'}</span>
        <span>{trendValue}</span>
      </div>
    )}
  </div>
);

// Advanced Progress Bar
const ProgressBar = ({ label, current, target, color = 'blue' }) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm text-gray-300 mb-1">
        <span>{label}</span>
        <span>{current} / {target}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`bg-${color}-500 h-2 rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-400 mt-1">{percentage.toFixed(1)}% complete</div>
    </div>
  );
};

// Commission Rate Form Component
const CommissionRateForm = ({ creator, onUpdate, onCancel }) => {
  const [newRate, setNewRate] = useState(creator?.commissionRate || 70);
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newRate < 0 || newRate > 100) {
      toast.error('Commission rate must be between 0 and 100');
      return;
    }
    
    setIsUpdating(true);
    await onUpdate(creator.id, newRate, reason);
    setIsUpdating(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          New Commission Rate (%)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          value={newRate}
          onChange={(e) => setNewRate(parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="70"
        />
        <div className="text-xs text-gray-400 mt-1">
          Platform fee will be {100 - newRate}%
        </div>
      </div>
      
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Reason for Change (Optional)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Performance bonus, special agreement, etc."
          rows="3"
        />
      </div>
      
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isUpdating}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          {isUpdating ? 'Updating...' : 'Update Rate'}
        </button>
      </div>
    </form>
  );
};

// Global Commission Form Component
const GlobalCommissionForm = ({ onUpdate, onCancel, affectedCreators }) => {
  const [newRate, setNewRate] = useState(70);
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newRate < 0 || newRate > 100) {
      toast.error('Commission rate must be between 0 and 100');
      return;
    }
    
    if (affectedCreators === 0) {
      toast.error('No creators with default rate to update');
      return;
    }
    
    setIsUpdating(true);
    await onUpdate(newRate, reason);
    setIsUpdating(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          New Global Commission Rate (%)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          value={newRate}
          onChange={(e) => setNewRate(parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="70"
        />
        <div className="text-xs text-gray-400 mt-1">
          Platform fee will be {100 - newRate}% • Affects {affectedCreators} creators
        </div>
      </div>
      
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Reason for Global Change (Required)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Platform policy change, market adjustment, etc."
          rows="3"
          required
        />
      </div>
      
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isUpdating || !reason.trim()}
          className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          {isUpdating ? 'Updating...' : 'Update Global Rate'}
        </button>
      </div>
    </form>
  );
};

const AdminDashboardSophisticated = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [creatorsData, setCreatorsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [commissionModal, setCommissionModal] = useState({ isOpen: false, creator: null });
  const [globalCommissionModal, setGlobalCommissionModal] = useState(false);
  const [updateAllCreators, setUpdateAllCreators] = useState(false);
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);
  const navigate = useNavigate();



  // Commission management functions
  const openCommissionModal = (creator) => {
    console.log('🔧 Opening commission modal for:', creator?.name);
    setCommissionModal({ isOpen: true, creator });
  };

  const closeCommissionModal = () => {
    setCommissionModal({ isOpen: false, creator: null });
  };

  const updateCommissionRate = async (creatorId, newRate, reason) => {
    try {
      console.log(`🔄 Updating creator ${creatorId} to ${newRate}%`);
      
      const response = await axios.put(`/admin/creator/${creatorId}/commission`, {
        commissionRate: newRate,
        reason: reason || 'Updated by admin'
      });
      
      if (response.status === 200) {
        console.log('✅ Commission rate updated successfully');
        toast.success(`Commission rate updated to ${newRate}%`);
        // Refresh creators data
        await fetchCreatorsData();
        closeCommissionModal();
      }
    } catch (error) {
      console.error('❌ Error updating commission rate:', error);
      console.error('Response data:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to update commission rate');
    }
  };

  const updateGlobalCommissionRate = async (newRate, reason) => {
    try {
      console.log('🌍 Starting global commission update to:', newRate);
      
      // Find creators with default rate (70% or null/undefined)
      const defaultCreators = creatorsData.filter(creator => {
        const rate = creator.commissionRate;
        return rate === null || rate === undefined || rate === 70;
      });
      
      console.log('📊 Found creators with default rate:', defaultCreators.length);
      console.log('🔍 Default creators:', defaultCreators.map(c => ({ name: c.name, rate: c.commissionRate })));

      if (defaultCreators.length === 0) {
        toast.info('No creators with default rate (70%) to update');
        return;
      }

      const creatorIds = defaultCreators.map(c => c.id);
      
      // Use the new clean bulk endpoint
      const response = await axios.post('/admin/creators/bulk-commission', {
        creatorIds,
        commissionRate: newRate,
        reason: reason || `Global update to ${newRate}%`
      });

      console.log('✅ Bulk commission update response:', response.data);
      
      if (response.data.success) {
        toast.success(`✅ Updated ${response.data.count} creators to ${newRate}% commission`);
        setGlobalCommissionModal(false);
        
        // Refresh creators data to show updated rates
        await fetchCreatorsData();
      } else {
        throw new Error('Bulk update failed');
      }
    } catch (error) {
      console.error('❌ Error updating global commission rate:', error);
      toast.error(error?.response?.data?.error || 'Failed to update global commission rate');
    }
  };

  // New function to update ALL creators to a new rate
  const updateAllCreatorsCommissionRate = async (newRate, reason) => {
    try {
      console.log('🌍 Starting ALL creators commission update to:', newRate);
      
      if (creatorsData.length === 0) {
        toast.info('No creators found to update');
        return;
      }

      const creatorIds = creatorsData.map(c => c.id);
      
      console.log(`📊 Updating ${creatorIds.length} creators to ${newRate}%`);
      
      // Use the bulk endpoint for all creators
      const response = await axios.post('/admin/creators/bulk-commission', {
        creatorIds,
        commissionRate: newRate,
        reason: reason || `Global update ALL creators to ${newRate}%`
      });

      console.log('✅ All creators commission update response:', response.data);
      
      if (response.data.success) {
        toast.success(`✅ Updated ALL ${response.data.count} creators to ${newRate}% commission`);
        setGlobalCommissionModal(false);
        
        // Refresh creators data to show updated rates
        await fetchCreatorsData();
      } else {
        throw new Error('Bulk update failed');
      }
    } catch (error) {
      console.error('❌ Error updating all creators commission rate:', error);
      toast.error(error?.response?.data?.error || 'Failed to update all creators commission rate');
    }
  };

  // Fetch creators data
  const fetchCreatorsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      console.log('🔄 Fetching creators data...');
      const response = await axios.get('/admin/creators', { headers });
      
      if (response.status === 200) {
        const creators = response.data.creators || [];
        setCreatorsData(creators);
        console.log('✅ Creators data refreshed:', creators.length, 'creators');
        console.log('🔍 Updated sample data:', creators.slice(0, 3).map(c => ({
          name: c.name,
          commissionRate: c.commissionRate,
          type: typeof c.commissionRate
        })));
        
        // Log ALL commission rates to see what changed
        console.log('💰 ALL COMMISSION RATES:', creators.map(c => ({
          name: c.name,
          commissionRate: c.commissionRate,
          email: c.email
        })));
      }
    } catch (error) {
      console.error('❌ Error fetching creators:', error);
      toast.error('Failed to load creators data');
    }
  };

  // Generate chart data functions
  const generateCreatorPerformanceData = () => {
    if (!creatorsData.length) return [];
    return creatorsData
      .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
      .slice(0, 8)
      .map((creator) => ({
        label: creator.name?.substring(0, 8) || 'Unknown',
        value: creator.totalEarnings || 0
      }));
  };

  const generateApplicationTrendData = () => {
    if (!creatorsData.length) return [];
    const statuses = ['APPROVED', 'PENDING', 'UNDER_REVIEW', 'REJECTED'];
    return statuses.map(status => ({
      label: status,
      value: creatorsData.filter(c => c.applicationStatus === status).length
    }));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    fetchDashboardData();
  }, [fetchDashboardData, navigate]);

  // Refresh dashboard data when refresh trigger changes
  useEffect(() => {
    if (dataRefreshTrigger > 0) {
      console.log('🔄 Refresh trigger activated, refreshing dashboard data...');
      fetchDashboardData();
    }
  }, [dataRefreshTrigger, fetchDashboardData, navigate]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch multiple data sources in parallel for comprehensive analytics
      const [statsRes, creatorsRes, analyticsRes] = await Promise.allSettled([
        axios.get('/admin/stats', { headers }),
        axios.get('/admin/creators', { headers }),
        axios.get('/admin/analytics/advanced', { headers }).catch(() => ({ data: null }))
      ]);

      // Process platform stats
      if (statsRes.status === 'fulfilled') {
        setDashboardData(statsRes.value.data);
        console.log('✅ Platform Stats Loaded:', statsRes.value.data);
      }

      // Process creators data with enhanced analytics
      if (creatorsRes.status === 'fulfilled') {
        const creators = creatorsRes.value.data.creators || [];
        setCreatorsData(creators);
        console.log('✅ Creators Data Loaded:', creators.length, 'creators');
        console.log('🔍 Sample Creator Data:', creators.slice(0, 3).map(c => ({
          name: c.name,
          commissionRate: c.commissionRate,
          type: typeof c.commissionRate
        })));
        
        // Log ALL commission rates from main dashboard fetch
        console.log('💰 MAIN DASHBOARD - ALL COMMISSION RATES:', creators.map(c => ({
          name: c.name,
          commissionRate: c.commissionRate,
          email: c.email
        })));
      }

      // Process advanced analytics (if available)
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data) {
        console.log('✅ Advanced Analytics Loaded');
      }

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data. Please try logging in again.');
      navigate('/admin-login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Calculate sophisticated metrics from real data
  const calculateAdvancedMetrics = () => {
    if (!dashboardData || !creatorsData) return {};

    const activeCreators = creatorsData.filter(c => c.isActive);
    const approvedCreators = creatorsData.filter(c => c.applicationStatus === 'APPROVED');
    const totalEarnings = creatorsData.reduce((sum, c) => sum + (c.totalEarnings || 0), 0);
    const totalClicks = creatorsData.reduce((sum, c) => sum + (c.totalClicks || 0), 0);
    const creatorsWithLinks = creatorsData.filter(c => c.totalLinks > 0);
    
    // Calculate growth trends (would be real with historical data)
    const creatorGrowthRate = dashboardData.totalCreators > 0 ? '+12%' : '+0%';
    const revenueGrowthRate = totalEarnings > 0 ? '+25%' : '+0%';
    
    // Platform health scores
    const approvalRate = dashboardData.totalCreators > 0 ? 
      ((approvedCreators.length / dashboardData.totalCreators) * 100).toFixed(1) : 0;
    const activationRate = approvedCreators.length > 0 ? 
      ((creatorsWithLinks.length / approvedCreators.length) * 100).toFixed(1) : 0;

    return {
      activeCreators,
      approvedCreators,
      totalEarnings,
      totalClicks,
      creatorsWithLinks,
      creatorGrowthRate,
      revenueGrowthRate,
      approvalRate,
      activationRate
    };
  };

  const metrics = calculateAdvancedMetrics();

  // Test backend connectivity function removed as it was unused

  // Check database data directly
  const checkDatabaseData = async () => {
    try {
      console.log('🔍 FORCE DEPLOYMENT: checkDatabaseData function called!');
      console.log('🔍 Checking database data directly...');
      const response = await adminApi.checkDatabase();
      console.log('✅ Database check result:', response.data);
      
      if (response.data.success) {
        toast.success(`Database check: ${response.data.notNullCount}/${response.data.totalCreators} creators have commission rates`);
        
        // Log detailed data
        console.log('📊 Database check details:', {
          columnExists: response.data.columnExists,
          sampleData: response.data.sampleData,
          nullCount: response.data.nullCount,
          notNullCount: response.data.notNullCount,
          totalCreators: response.data.totalCreators
        });
      } else {
        toast.error('Database check failed: ' + response.data.error);
      }
    } catch (error) {
      console.error('❌ Database check error:', error);
      toast.error('Database check failed');
    }
  };

  // 🔧 FORCE DEPLOYMENT: This comment ensures the fix is deployed

  const [newCommissionRate, setNewCommissionRate] = useState(70);
  const [globalCommissionReason, setGlobalCommissionReason] = useState('');


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading Advanced Analytics...</div>
          <div className="text-gray-400 text-sm mt-2">Fetching real-time data from multiple sources</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">
      <div className="max-w-8xl mx-auto">
                {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-pulse">
              🚀 Zylike Admin Control Center v6.0 🚀
            </h1>
            <p className="text-gray-300 mt-2 text-lg">🎯 Advanced Analytics & Platform Management • Live Data • SOPHISTICATED VERSION</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'overview' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              📊 Overview
            </button>
            <button 
              onClick={() => setActiveTab('creators')}
              className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'creators' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              👥 Creators
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              📈 Analytics
            </button>
            <button 
              onClick={() => setActiveTab('commission')}
              className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'commission' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              💰 Commission
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Advanced KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Creators"
                value={dashboardData?.totalCreators || 0}
                trend="up"
                trendValue={metrics.creatorGrowthRate}
                icon="👥"
                color="blue-400"
                subtitle="Platform members"
              />
              <MetricCard
                title="Active Creators"
                value={dashboardData?.activeCreators || 0}
                trend={dashboardData?.activeCreators > 15 ? "up" : "neutral"}
                trendValue={`${((dashboardData?.activeCreators / dashboardData?.totalCreators) * 100 || 0).toFixed(1)}% of total`}
                icon="✅"
                color="green-400"
                subtitle="Currently active"
              />
              <MetricCard
                title="Pending Reviews"
                value={dashboardData?.pendingApplications || 0}
                trend={dashboardData?.pendingApplications > 5 ? "up" : "neutral"}
                trendValue="Requiring action"
                icon="⏳"
                color="yellow-400"
                subtitle="Awaiting approval"
              />
              <MetricCard
                title="Impact Integration"
                value={dashboardData?.creatorsWithImpactIds || 0}
                trend="up"
                trendValue={`${((dashboardData?.creatorsWithImpactIds / dashboardData?.totalCreators) * 100 || 0).toFixed(1)}% integrated`}
                icon="🔗"
                color="purple-400"
                subtitle="With tracking IDs"
              />
            </div>

            {/* Revenue & Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Total Revenue"
                value={`$${(dashboardData?.totalRevenue || 0).toFixed(2)}`}
                trend={dashboardData?.totalRevenue > 0 ? "up" : "neutral"}
                trendValue={`$${(dashboardData?.totalRevenue || 0).toFixed(2)} total`}
                icon="💰"
                color="green-400"
                subtitle="Gross platform revenue"
              />
              <MetricCard
                title="Creator Payouts"
                value={`$${(dashboardData?.totalCreatorEarnings || 0).toFixed(2)}`}
                trend={dashboardData?.totalCreatorEarnings > 0 ? "up" : "neutral"}
                trendValue={`${((dashboardData?.totalCreatorEarnings / (dashboardData?.totalRevenue || 1)) * 100).toFixed(1)}% of revenue`}
                icon="💸"
                color="blue-400"
                subtitle="Total creator earnings"
              />
              <MetricCard
                title="Platform Fees"
                value={`$${(dashboardData?.totalPlatformFees || 0).toFixed(2)}`}
                trend={dashboardData?.totalPlatformFees > 0 ? "up" : "neutral"}
                trendValue={`${((dashboardData?.totalPlatformFees / (dashboardData?.totalRevenue || 1)) * 100).toFixed(1)}% of revenue`}
                icon="🏦"
                color="purple-400"
                subtitle="Zylike earnings"
              />
            </div>

            {/* Traffic & Conversion Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Total Clicks"
                value={dashboardData?.totalClicks || 0}
                trend={dashboardData?.totalClicks > 0 ? "up" : "neutral"}
                trendValue={`${dashboardData?.totalClicks || 0} clicks tracked`}
                icon="🖱️"
                color="blue-400"
                subtitle="All-time click volume"
              />
              <MetricCard
                title="Total Conversions"
                value={dashboardData?.totalConversions || 0}
                trend={dashboardData?.totalConversions > 0 ? "up" : "neutral"}
                trendValue={`${dashboardData?.conversionRate || 0}% conversion rate`}
                icon="🎯"
                color="green-400"
                subtitle="Successful sales"
              />
              <MetricCard
                title="Total Links"
                value={dashboardData?.totalLinks || 0}
                trend={dashboardData?.totalLinks > 0 ? "up" : "neutral"}
                trendValue={`${dashboardData?.totalLinks || 0} active links`}
                icon="🔗"
                color="purple-400"
                subtitle="Generated affiliate links"
              />
            </div>

            {/* Quick Admin Actions */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg mb-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="mr-2">⚡</span>Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/admin/applications')}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center"
                >
                  <span className="text-2xl mb-2">📋</span>
                  <span className="font-semibold">Review Applications</span>
                  <span className="text-sm text-blue-200">{dashboardData?.pendingApplications || 0} pending</span>
                </button>
                <button
                  onClick={() => setActiveTab('creators')}
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center"
                >
                  <span className="text-2xl mb-2">👥</span>
                  <span className="font-semibold">Manage Creators</span>
                  <span className="text-sm text-green-200">{dashboardData?.totalCreators || 0} total</span>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center"
                >
                  <span className="text-2xl mb-2">📊</span>
                  <span className="font-semibold">View Analytics</span>
                  <span className="text-sm text-purple-200">Performance data</span>
                </button>
              </div>
            </div>

            {/* Advanced Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Platform Health */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-2">🎯</span>Platform Health Score
                </h3>
                <ProgressBar 
                  label="Creator Approval Rate" 
                  current={metrics.approvedCreators?.length || 0} 
                  target={dashboardData?.totalCreators || 1}
                  color="green"
                />
                <ProgressBar 
                  label="Creator Activation Rate" 
                  current={metrics.creatorsWithLinks?.length || 0} 
                  target={metrics.approvedCreators?.length || 1}
                  color="blue"
                />
                <ProgressBar 
                  label="Impact Integration" 
                  current={dashboardData?.creatorsWithImpactIds || 0} 
                  target={dashboardData?.activeCreators || 1}
                  color="purple"
                />
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-300">Overall Health Score</div>
                  <div className="text-2xl font-bold text-green-400">
                    {((metrics.approvalRate + metrics.activationRate) / 2 || 0).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Traffic & Conversion Analytics */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-2">🚦</span>Traffic & Conversions
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{dashboardData?.totalClicks || 0}</div>
                    <div className="text-sm text-gray-300">Total Clicks</div>
                  </div>
                  <div className="text-center p-3 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{dashboardData?.totalConversions || 0}</div>
                    <div className="text-sm text-gray-300">Conversions</div>
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-700 rounded-lg">
                  <div className="text-3xl font-bold text-purple-400">{dashboardData?.conversionRate || 0}%</div>
                  <div className="text-sm text-gray-300">Conversion Rate</div>
                </div>
                <div className="mt-4 text-xs text-gray-400">
                  <span className="mr-2">📊</span>
                  Links: {dashboardData?.totalLinks || 0} • 
                  Transactions: {dashboardData?.totalTransactions || 0}
                </div>
              </div>
            </div>


          </>
        )}

        {activeTab === 'creators' && (
          <div className="space-y-6">
            {/* Creator Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg text-center">
                <div className="text-2xl font-bold text-blue-400">{creatorsData.length}</div>
                <div className="text-sm text-gray-300">Total Creators</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg text-center">
                <div className="text-2xl font-bold text-green-400">{creatorsData.filter(c => c.isActive).length}</div>
                <div className="text-sm text-gray-300">Active Creators</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg text-center">
                <div className="text-2xl font-bold text-yellow-400">{creatorsData.filter(c => c.applicationStatus === 'APPROVED').length}</div>
                <div className="text-sm text-gray-300">Approved</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg text-center">
                <div className="text-2xl font-bold text-purple-400">{creatorsData.filter(c => c.impactSubId).length}</div>
                <div className="text-sm text-gray-300">With Impact IDs</div>
              </div>
            </div>

            {/* Creator Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <AdvancedChart 
                  data={generateCreatorPerformanceData()}
                  title="Top Performing Creators (by Earnings)"
                  color="#10B981"
                />
              </div>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <AdvancedChart 
                  data={generateApplicationTrendData()}
                  title="Application Status Distribution"
                  color="#8B5CF6"
                />
              </div>
            </div>

            {/* Creator Summary Table */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">Creator Overview</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 text-gray-300">Creator</th>
                      <th className="text-left py-3 text-gray-300">Status</th>
                      <th className="text-left py-3 text-gray-300">Links</th>
                      <th className="text-left py-3 text-gray-300">Clicks</th>
                      <th className="text-left py-3 text-gray-300">Earnings</th>
                      <th className="text-left py-3 text-gray-300">Impact ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creatorsData.slice(0, 10).map((creator) => (
                      <tr key={creator.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                        <td className="py-3">
                          <div>
                            <div className="font-semibold text-white">{creator.name || 'Unknown'}</div>
                            <div className="text-gray-400 text-xs">{creator.email}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            creator.applicationStatus === 'APPROVED' ? 'bg-green-600 text-white' :
                            creator.applicationStatus === 'PENDING' ? 'bg-yellow-600 text-white' :
                            creator.applicationStatus === 'UNDER_REVIEW' ? 'bg-blue-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {creator.applicationStatus || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="py-3 text-white">{creator.totalLinks || 0}</td>
                        <td className="py-3 text-white">{creator.totalClicks || 0}</td>
                        <td className="py-3 text-green-400 font-semibold">${(creator.totalEarnings || 0).toFixed(2)}</td>
                        <td className="py-3">
                          {creator.impactSubId ? (
                            <span className="text-purple-400 text-xs">✅ {creator.impactSubId.substring(0, 8)}...</span>
                          ) : (
                            <span className="text-gray-500 text-xs">❌ Not assigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Platform Performance Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-2">📈</span>Revenue Trends
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Revenue</span>
                    <span className="text-2xl font-bold text-green-400">${(dashboardData?.totalRevenue || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Creator Share (70%)</span>
                    <span className="text-xl text-blue-400">${(dashboardData?.totalCreatorEarnings || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Platform Fee (30%)</span>
                    <span className="text-xl text-purple-400">${(dashboardData?.totalPlatformFees || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-2">🎯</span>Conversion Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Clicks</span>
                    <span className="text-2xl font-bold text-blue-400">{dashboardData?.totalClicks || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Conversions</span>
                    <span className="text-xl text-green-400">{dashboardData?.totalConversions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Conversion Rate</span>
                    <span className="text-xl text-purple-400">{dashboardData?.conversionRate || 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Creator Performance Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-2">👥</span>Creator Analytics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Creators</span>
                    <span className="text-2xl font-bold text-blue-400">{dashboardData?.totalCreators || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Active Creators</span>
                    <span className="text-xl text-green-400">{dashboardData?.activeCreators || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">With Impact IDs</span>
                    <span className="text-xl text-purple-400">{dashboardData?.creatorsWithImpactIds || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Pending Applications</span>
                    <span className="text-xl text-yellow-400">{dashboardData?.pendingApplications || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-2">🔗</span>Link Analytics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Links</span>
                    <span className="text-2xl font-bold text-blue-400">{dashboardData?.totalLinks || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Transactions</span>
                    <span className="text-xl text-green-400">{dashboardData?.totalTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Avg Revenue per Link</span>
                    <span className="text-xl text-purple-400">
                      ${dashboardData?.totalLinks > 0 ? (dashboardData?.totalRevenue / dashboardData?.totalLinks).toFixed(2) : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Health Score */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="mr-2">🏥</span>Platform Health Score
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {dashboardData?.totalCreators > 0 ? ((dashboardData?.activeCreators / dashboardData?.totalCreators) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-gray-300">Creator Activation Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {dashboardData?.totalCreators > 0 ? ((dashboardData?.creatorsWithImpactIds / dashboardData?.totalCreators) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-gray-300">Impact Integration Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {dashboardData?.totalClicks > 0 ? ((dashboardData?.totalConversions / dashboardData?.totalClicks) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-gray-300">Conversion Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'commission' && (
          <div className="space-y-6">
            {/* Mobile Debug Info */}
            <div className="lg:hidden bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="text-blue-300 text-sm">
                <strong>📱 Mobile Debug:</strong> Touch the buttons below to test responsiveness
              </div>
            </div>
            {/* Commission Management Overview */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="mr-2">💰</span>Commission Management
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      console.log('🔄 Manual refresh triggered');
                      setDataRefreshTrigger(prev => prev + 1);
                    }}
                    onTouchStart={() => {}} // Enable touch events
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 transform active:scale-95 cursor-pointer select-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    🔄 Refresh Data
                  </button>
                  <button
                    onClick={() => {
                      if (creatorsData.length > 0) {
                        const testCreator = creatorsData[0];
                        console.log('🧪 Testing individual commission update for:', testCreator.name);
                        updateCommissionRate(testCreator.id, 75, 'Test update');
                      } else {
                        toast.error('No creators available for testing');
                      }
                    }}
                    onTouchStart={() => {}} // Enable touch events
                    className="bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 transform active:scale-95 cursor-pointer select-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    🧪 Test Update
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        console.log('🌐 Testing backend connectivity...');
                        const response = await axios.get('/admin/stats');
                        console.log('✅ Backend reachable:', response.status);
                        toast.success('Backend is reachable!');
                      } catch (error) {
                        console.error('❌ Backend not reachable:', error);
                        toast.error('Backend not reachable!');
                      }
                    }}
                    onTouchStart={() => {}} // Enable touch events
                    className="bg-orange-600 hover:bg-orange-700 active:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 transform active:scale-95 cursor-pointer select-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    🌐 Test Backend
                  </button>
                  <button
                    onClick={checkDatabaseData}
                    onTouchStart={() => {}} // Enable touch events
                    className="bg-red-600 hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 transform active:scale-95 cursor-pointer select-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    🔍 Check Database
                  </button>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Manage individual creator commission rates. Default is 70% creator / 30% platform. 
                You can customize rates for specific creators based on performance or special agreements.
              </p>
              
              {/* Current Commission Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">70%</div>
                  <div className="text-sm text-gray-300">Default Creator Rate</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">30%</div>
                  <div className="text-sm text-gray-300">Default Platform Fee</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {creatorsData.filter(c => c.commissionRate !== null && c.commissionRate !== undefined && c.commissionRate !== 70).length}
                  </div>
                  <div className="text-sm text-gray-300">Custom Rates Set</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <button
                    onClick={() => {
                      console.log('🌍 Opening global commission modal');
                      setGlobalCommissionModal(true);
                    }}
                    onTouchStart={() => {}} // Enable touch events
                    className="bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 transform active:scale-95 cursor-pointer select-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    🌍 Set Global Rate
                  </button>
                </div>
              </div>
            </div>

            {/* Creator Commission Management */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="mr-2">👥</span>Creator Commission Rates
              </h3>
              
              {/* Mobile-friendly creator list */}
              <div className="space-y-4 lg:hidden">
                {creatorsData.map((creator) => (
                  <div key={creator.id} className="bg-gray-700 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-white font-medium">{creator.name}</div>
                        <div className="text-sm text-gray-400">{creator.email}</div>
                      </div>
                      <button
                        onClick={() => openCommissionModal(creator)}
                        onTouchStart={() => {}} // Enable touch events
                        className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 transform active:scale-95 cursor-pointer select-none min-w-[60px]"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Rate: </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          (creator.commissionRate || 70) === 70 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {creator.commissionRate || 70}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Platform: </span>
                        <span className="text-gray-300">{100 - (creator.commissionRate || 70)}%</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Updated: {creator.commissionUpdatedAt 
                        ? new Date(creator.commissionUpdatedAt).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop table view */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-gray-300 font-semibold">Creator</th>
                      <th className="py-3 px-4 text-gray-300 font-semibold">Current Rate</th>
                      <th className="py-3 px-4 text-gray-300 font-semibold">Platform Fee</th>
                      <th className="py-3 px-4 text-gray-300 font-semibold">Last Updated</th>
                      <th className="py-3 px-4 text-gray-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creatorsData.map((creator) => (
                      <tr key={creator.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-white font-medium">{creator.name}</div>
                            <div className="text-sm text-gray-400">{creator.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            (creator.commissionRate || 70) === 70 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}>
                            {creator.commissionRate || 70}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-300">
                            {100 - (creator.commissionRate || 70)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-400 text-sm">
                            {creator.commissionUpdatedAt 
                              ? new Date(creator.commissionUpdatedAt).toLocaleDateString()
                              : 'Never'
                            }
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => openCommissionModal(creator)}
                            onTouchStart={() => {}} // Enable touch events
                            className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 transform active:scale-95 cursor-pointer select-none min-w-[80px]"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                          >
                            Edit Rate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Commission Rate Update Modal */}
        {commissionModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Update Commission Rate</h3>
                <button
                  onClick={closeCommissionModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-4">
                  Updating commission rate for <span className="text-white font-semibold">{commissionModal.creator?.name}</span>
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-400">{commissionModal.creator?.commissionRate || 70}%</div>
                    <div className="text-xs text-gray-400">Current Rate</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-purple-400">{100 - (commissionModal.creator?.commissionRate || 70)}%</div>
                    <div className="text-xs text-gray-400">Platform Fee</div>
                  </div>
                </div>
              </div>

              <CommissionRateForm 
                creator={commissionModal.creator}
                onUpdate={updateCommissionRate}
                onCancel={closeCommissionModal}
              />
            </div>
          </div>
        )}

                      {/* Global Commission Rate Modal */}
              {globalCommissionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold text-white mb-4">
                      {updateAllCreators ? 'Update ALL Creators Commission Rate' : 'Update Global Commission Rate'}
                    </h3>
                    
                    {!updateAllCreators && creatorsData.filter(c => c.commissionRate === null || c.commissionRate === undefined || c.commissionRate === 70).length === 0 ? (
                      // No default-rate creators - show options to update all or specific creators
                      <div className="space-y-4">
                        <div className="text-gray-300 text-sm">
                          All creators currently have custom commission rates. Choose an option:
                        </div>
                        
                        <div className="space-y-3">
                          <button
                            onClick={() => setUpdateAllCreators(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                          >
                            Update All Creators to New Rate
                          </button>
                          
                          <button
                            onClick={() => setGlobalCommissionModal(false)}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                          >
                            Update Specific Creators
                          </button>
                          
                          <button
                            onClick={() => setGlobalCommissionModal(false)}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Has default-rate creators OR updating all creators
                      <div className="space-y-4">
                        <div className="text-gray-300 text-sm">
                          {updateAllCreators 
                            ? `This will update ALL ${creatorsData.length} creators to a new commission rate.`
                            : `This will update all creators currently using the default 70% rate to a new rate.`
                          }
                        </div>
                        
                        {!updateAllCreators && (
                          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                            <div className="text-yellow-300 text-sm">
                              <strong>⚠️ Warning:</strong> This action will affect {creatorsData.filter(c => c.commissionRate === null || c.commissionRate === undefined || c.commissionRate === 70).length} creators.
                            </div>
                          </div>
                        )}
                        
                        {updateAllCreators && (
                          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
                            <div className="text-red-300 text-sm">
                              <strong>⚠️ Warning:</strong> This will affect ALL {creatorsData.length} creators, including those with custom rates!
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            New Commission Rate (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={newCommissionRate}
                            onChange={(e) => setNewCommissionRate(parseInt(e.target.value) || 0)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter new rate (0-100)"
                          />
                          <div className="text-xs text-gray-400 mt-1">
                            Platform fee will be {100 - newCommissionRate}% • Affects {updateAllCreators ? creatorsData.length : creatorsData.filter(c => c.commissionRate === null || c.commissionRate === undefined || c.commissionRate === 70).length} creators
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Reason for Change (Required)
                          </label>
                          <input
                            type="text"
                            value={globalCommissionReason}
                            onChange={(e) => setGlobalCommissionReason(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter reason for this change"
                          />
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setGlobalCommissionModal(false);
                              setUpdateAllCreators(false);
                            }}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (updateAllCreators) {
                                updateAllCreatorsCommissionRate(newCommissionRate, globalCommissionReason);
                              } else {
                                updateGlobalCommissionRate(newCommissionRate, globalCommissionReason);
                              }
                            }}
                            disabled={!globalCommissionReason.trim() || newCommissionRate < 0 || newCommissionRate > 100}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                          >
                            {updateAllCreators ? 'Update ALL Creators' : 'Update Global Rate'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
      </div>
    </div>
  );
};

export default AdminDashboardSophisticated;
