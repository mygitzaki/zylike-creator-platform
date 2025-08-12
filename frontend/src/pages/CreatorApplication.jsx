import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';

// Social Media Input Component
const SocialMediaInput = ({ platform, icon, color, placeholder, value, onChange, required = false }) => {
  const colorClasses = {
    pink: 'border-pink-500 focus:border-pink-400',
    gray: 'border-gray-500 focus:border-gray-400', 
    blue: 'border-blue-500 focus:border-blue-400',
    red: 'border-red-500 focus:border-red-400',
    green: 'border-green-500 focus:border-green-400',
    purple: 'border-purple-500 focus:border-purple-400'
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        <span className="flex items-center">
          <span className="text-lg mr-2">{icon}</span>
          {platform}
          {required && <span className="text-red-400 ml-1">*</span>}
        </span>
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-gray-800 border-2 rounded-lg text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50 ${colorClasses[color]} focus:ring-${color}-400`}
      />
      {value && (
        <p className="text-xs text-green-400 mt-1">✓ {platform} link added</p>
      )}
    </div>
  );
};

// Optional Platform Card Component
const OptionalPlatformCard = ({ platform, icon, color, value, placeholder, onChange }) => {
  const colorClasses = {
    blue: 'border-blue-500/30 focus:border-blue-500',
    gray: 'border-gray-500/30 focus:border-gray-500',
    red: 'border-red-500/30 focus:border-red-500',
    purple: 'border-purple-500/30 focus:border-purple-500',
    orange: 'border-orange-500/30 focus:border-orange-500',
    green: 'border-green-500/30 focus:border-green-500',
    yellow: 'border-yellow-500/30 focus:border-yellow-500'
  };

  return (
    <div>
      <label className="block text-gray-300 font-medium mb-2 flex items-center">
        <span className="mr-2">{icon}</span>
        {platform}
      </label>
      <input
        type={platform.includes('Website') || platform.includes('URL') ? 'url' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-all duration-200 ${colorClasses[color]}`}
        placeholder={placeholder}
      />
    </div>
  );
};

