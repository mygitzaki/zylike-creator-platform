import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import {
  promoteCreatorToAdmin,
  deleteCreatorById,
  fetchCreatorImpactStats,
} from '../api/adminApi';

export default function Admin() {
  // 🚀 Admin Dashboard v2.0 - Enhanced with Creator Management & Impact ID Controls - Force Vercel redeploy
  const [stats, setStats] = useState(null);
  const [impactStats, setImpactStats] = useState(null);
  const [creators, setCreators] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [brands, setBrands] = useState([]);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingApplications, setPendingApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [allApplications, setAllApplications] = useState([]);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [editingCreator, setEditingCreator] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const decoded = JSON.parse(atob(token.split('.')[1]));
    if (decoded.role !== 'ADMIN') return navigate('/login');

    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
      try {
        const [statsRes, creatorsRes, transactionsRes, brandsRes, advancedAnalyticsRes] = await Promise.all([
          axios.get('/admin/stats', { headers }),
          axios.get(`/admin/creators?search=${search}&sortBy=${sortBy}&order=${order}`, { headers }),
          axios.get('/admin/transactions', { headers }),
          axios.get('/admin/brands', { headers }),
          axios.get('/admin/analytics/advanced?timeFrame=30d', { headers }),
        ]);

        // Note: Impact stats are fetched per creator, not for admin
        // const impactRes = await fetchCreatorImpactStats(decoded.id, startDate, endDate);

        setStats(statsRes.data);
        setCreators(creatorsRes.data.creators);
        setTransactions(transactionsRes.data.transactions);
        setBrands(brandsRes.data.brands);
        setAdvancedAnalytics(advancedAnalyticsRes.data);
        // setImpactStats(impactRes);
      } catch (err) {
        console.error(err);
        setError('Access denied or fetch error');
      }
    };

    fetchData();
    fetchPendingApplications(); // Fetch pending applications on mount
    fetchAllApplications(); // Fetch all applications on mount
  }, [search, sortBy, order, startDate, endDate]);

  const handlePromote = async (creatorId) => {
    try {
      await promoteCreatorToAdmin(creatorId);
      alert('User promoted to admin!');
      window.location.reload();
    } catch (error) {
      console.error('Promotion error:', error);
      alert('Failed to promote user.');
    }
  };

  const handleDelete = async (creatorId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteCreatorById(creatorId);
      alert('User deleted!');
      window.location.reload();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete user.');
    }
  };



  // POWERFUL ADMIN FUNCTIONS
  const handleCreatorStatusToggle = async (creatorId, currentStatus) => {
    const token = localStorage.getItem('token');
    const newStatus = !currentStatus;
    const reason = prompt(`Reason for ${newStatus ? 'activating' : 'deactivating'} this creator:`);
    
    if (reason === null) return; // User cancelled
    
    try {
      await axios.put(`/admin/creator/${creatorId}/status`, {
        isActive: newStatus,
        reason: reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setCreators(creators.map(creator => 
        creator.id === creatorId 
          ? { ...creator, isActive: newStatus }
          : creator
      ));
      
      alert(`Creator ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      alert('Failed to update creator status');
    }
  };

  const handleCommissionRateChange = async (creatorId, currentRate) => {
    const token = localStorage.getItem('token');
    const newRate = prompt(`Set new commission rate for this creator (current: ${currentRate}%):`, currentRate);
    
    if (newRate === null || newRate === currentRate.toString()) return;
    
    const rate = parseInt(newRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert('Please enter a valid commission rate between 0 and 100');
      return;
    }
    
    const reason = prompt('Reason for commission change:');
    if (reason === null) return;
    
    try {
      await axios.put(`/admin/creator/${creatorId}/commission`, {
        commissionRate: rate,
        reason: reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setCreators(creators.map(creator => 
        creator.id === creatorId 
          ? { ...creator, commissionRate: rate }
          : creator
      ));
      
      alert(`Commission rate updated to ${rate}%`);
    } catch (err) {
      alert('Failed to update commission rate');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedCreators.length === 0) {
      alert('Please select creators first');
      return;
    }
    
    const token = localStorage.getItem('token');
    let data = {};
    
    if (action === 'setCommission') {
      const rate = prompt('Set commission rate for selected creators:');
      if (rate === null) return;
      const commissionRate = parseInt(rate);
      if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
        alert('Invalid commission rate');
        return;
      }
      data.commissionRate = commissionRate;
    }
    
    if (action === 'removeImpactIds') {
      if (!confirm(`Are you sure you want to remove Impact IDs for ${selectedCreators.length} creators? This will reset their Impact.com integration.`)) {
        return;
      }
    }
    
    if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedCreators.length} creators? This action cannot be undone.`)) {
        return;
      }
    }
    
    try {
      const res = await axios.post('/admin/creators/bulk-actions', {
        action,
        creatorIds: selectedCreators,
        data
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(res.data.message);
      setSelectedCreators([]);
      // Refresh data
      window.location.reload();
    } catch (err) {
      alert('Bulk action failed');
    }
  };

  const handleSyncSubaffiliates = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post('/admin/sync-subaffiliates', {}, { headers });
      alert(res.data.message);
      window.location.reload();
    } catch (err) {
      console.error('Sync error:', err);
      alert('Failed to sync subaffiliates');
    }
  };

  // Renamed to avoid conflict
  const handleSyncWithImpact = handleSyncSubaffiliates;

  const handleAutoGenerateAllImpactIds = async () => {
    const creatorsWithoutImpactId = creators.filter(c => !c.impactSubId);
    if (creatorsWithoutImpactId.length === 0) {
      alert('All creators already have Impact IDs!');
      return;
    }
    
    if (!confirm(`Auto-generate unique Impact IDs for ${creatorsWithoutImpactId.length} creators?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      let created = 0;
      
      for (const creator of creatorsWithoutImpactId) {
        const response = await fetch('http://localhost:5000/api/admin/create-subaffiliate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            creatorId: creator.id,
            autoGenerate: true
          })
        });
        
        if (response.ok) created++;
      }
      
      alert(`✅ Auto-generated ${created} Impact IDs!`);
      window.location.reload();
    } catch (error) {
      alert('❌ Auto-generation failed: ' + error.message);
    }
  };

  const handleCreateAllSubaffiliates = async () => {
    const creatorsWithoutImpactId = creators.filter(c => !c.impactSubId);
    if (creatorsWithoutImpactId.length === 0) {
      alert('All creators already have Impact IDs!');
      return;
    }
    
    if (!confirm(`This will create Impact.com subaffiliates for ${creatorsWithoutImpactId.length} creators. Continue?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      let created = 0;
      
      for (const creator of creatorsWithoutImpactId) {
        const response = await fetch('http://localhost:5000/api/admin/create-subaffiliate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: creator.name,
            email: creator.email,
            creatorId: creator.id
          })
        });
        
        if (response.ok) created++;
      }
      
      alert(`✅ Created ${created} Impact.com subaffiliates!`);
      window.location.reload();
    } catch (error) {
      alert('❌ Creation failed: ' + error.message);
    }
  };

  const handleTestImpactConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/test-impact', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      if (response.ok) {
        alert(`✅ Impact.com Connection: ${result.status}\n📊 Real Data: ${result.realData ? 'YES' : 'NO'}\n🔗 Actions Found: ${result.actionsCount || 0}`);
      } else {
        alert(`❌ Connection failed: ${result.error}`);
      }
    } catch (error) {
      alert('❌ Test failed: ' + error.message);
    }
  };

  const generateUniqueImpactId = (creatorName) => {
    // Generate a unique Impact ID based on creator name + random elements
    const sanitizedName = creatorName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const randomSuffix = Math.random().toString(36).substring(2, 5); // 3 random chars
    
    return `${sanitizedName}_${timestamp}_${randomSuffix}`;
  };

  const handleAutoGenerateImpactId = async (creatorId, creatorName) => {
    if (!confirm(`Auto-generate a unique Impact ID for ${creatorName}?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/create-subaffiliate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          creatorId,
          autoGenerate: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ Impact ID "${result.subId}" assigned to ${creatorName}!`);
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`❌ Assignment failed: ${error.error}`);
      }
    } catch (error) {
      alert('❌ Assignment failed: ' + error.message);
    }
  };

  const handleAssignImpactId = async (creatorId, creatorName) => {
    const impactId = prompt(`Enter Impact ID for ${creatorName}:`);
    if (!impactId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/create-subaffiliate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          creatorId,
          customSubId: impactId
        })
      });
      
      if (response.ok) {
        alert(`✅ Impact ID "${impactId}" assigned to ${creatorName}!`);
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`❌ Assignment failed: ${error.error}`);
      }
    } catch (error) {
      alert('❌ Assignment failed: ' + error.message);
    }
  };

  const handleSeedTransactions = async () => {
    if (!confirm('This will import real transactions from Impact.com. Continue?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/seed-transactions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      if (response.ok) {
        alert(`✅ Import completed!\n📊 ${result.transactionsSeeded} transactions imported\n👥 ${result.creatorsCreated} creators created\n💰 Real data: ${result.realData ? 'YES' : 'NO'}`);
        window.location.reload();
      } else {
        alert(`❌ Import failed: ${result.error}`);
      }
    } catch (error) {
      alert('❌ Import failed: ' + error.message);
    }
  };

  const handleCheckRealData = async () => {
    try {
      const response = await axios.get('/admin/check-real-data');
      
      const result = response.data;
      if (response.status === 200) {
        const { realData, recommendations } = result;
        alert(`🔍 Real Impact.com Data Status:\n\n📊 Impact Actions: ${realData.impactActions}\n🏪 Impact Campaigns: ${realData.impactCampaigns}\n👥 Local Creators: ${realData.localCreators}\n🔗 Creators with Impact IDs: ${realData.creatorsWithImpactIds}\n💰 Local Transactions: ${realData.localTransactions}\n📎 Local Links: ${realData.localLinks}\n\n🎯 Recommendations:\n${recommendations.needsImpactIdAssignment > 0 ? `• Assign Impact IDs to ${recommendations.needsImpactIdAssignment} creators\n` : ''}${recommendations.needsTransactionImport ? '• Import real transactions from Impact.com\n' : ''}${!recommendations.hasRealData ? '• No real data found - check Impact.com API connection\n' : '✅ Real data is available!'}`);
      } else {
        alert(`❌ Data check failed: ${result.error}`);
      }
    } catch (error) {
      alert('❌ Data check failed: ' + error.message);
    }
  };

  // Applications management
  const fetchPendingApplications = async () => {
    try {
      setApplicationsLoading(true);
      const response = await axios.get('/admin/applications/pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPendingApplications(response.data.applications || []);
    } catch (error) {
      console.error('Failed to fetch pending applications:', error);
      setError('Failed to fetch pending applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleReviewApplication = async (creatorId, action, reason = '', notes = '', impactId = '', impactSubId = '') => {
    try {
      const response = await axios.post(`/admin/applications/${creatorId}/review`, {
        action,
        reason,
        notes,
        impactId,
        impactSubId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        alert(`Application ${action}d successfully!`);
        // Refresh both applications and creators lists
        fetchPendingApplications();
        window.location.reload(); // Refresh creators list
      } else {
        alert(`Failed to ${action} application: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Review application error:', error);
      alert(`Failed to ${action} application: ${error.message}`);
    }
  };

  // 🆔 NEW: Handle updating creator Impact IDs
  const handleUpdateImpactIds = async (creatorId, creatorName) => {
    const newImpactId = prompt(`Enter new Impact ID for ${creatorName}:`);
    const newImpactSubId = prompt(`Enter new Sub ID for ${creatorName}:`);
    
    if (newImpactId === null || newImpactSubId === null) return;
    
    try {
      const response = await axios.put(`/admin/creator/${creatorId}/impact-ids`, {
        impactId: newImpactId || undefined,
        impactSubId: newImpactSubId || undefined
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        alert('Impact IDs updated successfully!');
        window.location.reload();
      } else {
        alert(`Failed to update Impact IDs: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Update Impact IDs error:', error);
      alert(`Failed to update Impact IDs: ${error.message}`);
    }
  };

  // 🗑️ NEW: Handle removing creator Impact IDs
  const handleRemoveImpactIds = async (creatorId, creatorName) => {
    if (!confirm(`Are you sure you want to remove Impact IDs for ${creatorId}? This will reset their Impact.com integration.`)) {
      return;
    }
    
    try {
      const response = await axios.delete(`/admin/creator/${creatorId}/impact-ids`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        alert('Impact IDs removed successfully!');
        window.location.reload();
      } else {
        alert(`Failed to remove Impact IDs: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Remove Impact IDs error:', error);
      alert(`Failed to remove Impact IDs: ${error.message}`);
    }
  };

  // 📋 NEW: Fetch ALL creator applications (pending, approved, rejected)
  const fetchAllApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/admin/applications/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAllApplications(response.data.applications);
      }
    } catch (error) {
      console.error('Fetch all applications error:', error);
    }
  };

  // 👤 NEW: Fetch detailed creator information
  const fetchCreatorDetails = async (creatorId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching creator details for ID:', creatorId);
      
      if (!token) {
        alert('No authentication token found. Please login again.');
        navigate('/login');
        return;
      }
      
      const response = await axios.get(`/admin/creator/${creatorId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('📋 Creator details response:', response.data);
      if (response.data.success) {
        setSelectedCreator(response.data.creator);
        setShowCreatorModal(true);
        console.log('✅ Modal should be showing now');
      } else {
        console.log('❌ Response not successful:', response.data);
        alert('Failed to fetch creator details: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Fetch creator details error:', error);
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        alert('Backend server is temporarily unavailable. Please try again in a few moments.');
      } else if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 500) {
        alert('Server error occurred. The backend might be restarting. Please try again in 30 seconds.');
      } else {
        alert('Failed to fetch creator details: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // ✏️ NEW: Handle editing creator
  const handleEditCreator = (creator) => {
    setEditingCreator({ ...creator });
    setShowEditModal(true);
  };

  // 💾 NEW: Save creator edits
  const handleSaveCreatorEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/admin/creator/${editingCreator.id}/details`, editingCreator, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('Creator details updated successfully!');
        setShowEditModal(false);
        setEditingCreator(null);
        // Refresh the data
        window.location.reload();
      }
    } catch (error) {
      console.error('Update creator error:', error);
      alert('Failed to update creator details');
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-6">
        <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
        <ul className="space-y-4">
          <li><a href="#dashboard" className="hover:text-blue-400">📊 Dashboard</a></li>
          <li><a href="#creators" className="hover:text-blue-400">👥 Creators</a></li>
          <li><a href="#applications" className="hover:text-blue-400">📝 Pending Applications</a></li>
          <li><a href="#all-applications" className="hover:text-blue-400">📋 All Applications</a></li>
          <li><a href="#summary" className="hover:text-blue-400">📊 Summary</a></li>
          <li><a href="#transactions" className="hover:text-blue-400">💰 Transactions</a></li>
          <li><a href="#filters" className="hover:text-blue-400">⚙️ Filters</a></li>
        </ul>
      </div>

      {/* Main */}
      <div className="flex-1 p-8 overflow-y-scroll">
        {error ? (
          <div className="text-red-500">{error}</div>
        ) : !stats ? (
          <div>Loading admin data...</div>
        ) : (
          <section id="dashboard">
            <h1 className="text-3xl font-bold mb-6">💪 Powerful Admin Dashboard</h1>
            
            {/* 🐛 Debug Info */}
            <div className="mb-4 p-4 bg-gray-700 rounded border-2 border-yellow-500">
              <div className="text-lg font-bold text-yellow-400 mb-2">🐛 DEBUG CONTROLS</div>
              <div className="text-sm text-white mb-2">
                Modal State: <span className={`font-bold ${showCreatorModal ? 'text-green-400' : 'text-red-400'}`}>
                  {showCreatorModal ? '✅ OPEN' : '❌ CLOSED'}
                </span> | 
                Creator: <span className="text-blue-400">{selectedCreator ? selectedCreator.name : 'NONE'}</span>
              </div>
              <button 
                onClick={() => {
                  console.log('🧪 TEST MODAL BUTTON CLICKED');
                  setSelectedCreator({
                    id: 'test-123',
                    name: 'Test Creator',
                    email: 'test@example.com',
                    bio: 'This is a test modal',
                    role: 'CREATOR',
                    applicationStatus: 'APPROVED',
                    isActive: true,
                    impactId: 'test-impact-123',
                    impactSubId: 'test-sub-456'
                  });
                  setShowCreatorModal(true);
                  console.log('✅ Modal state should be TRUE now');
                }}
                className="bg-red-600 px-4 py-2 rounded text-white font-bold hover:bg-red-700 text-lg"
              >
                🚨 CLICK TO TEST MODAL 🚨
              </button>
            </div>
            
            {/* Advanced Analytics Overview */}
            {advancedAnalytics && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white">Platform Revenue</h3>
                  <p className="text-3xl font-bold text-white">${advancedAnalytics.overview.totalRevenue.toFixed(2)}</p>
                  <p className="text-green-200">+{advancedAnalytics.overview.revenueGrowth}% growth</p>
                </div>
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white">Creator Earnings</h3>
                  <p className="text-3xl font-bold text-white">${advancedAnalytics.overview.totalCreatorEarnings.toFixed(2)}</p>
                  <p className="text-blue-200">70% average</p>
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white">Platform Fees</h3>
                  <p className="text-3xl font-bold text-white">${advancedAnalytics.overview.totalPlatformFees.toFixed(2)}</p>
                  <p className="text-purple-200">30% commission</p>
                </div>
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white">Transactions</h3>
                  <p className="text-3xl font-bold text-white">{advancedAnalytics.overview.totalTransactions}</p>
                  <p className="text-orange-200">Real conversions</p>
                </div>
              </div>
            )}
            
            {/* Basic Stats Fallback */}
            {!advancedAnalytics && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <StatCard title="Total Creators" count={stats.totalCreators} />
              <StatCard title="Total Links" count={stats.totalLinks} />
              <StatCard title="Total Transactions" count={stats.totalTransactions} />
            </div>
            )}

            {/* 🔗 Impact.com Integration Controls */}
            <section className="mt-10">
              <h2 className="text-2xl font-semibold mb-6">🔗 Impact.com Integration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <button
                  onClick={handleAutoGenerateAllImpactIds}
                  className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg font-medium"
                >
                  🎲 Auto Generate All IDs
                </button>
                <button
                  onClick={handleSyncWithImpact}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
                >
                  🔄 Sync from Impact.com
                </button>
                <button
                  onClick={handleCreateAllSubaffiliates}
                  className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium"
                >
                  ➕ Create All in Impact.com
                </button>
                <button
                  onClick={handleSeedTransactions}
                  className="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg font-medium"
                >
                  💰 Import Real Transactions
                </button>
                <button
                  onClick={handleTestImpactConnection}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium"
                >
                  🔍 Test Impact Connection
                </button>
              </div>
              
              {/* Real Data Status Check */}
              <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold mb-3 text-yellow-400">📊 Real Data Management</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Check your actual Impact.com data status and import real transactions to populate creator dashboards.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCheckRealData}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium"
                  >
                    🔍 Check Real Data Status
                  </button>
                  <button
                    onClick={handleSeedTransactions}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium"
                  >
                    💰 Import Real Transactions
                  </button>
                </div>
              </div>

            </section>

            {/* 📈 Impact Stats - Disabled for now */}
            {/* {impactStats && (
              <>
                <h2 className="text-2xl font-semibold mt-10 mb-2">📈 Impact Stats</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                  <StatCard title="Total Clicks" count={impactStats.totalClicks} />
                  <StatCard title="Total Conversions" count={impactStats.totalActions} />
                  <StatCard title="Total Commission" count={`$${impactStats.totalCommission?.toFixed(2)}`} />
                </div>

                <div className="flex gap-4 mb-6">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-gray-800 border border-gray-700 px-3 py-2 rounded"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-gray-800 border border-gray-700 px-3 py-2 rounded"
                  />
                  <button
                    onClick={handleSeedTransactions}
                    className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
                  >
                    ⚡ Seed Transactions
                  </button>
                  <button
                    onClick={handleSyncSubaffiliates}
                    className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
                  >
                    🔄 Sync Subaffiliates
                  </button>
                </div>
              </>
            )} */}

            {/* 👥 Creators List */}
            <section id="creators" className="mt-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">💪 Creator Control Center ({creators.length})</h2>
                
                {/* Bulk Actions */}
                {selectedCreators.length > 0 && (
                  <div className="flex space-x-2">
                    <span className="text-blue-400">{selectedCreators.length} selected</span>
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
                    <button
                      onClick={() => handleBulkAction('removeImpactIds')}
                      className="bg-orange-600 px-3 py-1 text-sm rounded hover:bg-orange-700"
                    >
                      🗑️ Remove Impact IDs
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="bg-red-600 px-3 py-1 text-sm rounded hover:bg-red-700"
                    >
                      🗑️ Bulk Delete
                    </button>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Search creators..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-gray-700 px-3 py-2 rounded flex-1"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-700 px-3 py-2 rounded"
                  >
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="createdAt">Created</option>
                    <option value="role">Role</option>
                  </select>
                  <button
                    onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
                    className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
                  >
                    {order === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
                
                <div className="space-y-3">
                  {creators.map((creator) => (
                    <div key={creator.id} className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
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
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-lg">{creator.name}</p>
                              <span className={`px-2 py-1 text-xs rounded ${
                                creator.isActive !== false ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                              }`}>
                                {creator.isActive !== false ? '✅ Active' : '❌ Inactive'}
                              </span>
                              <span className="px-2 py-1 text-xs bg-purple-600 text-white rounded">
                                💰 {creator.commissionRate || 70}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">{creator.email}</p>
                            <div className="flex space-x-4 text-xs text-gray-500 mt-1">
                              <span>Role: {creator.role}</span>
                              <span>Impact ID: {creator.impactId || 'None'}</span>
                              <span>Sub ID: {creator.impactSubId || 'None'}</span>
                              <span>Status: {creator.applicationStatus || 'N/A'}</span>
                              <span>Joined: {new Date(creator.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Powerful Action Buttons */}
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
                                🎲 Auto Generate ID
                              </button>
                              <button
                                onClick={() => handleAssignImpactId(creator.id, creator.name)}
                                className="bg-blue-600 px-3 py-1 text-sm rounded hover:bg-blue-700"
                              >
                                🔗 Manual Assign
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleUpdateImpactIds(creator.id, creator.name)}
                                className="bg-blue-600 px-3 py-1 text-sm rounded hover:bg-blue-700"
                              >
                                ✏️ Edit IDs
                              </button>
                              <button
                                onClick={() => handleRemoveImpactIds(creator.id, creator.name)}
                                className="bg-orange-600 px-3 py-1 text-sm rounded hover:bg-orange-700"
                              >
                                🗑️ Remove IDs
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => {
                              console.log('🖱️ View Details clicked for:', creator.id, creator.name);
                              fetchCreatorDetails(creator.id);
                            }}
                            className="bg-blue-600 px-3 py-1 text-sm rounded hover:bg-blue-700"
                          >
                            👁️ View Details
                          </button>
                          
                          <button
                            onClick={() => handleEditCreator(creator)}
                            className="bg-yellow-600 px-3 py-1 text-sm rounded hover:bg-yellow-700"
                          >
                            ✏️ Edit
                          </button>
                          
                          <button
                            onClick={() => alert('Feature coming soon!')}
                            className="bg-gray-600 px-3 py-1 text-sm rounded hover:bg-gray-700"
                          >
                            📊 Performance
                          </button>
                          
                          {creator.role !== 'ADMIN' && (
                            <button
                              onClick={() => handlePromote(creator.id)}
                              className="bg-green-600 px-3 py-1 text-sm rounded hover:bg-green-700"
                            >
                              ⬆️ Promote
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDelete(creator.id)}
                            className="bg-red-600 px-3 py-1 text-sm rounded hover:bg-red-700"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 📝 Pending Applications */}
            <section id="applications" className="mt-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">📝 Pending Applications ({pendingApplications.length})</h2>
                <button
                  onClick={fetchPendingApplications}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium"
                >
                  🔄 Refresh
                </button>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                {applicationsLoading ? (
                  <div className="text-center py-8">Loading applications...</div>
                ) : pendingApplications.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No pending applications</div>
                ) : (
                  <div className="space-y-4">
                    {pendingApplications.map((application) => (
                      <div key={application.id} className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">{application.name}</h3>
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
                              Applied: {new Date(application.appliedAt || application.submittedAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col space-y-2 ml-4">
                            <button
                              onClick={() => {
                                const impactId = prompt('Enter Impact ID (or leave empty for auto-generation):');
                                const impactSubId = prompt('Enter Sub ID (or leave empty for auto-generation):');
                                const notes = prompt('Review notes (optional):');
                                
                                if (impactId !== null && impactSubId !== null) {
                                  handleReviewApplication(application.id, 'approve', '', notes, impactId, impactSubId);
                                }
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
                                const notes = prompt('Changes requested:');
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
                  </div>
                )}
              </div>
            </section>

            {/* 📋 All Applications (Pending, Approved, Rejected) */}
            <section id="all-applications" className="mt-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">📋 All Applications ({allApplications.length})</h2>
                <button
                  onClick={fetchAllApplications}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium"
                >
                  🔄 Refresh
                </button>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                {allApplications.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No applications found</div>
                ) : (
                  <div className="space-y-4">
                    {allApplications.map((application) => (
                      <div key={application.id} className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">{application.name}</h3>
                              <span className={`px-2 py-1 text-xs rounded ${
                                application.applicationStatus === 'PENDING' ? 'bg-yellow-600 text-white' :
                                application.applicationStatus === 'APPROVED' ? 'bg-green-600 text-white' :
                                application.applicationStatus === 'REJECTED' ? 'bg-red-600 text-white' :
                                'bg-gray-600 text-white'
                              }`}>
                                {application.applicationStatus}
                              </span>
                              <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
                                Step {application.onboardingStep}/7
                              </span>
                              {application.isActive !== false && (
                                <span className="px-2 py-1 text-xs bg-green-600 text-white rounded">
                                  ✅ Active
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{application.email}</p>
                            {application.bio && (
                              <p className="text-sm text-gray-300 mb-3">{application.bio}</p>
                            )}
                            
                            {/* Impact IDs */}
                            <div className="flex space-x-4 mb-3">
                              <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                                Impact ID: {application.impactId || 'None'}
                              </span>
                              <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                                Sub ID: {application.impactSubId || 'None'}
                              </span>
                              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                Commission: {application.commissionRate || 70}%
                              </span>
                            </div>
                            
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
                              Applied: {new Date(application.appliedAt || application.submittedAt || application.createdAt).toLocaleDateString()}
                              {application.approvedAt && (
                                <span className="ml-4">Approved: {new Date(application.approvedAt).toLocaleDateString()}</span>
                              )}
                              {application.rejectedAt && (
                                <span className="ml-4">Rejected: {new Date(application.rejectedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                            
                            {/* Review Notes */}
                            {application.reviewNotes && (
                              <div className="mt-2 p-2 bg-gray-600 rounded">
                                <span className="text-xs font-medium text-gray-300">Review Notes:</span>
                                <p className="text-xs text-gray-400">{application.reviewNotes}</p>
                              </div>
                            )}
                            
                            {/* Rejection Reason */}
                            {application.rejectionReason && (
                              <div className="mt-2 p-2 bg-red-900 rounded">
                                <span className="text-xs font-medium text-red-300">Rejection Reason:</span>
                                <p className="text-xs text-red-400">{application.rejectionReason}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col space-y-2 ml-4">
                            {application.applicationStatus === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => {
                                    const impactId = prompt('Enter Impact ID (or leave empty for auto-generation):');
                                    const impactSubId = prompt('Enter Sub ID (or leave empty for auto-generation):');
                                    const notes = prompt('Review notes (optional):');
                                    
                                    if (impactId !== null && impactSubId !== null) {
                                      handleReviewApplication(application.id, 'approve', '', notes, impactId, impactSubId);
                                    }
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
                                    const notes = prompt('Changes requested:');
                                    if (notes) {
                                      handleReviewApplication(application.id, 'request_changes', '', notes);
                                    }
                                  }}
                                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-sm font-medium"
                                >
                                  🔄 Request Changes
                                </button>
                              </>
                            )}
                            
                            {application.applicationStatus === 'APPROVED' && (
                              <>
                                <button
                                  onClick={() => fetchCreatorDetails(application.id)}
                                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium"
                                >
                                  👁️ View Details
                                </button>
                                
                                <button
                                  onClick={() => handleEditCreator(application)}
                                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-sm font-medium"
                                >
                                  ✏️ Edit
                                </button>
                                
                                <button
                                  onClick={() => handleCreatorStatusToggle(application.id, application.isActive !== false)}
                                  className={`px-4 py-2 rounded text-sm font-medium ${
                                    application.isActive !== false 
                                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                                      : 'bg-green-600 hover:bg-green-700'
                                  }`}
                                >
                                  {application.isActive !== false ? '⏸️ Deactivate' : '▶️ Activate'}
                                </button>
                              </>
                            )}
                            
                            {application.applicationStatus === 'REJECTED' && (
                              <button
                                onClick={() => fetchCreatorDetails(application.id)}
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium"
                              >
                                👁️ View Details
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* 📊 Creator Management Summary */}
            <section id="summary" className="mt-10">
              <h2 className="text-2xl font-semibold mb-4">📊 Creator Management Summary</h2>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-600 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-semibold text-white">Total Creators</h3>
                    <p className="text-3xl font-bold text-white">{creators.length}</p>
                  </div>
                  <div className="bg-green-600 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-semibold text-white">Active</h3>
                    <p className="text-3xl font-bold text-white">{creators.filter(c => c.isActive !== false).length}</p>
                  </div>
                  <div className="bg-yellow-600 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-semibold text-white">With Impact IDs</h3>
                    <p className="text-3xl font-bold text-white">{creators.filter(c => c.impactId).length}</p>
                  </div>
                  <div className="bg-purple-600 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-semibold text-white">Pending</h3>
                    <p className="text-3xl font-bold text-white">{pendingApplications.length}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 💰 Transactions List */}
            <section id="transactions" className="mt-10">
              <h2 className="text-2xl font-semibold mb-4">💰 Transactions</h2>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                      <div>
                        <p className="font-semibold">${transaction.creatorPayout.toFixed(2)}</p>
                        <p className="text-sm text-gray-400">Creator: {transaction.creator.name}</p>
                        <p className="text-xs text-gray-500">Status: {transaction.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Gross: ${transaction.grossAmount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">Fee: ${transaction.platformFee.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </section>
        )}
      </div>

      {/* 👤 Creator Details Modal */}
      {showCreatorModal && selectedCreator && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[9999]" 
          style={{
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div 
            className="rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: '#1f2937',
              border: '3px solid #3b82f6',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              color: 'white'
            }}
          >
            {/* 🚨 VISIBLE TEST BANNER */}
            <div className="bg-red-600 text-white p-4 mb-4 text-center text-xl font-bold">
              🚨 MODAL IS WORKING! 🚨 This should be VERY visible!
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold" style={{color: 'white'}}>👤 Creator Details: {selectedCreator.name}</h2>
              <button
                onClick={() => setShowCreatorModal(false)}
                className="text-gray-400 hover:text-white text-3xl font-bold"
                style={{color: 'white', fontSize: '2rem'}}
              >
                ❌ CLOSE
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-400">Basic Information</h3>
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
                <h3 className="text-lg font-semibold text-green-400">Impact & Commission</h3>
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
                <h3 className="text-lg font-semibold text-purple-400">Social Platforms</h3>
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

              {/* Additional Info */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-yellow-400">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCreator.personalWebsite && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Personal Website</label>
                      <p className="text-white">{selectedCreator.personalWebsite}</p>
                    </div>
                  )}
                  {selectedCreator.linkedinProfile && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400">LinkedIn</label>
                      <p className="text-white">{selectedCreator.linkedinProfile}</p>
                    </div>
                  )}
                  {selectedCreator.blogUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Blog URL</label>
                      <p className="text-white">{selectedCreator.blogUrl}</p>
                    </div>
                  )}
                  {selectedCreator.shopUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Shop URL</label>
                      <p className="text-white">{selectedCreator.shopUrl}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-400">Timestamps</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Created</label>
                    <p className="text-white">{new Date(selectedCreator.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Last Updated</label>
                    <p className="text-white">{new Date(selectedCreator.updatedAt).toLocaleString()}</p>
                  </div>
                  {selectedCreator.approvedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Approved</label>
                      <p className="text-white">{new Date(selectedCreator.approvedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => handleEditCreator(selectedCreator)}
                className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-medium"
              >
                ✏️ Edit Creator
              </button>
              <button
                onClick={() => setShowCreatorModal(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ Edit Creator Modal */}
      {showEditModal && editingCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">✏️ Edit Creator: {editingCreator.name}</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-400">Basic Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Name</label>
                  <input
                    type="text"
                    value={editingCreator.name || ''}
                    onChange={(e) => setEditingCreator({...editingCreator, name: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 px-3 py-2 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Email</label>
                  <input
                    type="email"
                    value={editingCreator.email || ''}
                    onChange={(e) => setEditingCreator({...editingCreator, email: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 px-3 py-2 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Bio</label>
                  <textarea
                    value={editingCreator.bio || ''}
                    onChange={(e) => setEditingCreator({...editingCreator, bio: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 px-3 py-2 rounded text-white"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingCreator.commissionRate || 70}
                    onChange={(e) => setEditingCreator({...editingCreator, commissionRate: parseInt(e.target.value)})}
                    className="w-full bg-gray-700 border border-gray-600 px-3 py-2 rounded text-white"
                  />
                </div>
              </div>

              {/* Social Platforms */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-400">Social Platforms</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Instagram</label>
                  <input
                    type="text"
                    value={editingCreator.socialInstagram || ''}
                    onChange={(e) => setEditingCreator({...editingCreator, socialInstagram: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 px-3 py-2 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">TikTok</label>
                  <input
                    type="text"
                    value={editingCreator.socialTiktok || ''}
                    onChange={(e) => setEditingCreator({...editingCreator, socialTiktok: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 px-3 py-2 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Twitter</label>
                  <input
                    type="text"
                    value={editingCreator.socialTwitter || ''}
                    onChange={(e) => setEditingCreator({...editingCreator, socialTwitter: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 px-3 py-2 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">YouTube</label>
                  <input
                    type="text"
                    value={editingCreator.socialYoutube || ''}
                    onChange={(e) => setEditingCreator({...editingCreator, socialYoutube: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 px-3 py-2 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Facebook</label>
                  <input
                    type="text"
                    value={editingCreator.socialFacebook || ''}
                    onChange={(e) => setEditingCreator({...editingCreator, socialFacebook: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 px-3 py-2 rounded text-white"
                  />
                </div>
              </div>

              {/* Additional URLs */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-yellow-400">Additional URLs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Personal Website</label>
                    <input
                      type="url"
                      value={editingCreator.personalWebsite || ''}
                      onChange={(e) => setEditingCreator({...editingCreator, personalWebsite: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 px-3 py-2 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">LinkedIn Profile</label>
                    <input
                      type="url"
                      value={editingCreator.linkedinProfile || ''}
                      onChange={(e) => setEditingCreator({...editingCreator, linkedinProfile: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 px-3 py-2 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Blog URL</label>
                    <input
                      type="url"
                      value={editingCreator.blogUrl || ''}
                      onChange={(e) => setEditingCreator({...editingCreator, blogUrl: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 px-3 py-2 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Shop URL</label>
                    <input
                      type="url"
                      value={editingCreator.shopUrl || ''}
                      onChange={(e) => setEditingCreator({...editingCreator, shopUrl: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 px-3 py-2 rounded text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={handleSaveCreatorEdit}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium"
              >
                💾 Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, count }) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow text-center">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-3xl font-bold text-blue-400">{count}</p>
    </div>
  );
}
