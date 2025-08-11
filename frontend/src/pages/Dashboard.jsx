// src/pages/Dashboard.jsx - Professional Creator Analytics Dashboard
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BonusTracker from '../components/BonusTracker';
import ProtectedRoute from '../components/ProtectedRoute';
import { toast } from 'react-toastify';
import axios from '../api/axiosInstance';

// Chart component (simple implementation - in a real app you'd use Chart.js or similar)
const Chart = ({ data, type = 'line', title, color = '#8B5CF6' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-2xl mb-2">📈</div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="h-48">
      {title && <h4 className="text-sm font-medium text-gray-300 mb-4">{title}</h4>}
      <div className="flex items-end h-32 space-x-1 px-2">
        {data.slice(0, 12).map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center min-w-0">
            <div 
              className="w-full rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer"
              style={{
                height: maxValue > 0 ? `${Math.max((item.value / maxValue) * 100, 1)}%` : '1%',
                backgroundColor: color,
                minHeight: '2px'
              }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};



// Insight Card Component
const InsightCard = ({ insight }) => {
  const typeColors = {
    success: 'border-green-500 bg-green-500/10 text-green-300',
    warning: 'border-yellow-500 bg-yellow-500/10 text-yellow-300',
    info: 'border-blue-500 bg-blue-500/10 text-blue-300',
    error: 'border-red-500 bg-red-500/10 text-red-300'
  };

  const icons = {
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️',
    error: '❌'
  };

  return (
    <div className={`border-l-4 p-4 rounded-r-lg ${typeColors[insight.type]}`}>
      <div className="flex items-start space-x-3">
        <span className="text-xl">{icons[insight.type]}</span>
        <div className="flex-1">
          <h4 className="font-semibold">{insight.title}</h4>
          <p className="text-sm opacity-90 mt-1">{insight.message}</p>
          {insight.action && (
            <p className="text-xs mt-2 font-medium opacity-75">
              💡 {insight.action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [creator, setCreator] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [topLinks, setTopLinks] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [timeFrame, setTimeFrame] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [generatedLink, setGeneratedLink] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Directly load data (onboarding temporarily disabled)
    fetchData();
  }, [timeFrame]);


  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const [profileRes, analyticsRes, campaignsRes] = await Promise.all([
        axios.get('/auth/profile'),
        axios.get(`/tracking/analytics?timeFrame=${timeFrame}`),
        axios.get('/links/campaigns')
      ]);

      const profileData = profileRes.data;
      const analyticsData = analyticsRes.data;
      const campaignsData = campaignsRes.data;

      setCreator(profileData.creator);
      setAnalytics(analyticsData.analytics);
      setTopLinks(analyticsData.topLinks || []);
      setRecentTransactions(analyticsData.recentTransactions || []);
      setCampaigns(campaignsData.campaigns || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const createLink = async () => {
    console.log('🔍 createLink called with newLink:', newLink);
    console.log('🔍 newLink type:', typeof newLink);
    console.log('🔍 newLink length:', newLink?.length);
    
    if (!newLink.trim()) {
      toast.error('Please enter a product URL');
      return;
    }

    try {
      console.log('🚀 Sending request with originalUrl:', newLink);
      const response = await axios.post('/links', {
        originalUrl: newLink,
        // campaignId optional; backend defaults to the only available program
      });

      const data = response.data;
      if (response.status === 200 || response.status === 201) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const affiliateLink = `${baseUrl}/api/tracking/click/${data.shortCode}`;
        toast.success('✅ Link created successfully!');
        
        // Store the generated link to display below the form
        setGeneratedLink({
          shortCode: data.shortCode,
          affiliateLink: affiliateLink,
          originalUrl: newLink
        });
        
        setNewLink('');
        fetchData(); // Refresh data
      } else {
        toast.error(data.error || 'Failed to create link');
      }
    } catch (error) {
      console.error('❌ Link creation error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Show specific error message from backend
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to create link';
      
      const errorDetails = error.response?.data?.details;
      const needsApproval = error.response?.data?.needsApproval;
      const needsActivation = error.response?.data?.needsActivation;
      
      if (needsApproval) {
        toast.error(`🔒 ${errorMessage} - Please contact admin for approval.`);
      } else if (needsActivation) {
        toast.error(`⚠️ ${errorMessage}`);
      } else if (errorDetails) {
        toast.error(`❌ ${errorMessage} (${errorDetails})`);
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'No Data';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return 'Invalid';
    return parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('✅ Affiliate link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('✅ Affiliate link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <div className="relative border-b border-white/10 backdrop-blur-xl bg-white/5">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Top Header Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">Z</span>
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    Zylike Creator
                  </h1>
                  <p className="text-purple-200/70 text-sm">
                    Welcome back, {creator?.name} ✨
                  </p>
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <select 
                    value={timeFrame} 
                    onChange={(e) => setTimeFrame(e.target.value)}
                    className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent appearance-none pr-8"
                  >
                    <option value="1d" className="bg-gray-800">Last 24 Hours</option>
                    <option value="7d" className="bg-gray-800">Last 7 Days</option>
                    <option value="30d" className="bg-gray-800">Last 30 Days</option>
                    <option value="90d" className="bg-gray-800">Last 90 Days</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                                <div className="flex gap-3">
                  {creator?.role === 'ADMIN' && (
                    <button
                      onClick={() => navigate('/admin')}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Admin Panel
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate('/payments')}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    💰 Payments
                  </button>
                  
          <button
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}
            className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-white/20"
          >
            Logout
          </button>
        </div>
              </div>
            </div>

            {/* Link Generator - Redesigned */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Create Affiliate Link</h3>
                    <p className="text-purple-200/60 text-sm hidden sm:block">Generate tracking links for any product</p>
                  </div>
                </div>

                {/* Available Brands */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs text-purple-200/60">Available:</span>
                  <div className="flex flex-wrap gap-2">
                    {campaigns.map((campaign) => (
                      <div key={campaign.Id} className="inline-flex items-center bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        <span className="text-xs font-medium text-purple-200">{campaign.Name}</span>
                      </div>
                    ))}
                  </div>
                                  </div>
                </div>

              <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3">
                  <div className="relative">
                    <input
                      type="url"
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      placeholder="Paste product URL here (e.g., https://walmart.com/product/...)"
                      className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-purple-200/50 text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="w-5 h-5 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
        </div>

                <button
                  onClick={createLink}
                  disabled={!newLink.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:hover:scale-100 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Generate</span>
                </button>
              </div>

              {/* Generated Link Display */}
              {generatedLink && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-900" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-green-300 font-medium text-sm">Link Generated Successfully!</span>
                    </div>
                    <button
                      onClick={() => setGeneratedLink(null)}
                      className="text-green-300/60 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
          </button>
        </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-green-200/60 text-xs uppercase tracking-wide mb-1">Short Code</p>
                      <p className="text-white font-mono text-sm">/{generatedLink.shortCode}</p>
        </div>

                    <div className="bg-white/5 rounded-lg p-3 md:col-span-2">
                      <p className="text-green-200/60 text-xs uppercase tracking-wide mb-1">Affiliate Link</p>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={generatedLink.affiliateLink}
                          readOnly
                          className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-1 text-xs text-green-100 font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(generatedLink.affiliateLink)}
                          className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* Creator Profile Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
            {/* Profile Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 lg:p-8 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
              <div className="relative">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                    {creator?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{creator?.name || 'Loading...'}</h3>
                    <p className="text-purple-200/70 text-sm">{creator?.email || 'Loading...'}</p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                      (creator?.isActive !== false && creator?.impactSubId) 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-400/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        (creator?.isActive !== false && creator?.impactSubId) ? 'bg-emerald-400' : 'bg-red-400'
                      }`}></span>
                      {(creator?.isActive !== false && creator?.impactSubId) ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <p className="text-purple-200/60 text-xs uppercase tracking-wide mb-1">Member Since</p>
                    <p className="font-semibold text-white text-sm">
                      {creator?.createdAt ? new Date(creator.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <p className="text-purple-200/60 text-xs uppercase tracking-wide mb-1">Status</p>
                    <p className="font-semibold text-white text-sm">
                      {creator?.impactSubId ? 'Ready to Earn' : 'Setup Required'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Link Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 lg:p-8 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Referral Link</h3>
                      <p className="text-blue-200/60 text-sm">Share & earn together</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/signup?ref=${creator?.id}`)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Copy Link
                  </button>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 mb-4">
                  <p className="text-blue-100 text-sm break-all font-mono">
                    {`${window.location.origin}/signup?ref=${creator?.id || 'loading'}`}
                  </p>
                </div>

                <div className="flex items-center space-x-4 text-xs text-blue-200/60">
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Invite creators</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Grow community</span>
                  </div>
                </div>
              </div>
            </div>


          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8 lg:mb-12">
            {/* Total Earnings */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl group hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    (analytics?.earningsGrowth || 0) >= 0 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {analytics?.earningsGrowth && typeof analytics.earningsGrowth === 'number' ? `${analytics.earningsGrowth > 0 ? '+' : ''}${analytics.earningsGrowth.toFixed(1)}%` : '0%'}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Earnings (Commissionable Sales)</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(analytics?.totalEarnings)}</p>
                <p className="text-xs text-green-300 mt-2 flex items-center">
                  <span className="mr-1">💎</span>
                  Only sales from qualifying products
                </p>
              </div>
            </div>

            {/* Total Clicks */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl group hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    (analytics?.clicksGrowth || 0) >= 0 
                      ? 'bg-blue-500/20 text-blue-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {analytics?.clicksGrowth && typeof analytics.clicksGrowth === 'number' ? `${analytics.clicksGrowth > 0 ? '+' : ''}${analytics.clicksGrowth.toFixed(1)}%` : '0%'}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Total Clicks</h3>
                <p className="text-2xl font-bold text-white">{analytics?.totalClicks?.toLocaleString() || '0'}</p>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl group hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300">
                    {analytics?.conversionRate && typeof analytics.conversionRate === 'number' ? `${analytics.conversionRate.toFixed(1)}%` : '0.0%'}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Conversion Rate</h3>
                <p className="text-2xl font-bold text-white">{analytics?.conversionRate && typeof analytics.conversionRate === 'number' ? `${analytics.conversionRate.toFixed(1)}%` : '0.0%'}</p>
              </div>
            </div>

            {/* Avg Order Value */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl group hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300">
                    Average
                  </div>
                </div>
                <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Avg Order Value</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(analytics?.avgOrderValue)}</p>
              </div>
            </div>
          </div>

          {/* Bonus Tracker Section */}
          <div className="mb-8 lg:mb-12">
            <BonusTracker />
          </div>

          {/* Performance Charts & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-12">
            {/* Performance Chart */}
            <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 lg:p-8 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5" />
              <div className="relative">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg lg:text-xl font-bold text-white">Performance Analytics</h3>
                      <p className="text-purple-200/60 text-sm hidden sm:block">Track your earnings and engagement trends</p>
                    </div>
        </div>

                  <div className="flex items-center space-x-4 lg:space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"></div>
                      <span className="text-purple-200">Earnings</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                      <span className="text-blue-200">Clicks</span>
                    </div>
                  </div>
                </div>

                {analytics?.dailyData && analytics.dailyData.length > 0 ? (
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-white/10">
                    <Chart
                      data={analytics.dailyData.map((d, index) => ({
                        label: d.date ? formatDate(d.date) : `Day ${index + 1}`,
                        value: d.earnings || 0
                      }))}
                      title="Daily Earnings"
                      color="#8B5CF6"
                    />
                  </div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 lg:p-12 border border-white/10">
                    <div className="text-center text-white/60">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">No Data Yet</h4>
                      <p className="text-sm">Create affiliate links to start tracking your performance</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 lg:p-8 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5" />
              <div className="relative">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Smart Insights</h3>
                    <p className="text-emerald-200/60 text-sm">AI-powered recommendations</p>
                  </div>
        </div>

                <div className="space-y-4">
                  {analytics?.insights?.length > 0 ? (
                    analytics.insights.map((insight, index) => (
                      <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <InsightCard insight={insight} />
                      </div>
                    ))
                  ) : (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 lg:p-8 border border-white/10">
                      <div className="text-center text-white/60">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-white mb-2">Gathering Intelligence</h4>
                        <p className="text-xs">Generate activity to unlock personalized insights</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Audience & Device Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>
              <div className="space-y-3">
                {analytics?.deviceStats && Object.entries(analytics.deviceStats).map(([device, count]) => (
                  <div key={device} className="flex items-center justify-between">
                    <span className="text-gray-300">{device}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500"
                          style={{ width: `${(count / analytics.totalClicks) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4">Top Locations</h3>
              <div className="space-y-3">
                {analytics?.locationStats && Object.entries(analytics.locationStats)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([location, count]) => (
                    <div key={location} className="flex items-center justify-between">
                      <span className="text-gray-300">{location}</span>
                      <span className="text-sm text-gray-400">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
              <div className="space-y-3">
                {analytics?.referrerStats && Object.entries(analytics.referrerStats)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([referrer, count]) => (
                    <div key={referrer} className="flex items-center justify-between">
                      <span className="text-gray-300 truncate">{referrer}</span>
                      <span className="text-sm text-gray-400">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Link Management & Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* Top Performing Links */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4">Top Performing Links</h3>
              <div className="space-y-3">
                {topLinks.length > 0 ? (
                  topLinks.map((link) => (
                    <div key={link.id} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-purple-400">/{link.shortCode}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyToClipboard(`http://localhost:5000/api/tracking/click/${link.shortCode}`)}
                            className="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded transition-colors duration-200"
                            title="Copy affiliate link"
                          >
                            📋 Copy Link
                          </button>
                          <span className="text-sm text-green-400">{formatCurrency(link.revenue)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 truncate mb-2">{link.originalUrl}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{link.clicks} clicks</span>
                        <span>{link.conversions} conversions</span>
                        <span>{link.conversionRate.toFixed(1)}% CVR</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">🔗</div>
                    <p>Create your first link to see performance</p>
                  </div>
                )}
              </div>
            </div>
        </div>

          {/* Recent Transactions */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 text-gray-400">Date</th>
                    <th className="text-left py-3 text-gray-400">Amount</th>
                    <th className="text-left py-3 text-gray-400">Earnings</th>
                    <th className="text-left py-3 text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-700/50">
                        <td className="py-3">{formatDate(transaction.createdAt)}</td>
                        <td className="py-3">{formatCurrency(transaction.amount)}</td>
                        <td className="py-3 text-green-400">{formatCurrency(transaction.earnings)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                            transaction.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">💰</div>
                        <p>No transactions yet. Create links to start earning!</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}