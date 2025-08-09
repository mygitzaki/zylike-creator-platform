import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    twitter: ''
  });
  const [errors, setErrors] = useState({});

  // Fetch onboarding status on component mount
  useEffect(() => {
    fetchOnboardingStatus();
  }, []);

  const fetchOnboardingStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/onboarding/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingData(data);
        
        // Pre-fill form with existing data
        const creator = data.creator;
        setFormData({
          name: creator.name || '',
          bio: creator.bio || '',
          instagram: creator.socialInstagram || '',
          tiktok: creator.socialTiktok || '',
          youtube: creator.socialYoutube || '',
          twitter: creator.socialTwitter || ''
        });

        // If already onboarded, redirect to dashboard
        if (creator.isOnboarded) {
          navigate('/');
        }
      } else {
        console.error('Failed to fetch onboarding status');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
      navigate('/login');
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

  const updateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/onboarding/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio
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

  const updateSocialMedia = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/onboarding/social', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instagram: formData.instagram,
          tiktok: formData.tiktok,
          youtube: formData.youtube,
          twitter: formData.twitter
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

  const completeOnboarding = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/onboarding/complete', {
        method: 'POST',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      // Step 1: Update Profile
      const profileResult = await updateProfile();
      if (!profileResult.success) {
        setErrors({ profile: profileResult.error });
        setSubmitting(false);
        return;
      }

      // Step 2: Update Social Media (optional)
      const socialResult = await updateSocialMedia();
      if (!socialResult.success) {
        setErrors({ social: socialResult.error });
        setSubmitting(false);
        return;
      }

      // Step 3: Complete Onboarding
      const completionResult = await completeOnboarding();
      if (!completionResult.success) {
        setErrors({ completion: completionResult.error });
        setSubmitting(false);
        return;
      }

      // Success! Redirect to dashboard
      navigate('/', { 
        state: { 
          message: 'Welcome to Zylike! Your onboarding is complete.' 
        }
      });

    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
      setSubmitting(false);
    }
  };

  const handleSkipOnboarding = async () => {
    setSubmitting(true);
    const result = await completeOnboarding();
    
    if (result.success) {
      navigate('/', { 
        state: { 
          message: 'Welcome to Zylike!' 
        }
      });
    } else {
      setErrors({ general: result.error });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to Zylike! 🚀</h1>
          <p className="text-gray-300 text-lg">Let's set up your creator profile</p>
          
          {onboardingData && (
            <div className="mt-4 bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Progress</span>
                <span>{onboardingData.creator.onboardingStep + 1} of {onboardingData.creator.totalSteps}</span>
              </div>
              <div className="mt-2 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((onboardingData.creator.onboardingStep + 1) / onboardingData.creator.totalSteps) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Onboarding Form */}
        <div className="bg-gray-800 rounded-xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Section */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                Profile Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="Enter your display name"
                    required
                  />
                  {errors.profile && (
                    <p className="text-red-400 text-sm mt-1">{errors.profile}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    Bio (Optional)
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Tell your audience about yourself..."
                    maxLength="500"
                  />
                  <p className="text-gray-500 text-sm mt-1">{formData.bio.length}/500 characters</p>
                </div>
              </div>
            </div>

            {/* Social Media Section */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                Social Media (Optional)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-medium mb-2 flex items-center">
                    <span className="text-pink-400 mr-2">📸</span>
                    Instagram
                  </label>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-pink-500 focus:outline-none"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-2 flex items-center">
                    <span className="text-black mr-2">🎵</span>
                    TikTok
                  </label>
                  <input
                    type="text"
                    name="tiktok"
                    value={formData.tiktok}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-black focus:outline-none"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-2 flex items-center">
                    <span className="text-red-500 mr-2">🎥</span>
                    YouTube
                  </label>
                  <input
                    type="text"
                    name="youtube"
                    value={formData.youtube}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
                    placeholder="Channel name or @handle"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-2 flex items-center">
                    <span className="text-blue-400 mr-2">🐦</span>
                    Twitter/X
                  </label>
                  <input
                    type="text"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                    placeholder="@username"
                  />
                </div>
              </div>
              
              {errors.social && (
                <p className="text-red-400 text-sm mt-2">{errors.social}</p>
              )}
            </div>

            {/* Error Messages */}
            {errors.general && (
              <div className="bg-red-900 border border-red-500 rounded-lg p-4">
                <p className="text-red-200">{errors.general}</p>
              </div>
            )}

            {errors.completion && (
              <div className="bg-red-900 border border-red-500 rounded-lg p-4">
                <p className="text-red-200">{errors.completion}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting || !formData.name.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 text-lg"
              >
                {submitting ? 'Setting up...' : 'Complete Setup ✨'}
              </button>
              
              <button
                type="button"
                onClick={handleSkipOnboarding}
                disabled={submitting}
                className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {submitting ? 'Skipping...' : 'Skip for now'}
              </button>
            </div>
          </form>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">🎉 What you get with Zylike:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="text-white">
              <div className="text-2xl mb-2">💰</div>
              <div className="font-medium">High Commissions</div>
              <div className="text-sm text-gray-300">Up to 70% on every sale</div>
            </div>
            <div className="text-white">
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-medium">Easy Link Creation</div>
              <div className="text-sm text-gray-300">Generate links in seconds</div>
            </div>
            <div className="text-white">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium">Real-time Analytics</div>
              <div className="text-sm text-gray-300">Track your performance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
