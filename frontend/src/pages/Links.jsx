import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navigation from '../components/Navigation';
import axios from '../api/axiosInstance';

export default function Links() {
  const [creator, setCreator] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [topLinks, setTopLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [generatedLink, setGeneratedLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const [profileRes, analyticsRes, campaignsRes] = await Promise.all([
        axios.get('/auth/profile'),
        axios.get('/tracking/analytics?timeFrame=30d'),
        axios.get('/links/campaigns')
      ]);

      if (profileRes.status === 200) {
        const profileData = profileRes.data;
        setCreator(profileData);
      }

      if (analyticsRes.status === 200) {
        const analyticsData = analyticsRes.data;
        setTopLinks(analyticsData.topLinks || []);
      }

      if (campaignsRes.status === 200) {
        const campaignsData = campaignsRes.data;
        setCampaigns(campaignsData.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load links data');
    } finally {
      setLoading(false);
    }
  };

  const generateLink = async () => {
    if (!newLink.trim()) {
      toast.error('Please enter a product URL');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/links', {
        originalUrl: newLink
      });

      const data = await response.json();
      if (response.ok) {
        setGeneratedLink(data.shortUrl);
        setNewLink('');
        toast.success('Link generated successfully!');
        // Refresh top links
        fetchData();
      } else {
        toast.error(data.error || 'Failed to generate link');
      }
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error('Failed to generate link');
    }
  };

  const copyToClipboard = (text) => {
    // Use the tracking URL format instead of the frontend URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const trackingUrl = `${baseUrl}/api/tracking/click/${text}`;
    
    navigator.clipboard.writeText(trackingUrl).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <Navigation creator={creator} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-white text-xl">Loading links...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <Navigation creator={creator} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔗 Affiliate Links</h1>
          <p className="text-purple-200">Create and manage your affiliate links</p>
        </div>

        {/* Create New Link Section */}
        <div className="bg-gradient-to-br from-purple-800/20 to-blue-800/20 rounded-2xl p-6 lg:p-8 shadow-2xl border border-purple-700/30 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">🔗</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Create Affiliate Link</h2>
          </div>

          {/* Available Brands */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Available Brands:</h3>
            <div className="flex flex-wrap gap-3">
              {campaigns.map((campaign, index) => (
                <div key={index} className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                  <span className="text-purple-300 text-sm font-medium">{campaign}</span>
                </div>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">
                Product URL
              </label>
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Paste product URL here (e.g., https://walmart.com/..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            
            <button
              onClick={generateLink}
              disabled={!newLink.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:scale-105 disabled:hover:scale-100"
            >
              ✨ Generate Link
            </button>
          </div>

          {/* Generated Link Display */}
          {generatedLink && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-green-300 font-medium mb-1">✅ Link Generated Successfully!</p>
                  <p className="text-gray-300 text-sm break-all">
                    {import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tracking/click/{generatedLink}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedLink)}
                  className="ml-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-300"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Referral Link Section */}
        <div className="bg-gradient-to-br from-blue-800/20 to-indigo-800/20 rounded-2xl p-6 shadow-2xl border border-blue-700/30 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">👥</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Referral Link</h3>
                <p className="text-blue-200 text-sm">Share & earn together</p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(`http://localhost:5173/signup?ref=${creator?.id || 'dacf'}`)}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300"
            >
              Copy Link
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-gray-300 text-sm break-all">
              http://localhost:5173/signup?ref={creator?.id || 'dacf'}
            </p>
          </div>
          
          <div className="mt-4 flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-blue-300">✓</span>
              <span className="text-gray-300">Invite creators</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-300">✓</span>
              <span className="text-gray-300">Grow community</span>
            </div>
          </div>
        </div>

        {/* Top Performing Links */}
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6">Your Links Performance</h3>
          
          {topLinks.length > 0 ? (
            <div className="space-y-4">
              {topLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm font-bold">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium truncate max-w-xs">
                        {link.originalUrl || 'Product Link'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Created {formatDate(link.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-blue-300 font-semibold">{link.clicks || 0}</p>
                      <p className="text-gray-400 text-xs">Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-green-300 font-semibold">{link.conversions || 0}</p>
                      <p className="text-gray-400 text-xs">Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-purple-300 font-semibold">
                        ${(link.revenue || 0).toFixed(2)}
                      </p>
                      <p className="text-gray-400 text-xs">Revenue</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(link.shortCode)}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-300"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-300 text-2xl">🔗</span>
              </div>
              <h3 className="text-white font-semibold mb-2">No links created yet</h3>
              <p className="text-gray-400 mb-6">Create your first affiliate link to start earning</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}