const CreatorApplication = () => {
  const navigate = useNavigate();
  console.log('🚀 CreatorApplication component loaded - v3 (SIMPLIFIED INPUTS)');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applicationData, setApplicationData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data state
  const [formData, setFormData] = useState({
    // Profile
    name: '',
    bio: '',
    
    // Required social platforms
    instagram: '',
    tiktok: '',
    twitter: '',
    youtube: '',
    facebook: '',
    
    // Optional platforms
    facebookGroups: '',
    personalWebsite: '',
    linkedinProfile: '',
    pinterestProfile: '',
    twitchChannel: '',
    blogUrl: '',
    shopUrl: '',
    otherPlatforms: ''
  });
  
  const [errors, setErrors] = useState({});

  // Fetch application status on component mount
  useEffect(() => {
    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      console.log('🔍 CreatorApplication: Fetching application status...');
      const response = await axios.get('/creator/profile');

      if (response.status === 200) {
        const data = response.data;
        setApplicationData(data);
        setCurrentStep(data.creator.onboardingStep);
        
        // Pre-fill form with existing data
        const creator = data.creator;
        setFormData({
          name: creator.name || '',
          bio: creator.bio || '',
          instagram: creator.socialInstagram || '',
          tiktok: creator.socialTiktok || '',
          twitter: creator.socialTwitter || '',
          youtube: creator.socialYoutube || '',
          facebook: creator.socialFacebook || '',
          facebookGroups: creator.facebookGroups || '',
          personalWebsite: creator.personalWebsite || '',
          linkedinProfile: creator.linkedinProfile || '',
          pinterestProfile: creator.pinterestProfile || '',
          twitchChannel: creator.twitchChannel || '',
          blogUrl: creator.blogUrl || '',
          shopUrl: creator.shopUrl || '',
          otherPlatforms: creator.otherPlatforms || ''
        });

        // Handle different application states
        if (creator.applicationStatus === 'APPROVED') {
          navigate('/dashboard');
        }
      } else {
        console.error('Failed to fetch application status');
        // Instead of redirecting to login, just continue with empty data
        console.log('🔄 Continuing with new application...');
      }
    } catch (error) {
      console.log('🔄 Application status not found - starting new application...');
      // This is expected for new users, just continue with empty data
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Social Media Input Handlers  
  const handleSocialInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear any errors for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Legacy OAuth handler (will be removed)
  const handleSocialConnect = async (platform) => {
    try {
      // Map platform names to formData keys
      const platformMappings = {
        instagram: 'socialInstagram',
        tiktok: 'socialTiktok', 
        twitter: 'socialTwitter',
        youtube: 'socialYoutube',
        facebook: 'socialFacebook'
      };
      
      const fieldName = platformMappings[platform] || platform;
      
      // Try OAuth first, fall back to manual input if it fails
      console.log(`🔗 Attempting OAuth for ${platform}...`);
      
      // FUTURE OAUTH IMPLEMENTATION - Get OAuth URL from backend
      try {
        const response = await axios.get(`/oauth/url/${platform}`);
        
        if (response.status === 200) {
          const { url } = response.data;
          
          // Open OAuth popup to the actual social platform
          const popup = window.open(
            url,
            'oauth',
            'width=500,height=600,scrollbars=yes,resizable=yes'
          );
          
          // Listen for OAuth callback
          const messageHandler = (event) => {
            if (event.origin === window.location.origin && event.data.type === 'oauth_success') {
              // Extract username from OAuth response (this would come from the platform)
              const username = event.data.username || `${platform}_user_${Date.now()}`;
              
              setFormData(prev => ({
                ...prev,
                [fieldName]: username
              }));
              
              // Clear any errors for this field
              if (errors[fieldName]) {
                setErrors(prev => ({
                  ...prev,
                  [fieldName]: ''
                }));
              }
              
              popup.close();
              window.removeEventListener('message', messageHandler);
              console.log(`Connected ${platform}: ${username}`);
            } else if (event.data.type === 'oauth_error') {
              console.error('OAuth error:', event.data.error);
              popup.close();
              window.removeEventListener('message', messageHandler);
              
              // Fallback to manual input if OAuth fails
              handleManualConnect(platform, fieldName);
            }
          };
          
          window.addEventListener('message', messageHandler);
          
          // Handle popup being closed manually (user cancelled)
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              window.removeEventListener('message', messageHandler);
              console.log(`OAuth cancelled for ${platform}`);
            }
          }, 1000);
          
        } else {
          console.error('Failed to get OAuth URL, falling back to manual input');
          handleManualConnect(platform, fieldName);
        }
      } catch (error) {
        console.error('OAuth request failed, falling back to manual input:', error);
        handleManualConnect(platform, fieldName);
      }
      
    } catch (error) {
      console.error('Social connect error:', error);
    }
  };

  // Fallback manual connect method
  const handleManualConnect = (platform, fieldName) => {
    const platformMessages = {
      facebook: 'Enter your Facebook Page name/URL or handle (without @):',
      instagram: 'Enter your Instagram username (without @):',
      tiktok: 'Enter your TikTok username (without @):',
      twitter: 'Enter your Twitter/X username (without @):',
      youtube: 'Enter your YouTube channel name or handle:'
    };
    
    const message = platformMessages[platform] || `Enter your ${platform} username/handle (without @):`;
    const username = prompt(message);
    
    if (username && username.trim()) {
      const cleanUsername = username.replace('@', '').trim();
      
      setFormData(prev => ({
        ...prev,
        [fieldName]: cleanUsername
      }));
      
      // Clear any errors for this field
      if (errors[fieldName]) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: ''
        }));
      }
      
      console.log(`Manually connected ${platform}: ${cleanUsername}`);
    }
  };

  const handleSocialDisconnect = (platform) => {
    // Map platform names to formData keys
    const platformMappings = {
      instagram: 'socialInstagram',
      tiktok: 'socialTiktok', 
      twitter: 'socialTwitter',
      youtube: 'socialYoutube',
      facebook: 'socialFacebook'
    };
    
    const fieldName = platformMappings[platform] || platform;
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  };

  const updateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
              const response = await axios.put('/creator/profile', {
        name: formData.name,
        bio: formData.bio
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const updateRequiredSocial = async () => {
    try {
      const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/creator/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instagram: formData.instagram,
          tiktok: formData.tiktok,
          twitter: formData.twitter,
          youtube: formData.youtube,
          facebook: formData.facebook
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const updateOptionalPlatforms = async () => {
    try {
      const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/creator/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          facebookGroups: formData.facebookGroups,
          personalWebsite: formData.personalWebsite,
          linkedinProfile: formData.linkedinProfile,
          pinterestProfile: formData.pinterestProfile,
          twitchChannel: formData.twitchChannel,
          blogUrl: formData.blogUrl,
          shopUrl: formData.shopUrl,
          otherPlatforms: formData.otherPlatforms
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const submitApplication = async () => {
    try {
      const token = localStorage.getItem('token');
                          const response = await fetch('http://localhost:5000/api/creator/profile', {
            method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const handleNext = async () => {
    setSubmitting(true);
    setErrors({});

    try {
      // Basic client-side validation for each step
      if (currentStep === 1) {
        if (!formData.name.trim()) {
          setErrors({ general: 'Display name is required' });
          setSubmitting(false);
          return;
        }
        if (!formData.bio.trim() || formData.bio.length < 20) {
          setErrors({ general: 'Bio must be at least 20 characters' });
          setSubmitting(false);
          return;
        }
      }
      
      // Validate social media (at least one required)
      if (currentStep === 2) {
        const socialFields = ['instagram', 'tiktok', 'twitter', 'youtube', 'facebook'];
        const hasSocialMedia = socialFields.some(field => formData[field]?.trim());
        
        if (!hasSocialMedia) {
          setErrors({ general: 'Please add at least one social media account to continue' });
          setSubmitting(false);
          return;
        }
      }
      
      // Handle final submission (step 5)
      if (currentStep === 5) {
        console.log('🚀 Submitting final application...');
        
        try {
          const submissionData = {
            bio: formData.bio,
            socialMediaLinks: {
              instagram: formData.instagram || '',
              tiktok: formData.tiktok || '',
              twitter: formData.twitter || '',
              youtube: formData.youtube || '',
              facebook: formData.facebook || ''
            },
            groupLinks: {
              facebookGroups: formData.facebookGroups || '',
              personalWebsite: formData.personalWebsite || '',
              linkedinProfile: formData.linkedinProfile || '',
              pinterestProfile: formData.pinterestProfile || '',
              twitchChannel: formData.twitchChannel || '',
              blogUrl: formData.blogUrl || '',
              shopUrl: formData.shopUrl || '',
              otherPlatforms: formData.otherPlatforms || ''
            }
          };
          
          // Update profile instead of creating new account
          const response = await axios.put('/creator/profile', submissionData);
          
          if (response.status === 200) {
            console.log('✅ Application submitted successfully!');
            // Move to success step
            setCurrentStep(prev => prev + 1);
            // Refresh application status
            await fetchApplicationStatus();
          } else {
            setErrors({ general: 'Failed to submit application. Please try again.' });
          }
        } catch (error) {
          console.error('Application submission error:', error);
          if (error.response?.data?.error) {
            setErrors({ general: error.response.data.error });
          } else {
            setErrors({ general: 'Failed to submit application. Please try again.' });
          }
        }
      } else {
        // Move to next step for review steps
        console.log('🔄 Moving to step', currentStep + 1);
        setCurrentStep(prev => prev + 1);
      }
      
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show pending/review state
  if (applicationData?.creator.applicationStatus === 'UNDER_REVIEW') {
    return (
      <div className="min-h-screen bg-gray-900 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-8">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-3xl font-bold text-white mb-4">Application Under Review</h1>
            <p className="text-gray-300 text-lg mb-6">
              Thank you for applying to become a Zylike Creator! Our team is reviewing your application.
            </p>
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-white font-semibold mb-2">What happens next?</h3>
              <ul className="text-gray-300 text-left space-y-2">
                <li>• Our team reviews your social media presence</li>
                <li>• We verify your content quality and engagement</li>
                <li>• You'll receive an email with our decision within 2-3 business days</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show rejection state
  if (applicationData?.creator.applicationStatus === 'REJECTED') {
    return (
      <div className="min-h-screen bg-gray-900 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-red-900 to-pink-900 rounded-xl p-8">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold text-white mb-4">Application Not Approved</h1>
            <p className="text-gray-300 text-lg mb-6">
              Unfortunately, your application to become a Zylike Creator was not approved at this time.
            </p>
            {applicationData?.creator.rejectionReason && (
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h3 className="text-white font-semibold mb-2">Reason:</h3>
                <p className="text-gray-300">{applicationData.creator.rejectionReason}</p>
              </div>
            )}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-white font-semibold mb-2">You can try again by:</h3>
              <ul className="text-gray-300 text-left space-y-2">
                <li>• Growing your social media following</li>
                <li>• Creating more engaging content</li>
                <li>• Reapplying in 30 days</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Count connected platforms for display
  const requiredSocialCount = [
    formData.instagram,
    formData.tiktok,
    formData.twitter,
    formData.youtube,
    formData.facebook
  ].filter(Boolean).length;

  const optionalPlatformsCount = [
    formData.facebookGroups,
    formData.personalWebsite,
    formData.linkedinProfile,
    formData.pinterestProfile,
    formData.twitchChannel,
    formData.blogUrl,
    formData.shopUrl,
    formData.otherPlatforms
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Zylike Creator Application 🚀
          </h1>
          <p className="text-gray-300 text-lg">
            Join our exclusive community of successful creators
          </p>
          
          {applicationData && (
            <div className="mt-6 bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>Step {currentStep + 1} of {applicationData.steps.length}</span>
              </div>
              <div className="bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${((currentStep + 1) / applicationData.steps.length) * 100}%` 
                  }}
                ></div>
              </div>
              <p className="text-gray-300 mt-2">
                {applicationData.steps[currentStep]?.description}
              </p>
            </div>
          )}
        </div>

        {/* Application Form */}
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          
          {/* Step 1: Profile Information */}
          {currentStep === 1 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="bg-purple-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold mr-4">1</span>
                Tell Us About Yourself
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                    placeholder="Enter your display name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    Creator Bio * (minimum 20 characters)
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                    placeholder="Tell us about yourself, your content, and why you want to be a Zylike creator..."
                    maxLength="500"
                    required
                  />
                  <div className="flex justify-between text-sm mt-2">
                    <span className={formData.bio.length < 20 ? 'text-red-400' : 'text-green-400'}>
                      {formData.bio.length < 20 ? `${20 - formData.bio.length} more characters needed` : 'Bio length looks good!'}
                    </span>
                    <span className="text-gray-500">{formData.bio.length}/500</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Required Social Platforms */}
          {currentStep === 2 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold mr-4">2</span>
                Your Social Media Presence
              </h2>
              
              <div className="mb-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 font-medium">
                  📱 Add at least ONE social media account to continue
                </p>
                <p className="text-blue-200 text-sm mt-1">
                  Enter your username, handle, or profile link for each platform
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SocialMediaInput
                  platform="Instagram"
                  icon="📸"
                  color="pink"
                  placeholder="@username or instagram.com/username"
                  value={formData.instagram}
                  onChange={(e) => handleSocialInputChange('instagram', e.target.value)}
                />

                <SocialMediaInput
                  platform="TikTok"
                  icon="🎵"
                  color="gray"
                  placeholder="@username or tiktok.com/@username"
                  value={formData.tiktok}
                  onChange={(e) => handleSocialInputChange('tiktok', e.target.value)}
                />

                <SocialMediaInput
                  platform="Twitter/X"
                  icon="🐦"
                  color="blue"
                  placeholder="@username or x.com/username"
                  value={formData.twitter}
                  onChange={(e) => handleSocialInputChange('twitter', e.target.value)}
                />

                <SocialMediaInput
                  platform="YouTube"
                  icon="🎥"
                  color="red"
                  placeholder="@channelname or youtube.com/@channel"
                  value={formData.youtube}
                  onChange={(e) => handleSocialInputChange('youtube', e.target.value)}
                />

                <div className="md:col-span-2">
                  <SocialMediaInput
                    platform="Facebook Page"
                    icon="📘"
                    color="blue"
                    placeholder="facebook.com/yourpage or page name"
                    value={formData.facebook}
                    onChange={(e) => handleSocialInputChange('facebook', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-300 text-sm">
                  💡 <strong>Tip:</strong> You can enter just your username (without @) or paste the full URL. 
                  We'll verify these during the review process.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Optional Platforms */}
          {currentStep === 3 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold mr-4">3</span>
                Additional Platforms (Optional)
              </h2>
              
              <div className="mb-6 bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-300 font-medium">
                  ✨ Add more platforms to strengthen your application
                </p>
                <p className="text-green-200 text-sm mt-1">
                  Currently added: {optionalPlatformsCount} additional platform{optionalPlatformsCount !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OptionalPlatformCard
                  platform="Facebook Groups"
                  icon="👥"
                  color="blue"
                  value={formData.facebookGroups}
                  placeholder="Groups you manage"
                  onChange={(value) => setFormData(prev => ({ ...prev, facebookGroups: value }))}
                />

                <OptionalPlatformCard
                  platform="Personal Website"
                  icon="🌐"
                  color="gray"
                  value={formData.personalWebsite}
                  placeholder="https://yourwebsite.com"
                  onChange={(value) => setFormData(prev => ({ ...prev, personalWebsite: value }))}
                />

                <OptionalPlatformCard
                  platform="LinkedIn Profile"
                  icon="💼"
                  color="blue"
                  value={formData.linkedinProfile}
                  placeholder="LinkedIn profile URL"
                  onChange={(value) => setFormData(prev => ({ ...prev, linkedinProfile: value }))}
                />

                <OptionalPlatformCard
                  platform="Pinterest Profile"
                  icon="📌"
                  color="red"
                  value={formData.pinterestProfile}
                  placeholder="Pinterest profile URL"
                  onChange={(value) => setFormData(prev => ({ ...prev, pinterestProfile: value }))}
                />

                <OptionalPlatformCard
                  platform="Twitch Channel"
                  icon="🎮"
                  color="purple"
                  value={formData.twitchChannel}
                  placeholder="Twitch channel name"
                  onChange={(value) => setFormData(prev => ({ ...prev, twitchChannel: value }))}
                />

                <OptionalPlatformCard
                  platform="Blog/Medium"
                  icon="📰"
                  color="orange"
                  value={formData.blogUrl}
                  placeholder="Blog or Medium URL"
                  onChange={(value) => setFormData(prev => ({ ...prev, blogUrl: value }))}
                />

                <OptionalPlatformCard
                  platform="Shop/Store"
                  icon="🛍️"
                  color="green"
                  value={formData.shopUrl}
                  placeholder="Etsy, shop, or store URL"
                  onChange={(value) => setFormData(prev => ({ ...prev, shopUrl: value }))}
                />

                <OptionalPlatformCard
                  platform="Other Platforms"
                  icon="⭐"
                  color="yellow"
                  value={formData.otherPlatforms}
                  placeholder="Other platforms or links"
                  onChange={(value) => setFormData(prev => ({ ...prev, otherPlatforms: value }))}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="bg-yellow-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold mr-4">4</span>
                Review Your Application
              </h2>
              
              <div className="space-y-6">
                {/* Profile Review */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center">
                    <span className="text-purple-400 mr-2">👤</span>
                    Profile Information
                  </h3>
                  <div className="space-y-2 text-gray-300">
                    <p><strong>Name:</strong> {formData.name}</p>
                    <p><strong>Bio:</strong> {formData.bio}</p>
                  </div>
                </div>

                {/* Required Social Review */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center">
                    <span className="text-blue-400 mr-2">📱</span>
                    Connected Social Platforms ({requiredSocialCount})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                    {formData.instagram && <p>📸 Instagram: @{formData.instagram}</p>}
                    {formData.tiktok && <p>🎵 TikTok: @{formData.tiktok}</p>}
                    {formData.twitter && <p>🐦 Twitter: @{formData.twitter}</p>}
                    {formData.youtube && <p>🎥 YouTube: {formData.youtube}</p>}
                    {formData.facebook && <p>📘 Facebook: {formData.facebook}</p>}
                  </div>
                  {requiredSocialCount === 0 && (
                    <p className="text-red-400">⚠️ No social platforms connected. Please go back and add at least one.</p>
                  )}
                </div>

                {/* Optional Platforms Review */}
                {optionalPlatformsCount > 0 && (
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <span className="text-green-400 mr-2">✨</span>
                      Additional Platforms ({optionalPlatformsCount})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                      {formData.facebookGroups && <p>👥 Facebook Groups: {formData.facebookGroups}</p>}
                      {formData.personalWebsite && <p>🌐 Website: {formData.personalWebsite}</p>}
                      {formData.linkedinProfile && <p>💼 LinkedIn: {formData.linkedinProfile}</p>}
                      {formData.pinterestProfile && <p>📌 Pinterest: {formData.pinterestProfile}</p>}
                      {formData.twitchChannel && <p>🎮 Twitch: {formData.twitchChannel}</p>}
                      {formData.blogUrl && <p>📰 Blog: {formData.blogUrl}</p>}
                      {formData.shopUrl && <p>🛍️ Shop: {formData.shopUrl}</p>}
                      {formData.otherPlatforms && <p>⭐ Other: {formData.otherPlatforms}</p>}
                    </div>
                  </div>
                )}

                {/* Application Summary */}
                <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-4">📋 Application Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">{formData.bio.length}</div>
                      <div className="text-gray-300">Bio Characters</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{requiredSocialCount}</div>
                      <div className="text-gray-300">Social Platforms</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{optionalPlatformsCount}</div>
                      <div className="text-gray-300">Additional Links</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Submit */}
          {currentStep === 5 && (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center">
                <span className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold mr-4">5</span>
                Ready to Submit
              </h2>
              
              <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-lg p-8 mb-8">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  You're Ready to Become a Zylike Creator!
                </h3>
                <p className="text-gray-300 text-lg mb-6">
                  Your application looks great! Once submitted, our team will review it within 2-3 business days.
                </p>
                
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                  <h4 className="text-white font-semibold mb-4">What happens next?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="text-center">
                      <div className="text-3xl mb-2">📋</div>
                      <div className="font-medium text-white">Review</div>
                      <div className="text-sm text-gray-300">We review your application and social presence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-2">✅</div>
                      <div className="font-medium text-white">Decision</div>
                      <div className="text-sm text-gray-300">You'll receive an email with our decision</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-2">🎉</div>
                      <div className="font-medium text-white">Welcome</div>
                      <div className="text-sm text-gray-300">Start earning with Zylike!</div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-300 font-medium">
                    💡 Tip: Make sure your social media profiles are public and showcase your best content!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Application Submitted */}
          {currentStep === 6 && (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center">
                <span className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold mr-4">✓</span>
                Application Submitted!
              </h2>
              
              <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-lg p-8 mb-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Welcome to Zylike!
                </h3>
                <p className="text-gray-300 text-lg mb-6">
                  Your creator application has been successfully submitted! Our team will review it within 2-3 business days.
                </p>
                
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                  <h4 className="text-white font-semibold mb-4">What's Next?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="text-center">
                      <div className="text-3xl mb-2">📧</div>
                      <div className="font-medium text-white">Email Confirmation</div>
                      <div className="text-sm text-gray-300">Check your inbox for confirmation</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-2">⏰</div>
                      <div className="font-medium text-white">Review Process</div>
                      <div className="text-sm text-gray-300">2-3 business days for approval</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-2">🚀</div>
                      <div className="font-medium text-white">Get Started</div>
                      <div className="text-sm text-gray-300">Start earning once approved!</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 mr-4"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/application/pending')}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
                  >
                    Check Status
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {errors.general && (
            <div className="px-8 pb-4">
              <div className="bg-red-900 border border-red-500 rounded-lg p-4">
                <p className="text-red-200">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep !== 6 && (
            <div className="px-8 pb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevious}
                    disabled={submitting}
                    className="sm:w-auto bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Previous
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  disabled={submitting || (currentStep === 2 && requiredSocialCount === 0) || (currentStep === 1 && (!formData.name.trim() || formData.bio.length < 20))}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 text-lg"
                >
                  {submitting ? (
                    'Processing...'
                  ) : currentStep === 5 ? (
                    '🚀 Submit Application'
                  ) : currentStep < 4 ? (
                    'Next Step'
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">
            🎉 Why Creators Love Zylike
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="text-white">
              <div className="text-3xl mb-2">💰</div>
              <div className="font-medium">High Commissions</div>
              <div className="text-sm text-gray-300">Up to 70% earnings</div>
            </div>
            <div className="text-white">
              <div className="text-3xl mb-2">🚀</div>
              <div className="font-medium">Easy Tools</div>
              <div className="text-sm text-gray-300">Simple link generation</div>
            </div>
            <div className="text-white">
              <div className="text-3xl mb-2">📊</div>
              <div className="font-medium">Analytics</div>
              <div className="text-sm text-gray-300">Real-time tracking</div>
            </div>
            <div className="text-white">
              <div className="text-3xl mb-2">👑</div>
              <div className="font-medium">Exclusive</div>
              <div className="text-sm text-gray-300">Selective community</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorApplication;
