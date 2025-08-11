import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navigation from '../components/Navigation';
import axios from '../api/axiosInstance';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export default function DashboardOverview() {
  const [creator, setCreator] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productUrl, setProductUrl] = useState('');
  const [availableBrands, setAvailableBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [generatedLinks, setGeneratedLinks] = useState([]);
  const [generatingLink, setGeneratingLink] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
    fetchAvailableBrands();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const [profileRes, analyticsRes] = await Promise.all([
        axios.get('/auth/profile'),
        axios.get('/tracking/analytics?timeFrame=30d')
      ]);

      if (profileRes.status === 200) {
        const profileData = profileRes.data;
        setCreator(profileData);
      }

      if (analyticsRes.status === 200) {
        const analyticsData = analyticsRes.data;
        setAnalytics(analyticsData.analytics);
        // Get recent transactions (last 5)
        setRecentTransactions(analyticsData.recentTransactions?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBrands = async () => {
    setBrandsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/links/campaigns');

      if (response.status === 200) {
        const data = response.data;
        // Extract brand names from campaigns
        const brands = data.campaigns?.map(campaign => campaign.Name) || ['Walmart'];
        setAvailableBrands(brands);
      } else {
        // Fallback to Walmart if API fails
        setAvailableBrands(['Walmart']);
      }
    } catch (error) {
      console.error('Error fetching available brands:', error);
      // Fallback to Walmart if API fails
      setAvailableBrands(['Walmart']);
    } finally {
      setBrandsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const copyToClipboard = async (text) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success('✅ Link copied to clipboard!');
      } else {
        // Fallback: create temporary input and copy
        const tempInput = document.createElement('input');
        tempInput.value = text;
        tempInput.style.position = 'fixed';
        tempInput.style.left = '-999999px';
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        toast.success('✅ Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      // Always fallback to text selection
      const tempInput = document.createElement('input');
      tempInput.value = text;
      tempInput.style.position = 'fixed';
      tempInput.style.left = '-999999px';
      document.body.appendChild(tempInput);
      tempInput.select();
      document.body.removeChild(tempInput);
      toast.info('Text selected! Copy manually or use your device\'s share menu.');
    }
  };

  const generateLink = async () => {
    if (!productUrl.trim()) {
      toast.error('Please enter a product URL');
      return;
    }

    setGeneratingLink(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/links', {
        originalUrl: productUrl.trim(),
        // brand is not needed by backend, it uses the default program
      });

      if (response.status === 200 || response.status === 201) {
        const data = response.data;
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const trackingUrl = `${baseUrl}/api/tracking/click/${data.shortCode}`;
        
        // Add to generated links list
        const newLink = {
          id: Date.now(),
          shortCode: data.shortCode,
          trackingUrl: trackingUrl,
          originalUrl: productUrl.trim(),
          createdAt: new Date().toISOString(),
          brand: 'Walmart' // Default brand
        };
        
        setGeneratedLinks(prev => [newLink, ...prev]);
        toast.success('🎉 Link generated successfully!');
        setProductUrl('');
        
        // Show success banner
        const successBanner = document.createElement('div');
        successBanner.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2';
        successBanner.innerHTML = `
          <span class="text-white text-lg">✅</span>
          <span class="font-medium">Link Created!</span>
        `;
        document.body.appendChild(successBanner);
        
        // Remove banner after 3 seconds
        setTimeout(() => {
          if (successBanner.parentNode) {
            successBanner.parentNode.removeChild(successBanner);
          }
        }, 3000);
        
        // Refresh data to show new link in stats
        fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to generate link');
      }
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error('Failed to generate link');
    } finally {
      setGeneratingLink(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <Navigation creator={creator} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-white text-xl">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <Navigation creator={creator} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome back, {creator?.name || 'Creator'}! 👋
          </h2>
          <p className="text-purple-200 text-sm sm:text-base">
            Generate your affiliate links and track your earnings
          </p>
        </div>

        {/* Link Generator - TOP PRIORITY */}
        <div className="mb-8 bg-gradient-to-br from-purple-800/30 to-blue-800/30 backdrop-blur-xl rounded-2xl border border-purple-700/50 p-4 sm:p-6 lg:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white text-2xl">🔗</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Affiliate Link Generator</h3>
              <p className="text-purple-200 text-sm sm:text-base">Create your commission-earning links instantly</p>
            </div>
          </div>

          {/* Available Brands */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wide">Available Brands</h4>
            <div className="flex flex-wrap gap-2">
              {brandsLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full"></div>
                  <span className="text-sm text-white/60">Loading brands...</span>
                </div>
              ) : availableBrands.length > 0 ? (
                availableBrands.map((brand, index) => (
                  <span key={index} className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/80 border border-white/20">
                    {brand}
                  </span>
                ))
              ) : (
                <span className="text-sm text-white/60">No brands available</span>
              )}
            </div>
          </div>

          {/* Link Generation Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Product URL
              </label>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <input
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://walmart.com/product-url"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                  onKeyPress={(e) => e.key === 'Enter' && generateLink()}
                />
                <button
                  onClick={generateLink}
                  disabled={generatingLink}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:scale-105 disabled:hover:scale-100 whitespace-nowrap flex items-center justify-center space-x-2"
                >
                  {generatingLink ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Generate Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-white/60 break-words">
              💡 Tip: Paste any product URL from supported retailers and we'll create your affiliate link automatically
            </p>
          </div>

          {/* Generated Links Display */}
          {generatedLinks.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <h4 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wide">Recently Generated Links</h4>
              <div className="space-y-3">
                {generatedLinks.slice(0, 5).map((link) => (
                  <div key={link.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-purple-300 text-sm font-medium">{link.brand}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">{formatDate(link.createdAt)}</span>
                        </div>
                        <p className="text-white text-sm font-mono break-all mb-2">{link.trackingUrl}</p>
                        <p className="text-gray-400 text-xs truncate">{link.originalUrl}</p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={() => copyToClipboard(link.trackingUrl)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 min-h-[44px] w-full sm:w-auto touch-manipulation shadow-lg hover:scale-105"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          🔗 Copy link
                        </button>
                        <button
                          onClick={() => copyToClipboard(link.shortCode)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors duration-300 min-h-[44px] w-full sm:w-auto touch-manipulation"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          📋 Short Link
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {generatedLinks.length > 5 && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-400">
                    Showing 5 of {generatedLinks.length} generated links
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          
          {/* Total Earnings */}
          <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-6 shadow-2xl group hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">💰</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  (analytics?.earningsGrowth || 0) >= 0 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {analytics?.earningsGrowth && typeof analytics.earningsGrowth === 'number' ? `${analytics.earningsGrowth > 0 ? '+' : ''}${analytics.earningsGrowth.toFixed(1)}%` : '0%'}
                </div>
              </div>
              <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Total Earnings</h3>
              <p className="text-2xl font-bold text-white">{formatCurrency(analytics?.totalEarnings)}</p>
              <p className="text-xs text-green-300 mt-1">💎 Commissionable sales only</p>
            </div>
          </div>

          {/* Total Clicks */}
          <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-6 shadow-2xl group hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">👆</span>
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
              <p className="text-2xl font-bold text-white">{analytics?.totalClicks || 0}</p>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-6 shadow-2xl group hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📈</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Conversion Rate</h3>
              <p className="text-2xl font-bold text-white">{analytics?.conversionRate || '0.00'}%</p>
            </div>
          </div>

          {/* Active Links */}
          <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-6 shadow-2xl group hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🔗</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Active Links</h3>
              <p className="text-2xl font-bold text-white">{analytics?.linksCreated || 0}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 mb-8 max-w-lg mx-auto">
          
          {/* Analytics Link */}
          <div className="bg-gradient-to-br from-blue-800/20 to-cyan-800/20 rounded-2xl p-4 sm:p-6 shadow-2xl border border-blue-700/30">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
              <h3 className="text-xl font-bold text-white">View Analytics</h3>
            </div>
            <p className="text-gray-300 mb-4">Deep dive into your performance data</p>
            <button
              onClick={() => navigate('/analytics')}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:scale-105"
            >
              View Analytics
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        {recentTransactions.length > 0 && (
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Recent Activity</h3>
              <button
                onClick={() => navigate('/earnings')}
                className="text-purple-300 hover:text-white transition-colors duration-300"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {recentTransactions.map((transaction, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10 space-y-2 sm:space-y-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate">{formatCurrency(transaction.amount)}</p>
                    <p className="text-gray-400 text-sm">{formatDate(transaction.createdAt)}</p>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:text-right sm:items-end">
                    <p className="text-green-400 font-medium">{formatCurrency(transaction.earnings)}</p>
                    <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                      transaction.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                      transaction.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
