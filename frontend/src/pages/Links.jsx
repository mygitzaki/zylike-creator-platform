import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navigation from '../components/Navigation';
import axios from '../api/axiosInstance';
import mobileDebug from '../utils/mobileDebug';
import iphoneFix from '../utils/iphoneFix';

export default function Links() {
  const [creator, setCreator] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [topLinks, setTopLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [generatedLink, setGeneratedLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // iPhone-specific refs
  const urlInputRef = useRef(null);
  const generateButtonRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Mobile debugging
    if (mobileDebug.isMobile()) {
      console.log('📱 Mobile device detected - running mobile diagnostics...');
      mobileDebug.logAllInfo();
    }
    
    // iPhone-specific setup
    if (iphoneFix.isIPhone()) {
      console.log('📱 iPhone detected - setting up iPhone-specific optimizations...');
      
      // Setup iPhone-specific elements after DOM is ready
      setTimeout(() => {
        if (urlInputRef.current) {
          iphoneFix.setupIPhoneInput(urlInputRef.current);
        }
        if (generateButtonRef.current) {
          iphoneFix.setupIPhoneButton(generateButtonRef.current, generateLink);
        }
      }, 100);
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

    console.log('🚀 Mobile: Starting link generation...');
    console.log('📱 Mobile: URL input:', newLink);
    console.log('📱 Mobile: Token present:', !!localStorage.getItem('token'));
    
    // iPhone-specific debugging
    if (iphoneFix.isIPhone()) {
      console.log('📱 iPhone: Device detected in generateLink function');
      console.log('📱 iPhone: User Agent:', navigator.userAgent);
      console.log('📱 iPhone: Network status:', navigator.onLine);
      console.log('📱 iPhone: Secure context:', window.isSecureContext);
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found. Please log in again.');
        return;
      }

      console.log('📱 Mobile: Making API request...');
      const response = await axios.post('/links', {
        originalUrl: newLink
      });

      console.log('📱 Mobile: API response received:', response.status);
      console.log('📱 Mobile: Response data:', response.data);

      if (response.status === 200) {
        const data = response.data;
        if (data.shortCode) {
          setGeneratedLink(data.shortCode);
          setNewLink('');
          toast.success('Link generated successfully!');
          console.log('📱 Mobile: Link generated successfully:', data.shortCode);
          // Refresh top links
          fetchData();
        } else {
          console.error('📱 Mobile: No shortCode in response:', data);
          toast.error('Link generated but no tracking code received');
        }
      } else {
        console.error('📱 Mobile: API error status:', response.status);
        toast.error('Failed to generate link');
      }
    } catch (error) {
      console.error('📱 Mobile: Error generating link:', error);
      console.error('📱 Mobile: Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // iPhone-specific error handling
      const errorMessage = iphoneFix.handleIPhoneError(error, 'link generation');
      toast.error(errorMessage);
    }
  };

  const copyToClipboard = async (text) => {
    // Use the tracking URL format instead of the frontend URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const trackingUrl = `${baseUrl}/api/tracking/click/${text}`;
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(trackingUrl);
        toast.success('✅ Link copied to clipboard!');
      } else {
        // Fallback: create temporary input and copy
        const tempInput = document.createElement('input');
        tempInput.value = trackingUrl;
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
      tempInput.value = trackingUrl;
      tempInput.style.position = 'fixed';
      tempInput.style.left = '-999999px';
      document.body.appendChild(tempInput);
      tempInput.select();
      document.body.removeChild(tempInput);
      toast.info('Text selected! Copy manually or use your device\'s share menu.');
    }
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
                  <span className="text-purple-300 text-sm font-medium">{campaign.Name || campaign.name || 'Campaign'}</span>
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
                ref={urlInputRef}
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Paste product URL here (e.g., https://walmart.com/..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                autoComplete="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                inputMode="url"
              />
            </div>
            
            <button
              ref={generateButtonRef}
              onClick={generateLink}
              onTouchStart={generateLink}
              disabled={!newLink.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:scale-105 disabled:hover:scale-100 active:scale-95 touch-manipulation min-h-[56px]"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              ✨ Generate Link
            </button>
          </div>

          {/* Generated Link Display */}
          {generatedLink && (
            <div className="mt-6 p-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-400 text-2xl">✅</span>
                </div>
                <h3 className="text-green-300 font-bold text-lg mb-1">Link Generated Successfully!</h3>
                <p className="text-gray-300 text-sm">Your affiliate tracking link is ready to use</p>
              </div>
              
              {/* Generated Link - Easy to Copy */}
              <div className="bg-black/30 border border-green-500/30 rounded-lg p-4 mb-4">
                <label className="block text-green-300 font-medium mb-2 text-sm">Your Tracking Link:</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    value={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tracking/click/${generatedLink}`}
                    readOnly
                    className="flex-1 bg-white/10 border border-green-500/30 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer min-h-[44px]"
                    onClick={(e) => {
                      e.target.select();
                      // iPhone-friendly text selection
                      if (iphoneFix.isIPhone()) {
                        e.target.setSelectionRange(0, e.target.value.length);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    style={{ 
                      WebkitUserSelect: 'text',
                      userSelect: 'text',
                      cursor: 'text'
                    }}
                  />
                                          <button
                          onClick={() => copyToClipboard(generatedLink)}
                          onTouchStart={() => copyToClipboard(generatedLink)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 min-h-[44px] w-full sm:w-auto sm:min-w-[80px] touch-manipulation text-sm font-medium shadow-lg hover:scale-105"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          🔗 Copy link
                        </button>
                </div>
              </div>
              
              {/* Link Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 mb-1">Short Link:</p>
                  <p className="text-white font-mono">{generatedLink}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 mb-1">Original URL:</p>
                  <p className="text-white truncate">{newLink}</p>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm">
                  💡 <strong>How to use:</strong> Tap the "Copy link" button to copy your affiliate link to clipboard. 
                  All clicks and sales will be tracked under your account.
                </p>
                
                {/* iPhone-specific instructions */}
                {iphoneFix.isIPhone() && (
                  <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded">
                    <p className="text-green-300 text-xs">
                      ✅ <strong>iPhone Optimized:</strong> The "Copy link" button works on all iOS devices. 
                      If clipboard access fails, text will be selected for manual copying.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Referral Link Section */}
        <div className="bg-gradient-to-br from-blue-800/20 to-indigo-800/20 rounded-2xl p-6 shadow-2xl border border-blue-700/30 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
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
              onClick={() => {
                const refLink = `http://localhost:5173/signup?ref=${creator?.id || 'dacf'}`;
                // Create temporary input for easy copying
                const tempInput = document.createElement('input');
                tempInput.value = refLink;
                tempInput.style.position = 'fixed';
                tempInput.style.left = '-999999px';
                document.body.appendChild(tempInput);
                tempInput.select();
                document.body.removeChild(tempInput);
                toast.success('Referral link selected! Copy manually or use iOS share menu.');
              }}
              onTouchStart={() => {
                const refLink = `http://localhost:5173/signup?ref=${creator?.id || 'dacf'}`;
                // Create temporary input for easy copying
                const tempInput = document.createElement('input');
                tempInput.value = refLink;
                tempInput.style.position = 'fixed';
                tempInput.style.left = '-999999px';
                document.body.appendChild(tempInput);
                tempInput.select();
                document.body.removeChild(tempInput);
                toast.success('Referral link selected! Copy manually or use iOS share menu.');
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 min-h-[44px] w-full sm:w-auto sm:min-w-[100px] touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Select Link
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
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate max-w-xs mb-1">
                        {link.originalUrl ? link.originalUrl.split('/').pop()?.substring(0, 30) + '...' : 'Product Link'}
                      </p>
                      <p className="text-purple-300 text-sm font-mono break-all">
                        /{link.shortCode}
                      </p>
                      <p className="text-gray-400 text-xs">
                        Created {formatDate(link.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                    <div className="grid grid-cols-3 gap-4 w-full sm:w-auto">
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
                    </div>
                    <button
                      onClick={() => copyToClipboard(link.shortCode)}
                      onTouchStart={() => copyToClipboard(link.shortCode)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 min-h-[44px] w-full sm:w-auto sm:min-w-[80px] touch-manipulation shadow-lg hover:scale-105"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      🔗 Copy link
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