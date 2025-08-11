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
        // The backend returns { creator: { ... } }
        setCreator(profileData.creator || profileData);
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

                {/* Welcome Section */}
        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <span className="text-white text-3xl">🔗</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Your Affiliate Links</h2>
          <p className="text-purple-200 text-lg">Track performance and manage your commission-earning links</p>
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
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">📊</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Your Links Performance</h3>
              <p className="text-purple-200 text-sm">Track clicks, sales, and revenue from your affiliate links</p>
            </div>
          </div>
          
          {topLinks.length > 0 ? (
            <div className="space-y-4">
              {topLinks.map((link, index) => (
                <div key={index} className="p-6 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 group">
                  <div className="flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white text-lg font-bold">#{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate max-w-xs mb-2 text-lg">
                          {link.originalUrl ? link.originalUrl.split('/').pop()?.substring(0, 30) + '...' : 'Product Link'}
                        </p>
                        <p className="text-blue-300 text-sm font-mono break-all mb-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          🔗 {`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tracking/click/${link.shortCode}`}
                        </p>
                        <p className="text-purple-300 text-xs font-mono mb-1">
                          Short Code: /{link.shortCode}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Created {formatDate(link.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
                      <div className="grid grid-cols-3 gap-6 w-full lg:w-auto">
                        <div className="text-center p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                          <p className="text-blue-300 font-bold text-lg">{link.clicks || 0}</p>
                          <p className="text-blue-200 text-xs">Clicks</p>
                        </div>
                        <div className="text-center p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                          <p className="text-green-300 font-bold text-lg">{link.conversions || 0}</p>
                          <p className="text-green-200 text-xs">Sales</p>
                        </div>
                        <div className="text-center p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                          <p className="text-purple-300 font-bold text-lg">
                            ${(link.revenue || 0).toFixed(2)}
                          </p>
                          <p className="text-purple-200 text-xs">Revenue</p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(link.shortCode)}
                        onTouchStart={() => copyToClipboard(link.shortCode)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 min-h-[48px] w-full lg:w-auto touch-manipulation shadow-lg hover:scale-105 group-hover:shadow-xl"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        🔗 Copy link
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
                <span className="text-purple-300 text-4xl">🔗</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-3">No links created yet</h3>
              <p className="text-gray-300 mb-6 text-lg">Create your first affiliate link on the home page to start earning</p>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                <span className="text-purple-300">💡</span>
                <span className="text-purple-200 text-sm">Go to Dashboard to create links</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}