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
            <th className="text-left py-3 px-6 text-gray-300 font-medium">Impact SubID (Admin Only)</th>
            <th className="text-left py-3 px-6 text-gray-300 font-medium">Traffic Sources</th>
            <th className="text-left py-3 px-6 text-gray-300 font-medium">Earnings (70%)</th>
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
                <div className="text-center">
                  {creator.impactSubId ? (
                    <div>
                      <div className="text-blue-400 font-mono text-sm font-medium" title="Impact.com Sub-Affiliate ID">
                        {creator.impactSubId}
                      </div>
                      <div className="text-green-400 text-xs">✅ Active</div>
                      <div className="text-gray-500 text-xs">Auto-assigned on approval</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-gray-400 text-sm">Not assigned</div>
                      <div className="text-red-400 text-xs">❌ No ID</div>
                      <div className="text-yellow-400 text-xs">Will be auto-assigned on approval</div>
                    </div>
                  )}
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
                <div className="text-yellow-400 text-xs">
                  70% of {creator.totalCommission ? `$${creator.totalCommission.toFixed(2)}` : '$0.00'} gross
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
      <p className="text-gray-400 text-sm mt-2">
        💡 <strong>Note:</strong> Approving an application will automatically generate and assign a unique Impact.com Sub-Affiliate ID
      </p>
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
                  title="Approval will automatically assign Impact SubID"
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
  
  // Enhanced state for comprehensive admin functionality
  const [pendingApplications, setPendingApplications] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [editingCreator, setEditingCreator] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  
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
    fetchPendingApplications();
    fetchAllApplications();
  }, [selectedTimeframe, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        applicationsRes,
        analyticsRes
      ] = await Promise.all([
        axios.get('/admin/stats'),
        axios.get('/admin/applications/pending'),
        axios.get(`/admin/analytics/advanced?timeFrame=${selectedTimeframe}`)
      ]);

      // Get creators with analytics (includes impact subid)
      const creatorsWithAnalyticsRes = await axios.get('/admin/creators');
      
      setDashboardData({
        stats: statsRes.data,
        creators: creatorsWithAnalyticsRes.data.creators || [],
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

  // ✅ COMPREHENSIVE ADMIN FUNCTIONS - Migrated from legacy dashboard

  // Fetch Pending Applications
  const fetchPendingApplications = async () => {
    try {
      const response = await axios.get('/admin/applications/pending');
      setPendingApplications(response.data.applications || response.data || []);
    } catch (error) {
      console.error('Failed to fetch pending applications:', error);
      setPendingApplications([]);
    }
  };

  // Fetch All Applications
  const fetchAllApplications = async () => {
    try {
      const response = await axios.get('/admin/applications/all');
      setAllApplications(response.data.applications || response.data || []);
    } catch (error) {
      console.error('Failed to fetch all applications:', error);
      setAllApplications([]);
    }
  };

  // Creator Status Toggle
  const handleCreatorStatusToggle = async (creatorId, currentStatus) => {
    const newStatus = !currentStatus;
    const reason = prompt(`Reason for ${newStatus ? 'activating' : 'deactivating'} this creator:`);
    
    if (reason === null) return;
    
    try {
      await axios.put(`/admin/creator/${creatorId}/status`, {
        isActive: newStatus,
        reason: reason
      });
      
      // Update local state
      setDashboardData(prev => ({
        ...prev,
        creators: prev.creators.map(creator => 
          creator.id === creatorId 
            ? { ...creator, isActive: newStatus }
            : creator
        )
      }));
      
      toast.success(`Creator ${newStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Status toggle error:', error);
      toast.error('Failed to update creator status');
    }
  };

  // Application Review Handler
  const handleReviewApplication = async (creatorId, action, reason = '', notes = '', impactId = '', impactSubId = '') => {
    try {
      const response = await axios.post(`/admin/applications/${creatorId}/review`, {
        action,
        rejectionReason: reason,
        reviewNotes: notes,
        impactId,
        impactSubId
      });
      
      if (response.data.success) {
        toast.success(`Application ${action}d successfully!`);
        fetchPendingApplications();
        fetchAllApplications();
        fetchDashboardData(); // Refresh main data
      }
    } catch (error) {
      console.error('Review application error:', error);
      toast.error(`Failed to ${action} application`);
    }
  };

  // Bulk Actions
  const handleBulkApprove = async () => {
    if (selectedCreators.length === 0) {
      toast.error('Please select creators to approve');
      return;
    }
    
    const confirmed = confirm(`Approve ${selectedCreators.length} creators?`);
    if (!confirmed) return;

    try {
      for (const creatorId of selectedCreators) {
        await axios.post(`/admin/applications/${creatorId}/review`, {
          action: 'approve',
          impactId: `auto_${Math.random().toString(36).substr(2, 8)}`,
          impactSubId: `${creatorId.substr(0, 8)}_${Math.random().toString(36).substr(2, 8)}`
        });
      }
      
      toast.success(`${selectedCreators.length} creators approved successfully!`);
      setSelectedCreators([]);
      fetchPendingApplications();
      fetchAllApplications();
      fetchDashboardData();
    } catch (error) {
      console.error('Bulk approve error:', error);
      toast.error('Failed to approve some creators');
    }
  };

  const handleBulkReject = async () => {
    if (selectedCreators.length === 0) {
      toast.error('Please select creators to reject');
      return;
    }
    
    const reason = prompt(`Rejection reason for ${selectedCreators.length} creators:`);
    if (!reason) return;

    try {
      for (const creatorId of selectedCreators) {
        await axios.post(`/admin/applications/${creatorId}/review`, {
          action: 'reject',
          rejectionReason: reason
        });
      }
      
      toast.success(`${selectedCreators.length} creators rejected`);
      setSelectedCreators([]);
      fetchPendingApplications();
      fetchAllApplications();
      fetchDashboardData();
    } catch (error) {
      console.error('Bulk reject error:', error);
      toast.error('Failed to reject some creators');
    }
  };

  // Bulk Actions Handler
  const handleBulkAction = async (action) => {
    if (selectedCreators.length === 0) {
      toast.error('Please select creators first');
      return;
    }

    const confirmed = confirm(`Are you sure you want to ${action} ${selectedCreators.length} creators?`);
    if (!confirmed) return;

    try {
      if (action === 'activate' || action === 'deactivate') {
        const isActive = action === 'activate';
        const reason = prompt(`Reason for ${action}ing selected creators:`);
        if (reason === null) return;

        for (const creatorId of selectedCreators) {
          await axios.put(`/admin/creator/${creatorId}/status`, {
            isActive,
            reason
          });
        }
        
        // Update local state
        setDashboardData(prev => ({
          ...prev,
          creators: prev.creators.map(creator => 
            selectedCreators.includes(creator.id) 
              ? { ...creator, isActive }
              : creator
          )
        }));
        
      } else if (action === 'setCommission') {
        const commissionRate = prompt('Enter commission rate (0-100):');
        const reason = prompt('Reason for commission change:');
        
        if (!commissionRate || !reason) return;
        
        const rate = parseInt(commissionRate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
          toast.error('Please enter a valid commission rate between 0 and 100');
          return;
        }

        for (const creatorId of selectedCreators) {
          await axios.put(`/admin/creator/${creatorId}/commission`, {
            commissionRate: rate,
            reason
          });
        }
        
        // Update local state
        setDashboardData(prev => ({
          ...prev,
          creators: prev.creators.map(creator => 
            selectedCreators.includes(creator.id) 
              ? { ...creator, commissionRate: rate }
              : creator
          )
        }));
        
      } else if (action === 'removeImpactIds') {
        for (const creatorId of selectedCreators) {
          await axios.delete(`/admin/creator/${creatorId}/impact-ids`);
        }
        
        // Update local state
        setDashboardData(prev => ({
          ...prev,
          creators: prev.creators.map(creator => 
            selectedCreators.includes(creator.id) 
              ? { ...creator, impactId: null, impactSubId: null }
              : creator
          )
        }));
        
      } else if (action === 'delete') {
        for (const creatorId of selectedCreators) {
          await axios.delete(`/admin/creator/${creatorId}`);
        }
        
        // Remove from local state
        setDashboardData(prev => ({
          ...prev,
          creators: prev.creators.filter(creator => !selectedCreators.includes(creator.id))
        }));
      }
      
      toast.success(`${selectedCreators.length} creators ${action}d successfully!`);
      setSelectedCreators([]);
      
    } catch (error) {
      console.error(`Bulk ${action} error:`, error);
      toast.error(`Failed to ${action} some creators`);
    }
  };

  // Impact ID Management
  const handleUpdateImpactIds = async (creatorId) => {
    const impactId = prompt('Enter Impact ID:');
    const impactSubId = prompt('Enter Impact Sub ID:');
    
    if (!impactId || !impactSubId) return;

    try {
      await axios.put(`/admin/creator/${creatorId}/impact-ids`, {
        impactId,
        impactSubId
      });
      
      // Update local state
      setDashboardData(prev => ({
        ...prev,
        creators: prev.creators.map(creator => 
          creator.id === creatorId 
            ? { ...creator, impactId, impactSubId }
            : creator
        )
      }));
      
      toast.success('Impact IDs updated successfully!');
    } catch (error) {
      console.error('Update Impact IDs error:', error);
      toast.error('Failed to update Impact IDs');
    }
  };

  const handleRemoveImpactIds = async (creatorId) => {
    const confirmed = confirm('Are you sure you want to remove Impact IDs?');
    if (!confirmed) return;

    try {
      await axios.delete(`/admin/creator/${creatorId}/impact-ids`);
      
      // Update local state
      setDashboardData(prev => ({
        ...prev,
        creators: prev.creators.map(creator => 
          creator.id === creatorId 
            ? { ...creator, impactId: null, impactSubId: null }
            : creator
        )
      }));
      
      toast.success('Impact IDs removed successfully!');
    } catch (error) {
      console.error('Remove Impact IDs error:', error);
      toast.error('Failed to remove Impact IDs');
    }
  };

  const handleAutoGenerateImpactId = async (creatorId, creatorName) => {
    try {
      // Generate IDs based on creator info
      const impactId = `auto_${Math.random().toString(36).substr(2, 8)}`;
      const impactSubId = `${creatorName.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substr(2, 8)}`;
      
      await axios.put(`/admin/creator/${creatorId}/impact-ids`, {
        impactId,
        impactSubId
      });
      
      // Update local state
      setDashboardData(prev => ({
        ...prev,
        creators: prev.creators.map(creator => 
          creator.id === creatorId 
            ? { ...creator, impactId, impactSubId }
            : creator
        )
      }));
      
      toast.success(`Impact IDs generated!\nID: ${impactId}\nSub ID: ${impactSubId}`);
    } catch (error) {
      console.error('Auto-generate Impact ID error:', error);
      toast.error('Failed to auto-generate Impact IDs');
    }
  };

  const handleAssignImpactId = async (creatorId, creatorName) => {
    const impactId = prompt(`Assign Impact ID for ${creatorName}:`);
    const impactSubId = prompt(`Assign Impact Sub ID for ${creatorName}:`);
    
    if (!impactId || !impactSubId) {
      toast.error('Both Impact ID and Sub ID are required');
      return;
    }

    try {
      await axios.put(`/admin/creator/${creatorId}/impact-ids`, {
        impactId,
        impactSubId
      });
      
      // Update local state
      setDashboardData(prev => ({
        ...prev,
        creators: prev.creators.map(creator => 
          creator.id === creatorId 
            ? { ...creator, impactId, impactSubId }
            : creator
        )
      }));
      
      toast.success(`Impact IDs assigned successfully!\nID: ${impactId}\nSub ID: ${impactSubId}`);
    } catch (error) {
      console.error('Assign Impact ID error:', error);
      toast.error('Failed to assign Impact IDs');
    }
  };

  const handleCommissionRateChange = async (creatorId, currentRate) => {
    const newRate = prompt(`Enter new commission rate (current: ${currentRate}%):`, currentRate);
    const reason = prompt('Reason for commission change:');
    
    if (!newRate || !reason) return;
    
    const rate = parseInt(newRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Please enter a valid commission rate between 0 and 100');
      return;
    }

    try {
      await axios.put(`/admin/creator/${creatorId}/commission`, {
        commissionRate: rate,
        reason
      });
      
      // Update local state
      setDashboardData(prev => ({
        ...prev,
        creators: prev.creators.map(creator => 
          creator.id === creatorId 
            ? { ...creator, commissionRate: rate }
            : creator
        )
      }));
      
      toast.success(`Commission rate updated to ${rate}%`);
    } catch (error) {
      console.error('Commission rate change error:', error);
      toast.error('Failed to update commission rate');
    }
  };

  const handleEditCreator = (creator) => {
    setEditingCreator({ ...creator });
    setShowEditModal(true);
  };

  const handleSaveCreatorEdit = async () => {
    try {
      const response = await axios.put(`/admin/creator/${editingCreator.id}/details`, editingCreator);
      
      if (response.data.success) {
        toast.success('Creator details updated successfully!');
        setShowEditModal(false);
        setEditingCreator(null);
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Update creator error:', error);
      toast.error('Failed to update creator details');
    }
  };

  // Filter Functions
  const filteredApplications = allApplications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.applicationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCreators = dashboardData.creators.filter(creator => {
    const matchesSearch = searchQuery === '' || 
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // 🚀 UNIFIED ADMIN DASHBOARD - Force Deploy v2.0
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'creators', label: 'Creator Management', icon: '👥' },
    { id: 'applications', label: 'Application Review', icon: '📋' },
    { id: 'pending-apps', label: 'Pending Apps', icon: '⏳' },
    { id: 'impact-ids', label: 'Impact ID Manager', icon: '🎯' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'bulk-actions', label: 'Bulk Actions', icon: '⚡' },
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
                  <br />
                  <span className="text-green-400 text-sm">
                    {dashboardData.creators.filter(c => c.impactSubId).length} with Impact SubIDs
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
                    <p className="text-gray-400 text-sm">Impact SubIDs</p>
                    <p className="text-2xl font-bold text-white">
                      {dashboardData.creators.filter(c => c.impactSubId).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-purple-400 text-xl">🆔</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-purple-400 text-sm">
                    {dashboardData.creators.length - dashboardData.creators.filter(c => c.impactSubId).length} pending assignment
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

        {/* Creators Tab - Enhanced Management */}
        {activeTab === 'creators' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">💪 Creator Management ({filteredCreators.length} of {dashboardData.creators.length})</h2>
              
              {/* Bulk Actions for selected creators */}
              {selectedCreators.length > 0 && (
                <div className="flex space-x-2">
                  <span className="text-blue-400 px-3 py-1 bg-blue-500/20 rounded">{selectedCreators.length} selected</span>
                  <button
                    onClick={() => handleBulkAction('activate')}
                    className="bg-green-600 px-3 py-1 text-sm rounded hover:bg-green-700"
                  >
                    ✅ Bulk Activate
                  </button>
                  <button
                    onClick={() => handleBulkAction('deactivate')}
                    className="bg-yellow-600 px-3 py-1 text-sm rounded hover:bg-yellow-700"
                  >
                    ⏸️ Bulk Deactivate
                  </button>
                  <button
                    onClick={() => handleBulkAction('setCommission')}
                    className="bg-purple-600 px-3 py-1 text-sm rounded hover:bg-purple-700"
                  >
                    💰 Set Commission
                  </button>
                </div>
              )}
            </div>

            {/* Search & Filter Controls */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="🔍 Search creators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="email">Sort by Email</option>
                    <option value="createdAt">Sort by Created Date</option>
                    <option value="commissionRate">Sort by Commission</option>
                  </select>
                </div>
                <div>
                  <button
                    onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
                    className="w-full bg-blue-600 px-4 py-3 rounded hover:bg-blue-700 text-white"
                  >
                    {order === 'asc' ? '↑ Ascending' : '↓ Descending'}
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Creator Cards */}
            <div className="space-y-4">
              {filteredCreators.map((creator) => (
                <div key={creator.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedCreators.includes(creator.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCreators([...selectedCreators, creator.id]);
                          } else {
                            setSelectedCreators(selectedCreators.filter(id => id !== creator.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {creator.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-white">{creator.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded ${
                            creator.isActive !== false ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {creator.isActive !== false ? '✅ Active' : '❌ Inactive'}
                          </span>
                          <span className="px-2 py-1 text-xs bg-purple-600 text-white rounded">
                            💰 {creator.commissionRate || 70}%
                          </span>
                        </div>
                        <p className="text-gray-400">{creator.email}</p>
                        <div className="flex space-x-4 text-xs text-gray-500 mt-1">
                          <span>Role: {creator.role}</span>
                          <span>Impact ID: {creator.impactId || 'None'}</span>
                          <span>Sub ID: {creator.impactSubId || 'None'}</span>
                          <span>Status: {creator.applicationStatus || 'N/A'}</span>
                          <span>Joined: {new Date(creator.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleCreatorStatusToggle(creator.id, creator.isActive !== false)}
                        className={`px-3 py-1 text-sm rounded ${
                          creator.isActive !== false 
                            ? 'bg-yellow-600 hover:bg-yellow-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {creator.isActive !== false ? '⏸️ Deactivate' : '▶️ Activate'}
                      </button>
                      
                      <button
                        onClick={() => handleCommissionRateChange(creator.id, creator.commissionRate || 70)}
                        className="bg-purple-600 px-3 py-1 text-sm rounded hover:bg-purple-700"
                      >
                        💰 Commission
                      </button>
                      
                      {!creator.impactSubId ? (
                        <>
                          <button
                            onClick={() => handleAutoGenerateImpactId(creator.id, creator.name)}
                            className="bg-green-600 px-3 py-1 text-sm rounded hover:bg-green-700"
                          >
                            🎲 Auto ID
                          </button>
                          <button
                            onClick={() => handleAssignImpactId(creator.id, creator.name)}
                            className="bg-blue-600 px-3 py-1 text-sm rounded hover:bg-blue-700"
                          >
                            🔗 Assign
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleUpdateImpactIds(creator.id)}
                            className="bg-blue-600 px-3 py-1 text-sm rounded hover:bg-blue-700"
                          >
                            ✏️ Edit IDs
                          </button>
                          <button
                            onClick={() => handleRemoveImpactIds(creator.id)}
                            className="bg-orange-600 px-3 py-1 text-sm rounded hover:bg-orange-700"
                          >
                            🗑️ Remove IDs
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedCreator({
                            ...creator,
                            bio: creator.bio || 'No bio provided'
                          });
                          setShowCreatorModal(true);
                        }}
                        className="bg-blue-600 px-3 py-1 text-sm rounded hover:bg-blue-700"
                      >
                        👁️ View
                      </button>
                      
                      <button
                        onClick={() => handleEditCreator(creator)}
                        className="bg-yellow-600 px-3 py-1 text-sm rounded hover:bg-yellow-700"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredCreators.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">👥</div>
                  <p>No creators found</p>
                </div>
              )}
            </div>
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

        {/* Pending Applications Tab */}
        {activeTab === 'pending-apps' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">⏳ Pending Applications ({pendingApplications.length})</h2>
              <button
                onClick={fetchPendingApplications}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
            
            <div className="space-y-4">
              {pendingApplications.map((application) => (
                <div key={application.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{application.name}</h3>
                        <span className="px-2 py-1 text-xs bg-yellow-600 text-white rounded">
                          Step {application.onboardingStep}/7
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{application.email}</p>
                      {application.bio && (
                        <p className="text-sm text-gray-300 mb-3">{application.bio}</p>
                      )}
                      
                      {/* Social Platforms */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        {application.socialInstagram && (
                          <span className="text-xs bg-pink-600 text-white px-2 py-1 rounded">📸 {application.socialInstagram}</span>
                        )}
                        {application.socialTiktok && (
                          <span className="text-xs bg-black text-white px-2 py-1 rounded">🎵 {application.socialTiktok}</span>
                        )}
                        {application.socialTwitter && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">🐦 {application.socialTwitter}</span>
                        )}
                        {application.socialYoutube && (
                          <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">📺 {application.socialYoutube}</span>
                        )}
                        {application.socialFacebook && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">📘 {application.socialFacebook}</span>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Applied: {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'No date'}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => {
                          const notes = prompt('Review notes (optional):');
                          const impactId = prompt('Impact ID (auto-generated if empty):') || `auto_${Math.random().toString(36).substr(2, 8)}`;
                          const impactSubId = prompt('Impact Sub ID (auto-generated if empty):') || `${application.id.substr(0, 8)}_${Math.random().toString(36).substr(2, 8)}`;
                          handleReviewApplication(application.id, 'approve', '', notes, impactId, impactSubId);
                        }}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-medium"
                      >
                        ✅ Approve
                      </button>
                      
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason:');
                          if (reason) {
                            handleReviewApplication(application.id, 'reject', reason);
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-medium"
                      >
                        ❌ Reject
                      </button>
                      
                      <button
                        onClick={() => {
                          const notes = prompt('What changes are needed?');
                          if (notes) {
                            handleReviewApplication(application.id, 'request_changes', '', notes);
                          }
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-sm font-medium"
                      >
                        🔄 Request Changes
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {pendingApplications.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">✅</div>
                  <p>No pending applications</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Impact ID Manager Tab */}
        {activeTab === 'impact-ids' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🎯 Impact ID Manager</h2>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Impact ID Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {dashboardData.creators.filter(c => c.impactId && c.impactSubId).length}
                  </div>
                  <div className="text-gray-400">With Impact IDs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {dashboardData.creators.filter(c => !c.impactId || !c.impactSubId).length}
                  </div>
                  <div className="text-gray-400">Missing Impact IDs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {dashboardData.creators.filter(c => c.impactId && c.impactId.startsWith('auto_')).length}
                  </div>
                  <div className="text-gray-400">Auto-Generated</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {dashboardData.creators.map((creator) => (
                <div key={creator.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {creator.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{creator.name}</h3>
                        <p className="text-gray-400 text-sm">{creator.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Impact ID</div>
                        <div className="text-white font-mono text-sm">
                          {creator.impactId || '❌ None'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Sub ID</div>
                        <div className="text-white font-mono text-sm">
                          {creator.impactSubId || '❌ None'}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!creator.impactSubId ? (
                          <button
                            onClick={() => handleAutoGenerateImpactId(creator.id, creator.name)}
                            className="bg-green-600 px-3 py-1 text-sm rounded hover:bg-green-700"
                          >
                            🎲 Generate
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleUpdateImpactIds(creator.id)}
                              className="bg-blue-600 px-3 py-1 text-sm rounded hover:bg-blue-700"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleRemoveImpactIds(creator.id)}
                              className="bg-red-600 px-3 py-1 text-sm rounded hover:bg-red-700"
                            >
                              🗑️ Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bulk Actions Tab */}
        {activeTab === 'bulk-actions' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">⚡ Bulk Actions Center</h2>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Bulk Operations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleBulkApprove}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-medium transition-colors"
                >
                  ✅ Bulk Approve Selected Creators
                </button>
                <button
                  onClick={handleBulkReject}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-lg font-medium transition-colors"
                >
                  ❌ Bulk Reject Selected Creators
                </button>
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-medium transition-colors"
                >
                  ▶️ Bulk Activate Creators
                </button>
                <button
                  onClick={() => handleBulkAction('setCommission')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-medium transition-colors"
                >
                  💰 Set Bulk Commission Rates
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Selected Creators ({selectedCreators.length})</h3>
              {selectedCreators.length === 0 ? (
                <p className="text-gray-400">No creators selected. Go to the Creator Management tab and select creators using checkboxes.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCreators.map(creatorId => {
                    const creator = dashboardData.creators.find(c => c.id === creatorId);
                    return creator ? (
                      <div key={creatorId} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {creator.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-medium">{creator.name}</div>
                            <div className="text-gray-400 text-sm">{creator.email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedCreators(selectedCreators.filter(id => id !== creatorId))}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                        >
                          ❌
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
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

      {/* Creator Details Modal */}
      {showCreatorModal && selectedCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">👤 Creator Details</h3>
              <button
                onClick={() => setShowCreatorModal(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-blue-400">Basic Information</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Name</label>
                  <p className="text-white">{selectedCreator.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Email</label>
                  <p className="text-white">{selectedCreator.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Bio</label>
                  <p className="text-white">{selectedCreator.bio || 'No bio provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Role</label>
                  <p className="text-white">{selectedCreator.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Status</label>
                  <p className="text-white">{selectedCreator.applicationStatus || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Active</label>
                  <p className="text-white">{selectedCreator.isActive !== false ? '✅ Yes' : '❌ No'}</p>
                </div>
              </div>

              {/* Impact IDs & Commission */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-green-400">Impact & Commission</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Impact ID</label>
                  <p className="text-white">{selectedCreator.impactId || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Sub ID</label>
                  <p className="text-white">{selectedCreator.impactSubId || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Commission Rate</label>
                  <p className="text-white">{selectedCreator.commissionRate || 70}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Wallet Address</label>
                  <p className="text-white">{selectedCreator.walletAddress || 'Not provided'}</p>
                </div>
              </div>

              {/* Social Platforms */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-lg font-semibold text-purple-400">Social Platforms</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedCreator.socialInstagram && (
                    <div className="bg-pink-600 p-3 rounded">
                      <label className="block text-sm font-medium text-white">Instagram</label>
                      <p className="text-white">{selectedCreator.socialInstagram}</p>
                    </div>
                  )}
                  {selectedCreator.socialTiktok && (
                    <div className="bg-black p-3 rounded">
                      <label className="block text-sm font-medium text-white">TikTok</label>
                      <p className="text-white">{selectedCreator.socialTiktok}</p>
                    </div>
                  )}
                  {selectedCreator.socialTwitter && (
                    <div className="bg-blue-500 p-3 rounded">
                      <label className="block text-sm font-medium text-white">Twitter</label>
                      <p className="text-white">{selectedCreator.socialTwitter}</p>
                    </div>
                  )}
                  {selectedCreator.socialYoutube && (
                    <div className="bg-red-600 p-3 rounded">
                      <label className="block text-sm font-medium text-white">YouTube</label>
                      <p className="text-white">{selectedCreator.socialYoutube}</p>
                    </div>
                  )}
                  {selectedCreator.socialFacebook && (
                    <div className="bg-blue-600 p-3 rounded">
                      <label className="block text-sm font-medium text-white">Facebook</label>
                      <p className="text-white">{selectedCreator.socialFacebook}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Creator Modal */}
      {showEditModal && editingCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">✏️ Edit Creator</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={editingCreator.name}
                  onChange={(e) => setEditingCreator({...editingCreator, name: e.target.value})}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={editingCreator.email}
                  onChange={(e) => setEditingCreator({...editingCreator, email: e.target.value})}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                <textarea
                  value={editingCreator.bio || ''}
                  onChange={(e) => setEditingCreator({...editingCreator, bio: e.target.value})}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Commission Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingCreator.commissionRate || 70}
                  onChange={(e) => setEditingCreator({...editingCreator, commissionRate: parseInt(e.target.value)})}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleSaveCreatorEdit}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  💾 Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
