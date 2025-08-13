import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const ApplicationPending = () => {
  const navigate = useNavigate();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicationStatus();
  }, [fetchApplicationStatus]);

  const fetchApplicationStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/creator/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplicationData(data.creator);
      } else {
        navigate('/login');
      }
    } catch (error) {
        console.error('Error fetching application status:', error);
        navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: '⏳',
          title: 'Application Submitted',
          message: 'Your creator application has been submitted and is awaiting review.',
          color: 'yellow'
        };
      case 'UNDER_REVIEW':
        return {
          icon: '👀',
          title: 'Under Review',
          message: 'Our team is currently reviewing your application.',
          color: 'blue'
        };
      case 'CHANGES_REQUESTED':
        return {
          icon: '✏️',
          title: 'Changes Requested',
          message: 'Please update your application based on our feedback.',
          color: 'orange'
        };
      case 'REJECTED':
        return {
          icon: '❌',
          title: 'Application Rejected',
          message: 'Unfortunately, your application was not approved at this time.',
          color: 'red'
        };
      default:
        return {
          icon: '📝',
          title: 'Application Status',
          message: 'Please complete your application.',
          color: 'gray'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!applicationData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Application not found</div>
      </div>
    );
  }

  const statusInfo = getStatusDisplay(applicationData.applicationStatus);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{statusInfo.icon}</div>
          <h1 className="text-3xl font-bold text-white mb-2">{statusInfo.title}</h1>
          <p className="text-gray-400 text-lg">{statusInfo.message}</p>
        </div>

        {/* Status Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 mb-6">
          <div className="space-y-6">
            {/* Application Details */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Application Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{applicationData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white">{applicationData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusInfo.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-300' :
                    statusInfo.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                    statusInfo.color === 'orange' ? 'bg-orange-500/20 text-orange-300' :
                    statusInfo.color === 'red' ? 'bg-red-500/20 text-red-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {applicationData.applicationStatus.replace('_', ' ')}
                  </span>
                </div>
                {applicationData.submittedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Submitted:</span>
                    <span className="text-white">{new Date(applicationData.submittedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media Connected */}
            {(applicationData.socialInstagram || applicationData.socialTiktok || applicationData.socialTwitter || applicationData.socialYoutube || applicationData.socialFacebook) && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Connected Accounts</h3>
                <div className="flex flex-wrap gap-2">
                  {applicationData.socialInstagram && (
                    <span className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-xs">
                      📷 @{applicationData.socialInstagram}
                    </span>
                  )}
                  {applicationData.socialTiktok && (
                    <span className="bg-black/20 text-white px-3 py-1 rounded-full text-xs">
                      🎵 @{applicationData.socialTiktok}
                    </span>
                  )}
                  {applicationData.socialTwitter && (
                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs">
                      🐦 @{applicationData.socialTwitter}
                    </span>
                  )}
                  {applicationData.socialYoutube && (
                    <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs">
                      📺 {applicationData.socialYoutube}
                    </span>
                  )}
                  {applicationData.socialFacebook && (
                    <span className="bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-xs">
                      👥 {applicationData.socialFacebook}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Rejection Reason */}
            {applicationData.applicationStatus === 'REJECTED' && applicationData.rejectionReason && (
              <div>
                <h3 className="text-lg font-semibold text-red-300 mb-2">Rejection Reason</h3>
                <p className="text-gray-300 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  {applicationData.rejectionReason}
                </p>
              </div>
            )}

            {/* Review Notes */}
            {applicationData.reviewNotes && (
              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-2">Review Notes</h3>
                <p className="text-gray-300 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  {applicationData.reviewNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">What happens next?</h3>
          
          {applicationData.applicationStatus === 'PENDING' && (
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start">
                <span className="text-yellow-400 mr-3 mt-1">1.</span>
                <span>Our team will review your application within 1-3 business days</span>
              </div>
              <div className="flex items-start">
                <span className="text-yellow-400 mr-3 mt-1">2.</span>
                <span>We'll verify your social media accounts and content quality</span>
              </div>
              <div className="flex items-start">
                <span className="text-yellow-400 mr-3 mt-1">3.</span>
                <span>You'll receive an email notification with our decision</span>
              </div>
              <div className="flex items-start">
                <span className="text-yellow-400 mr-3 mt-1">4.</span>
                <span>If approved, you'll gain access to the creator dashboard</span>
              </div>
            </div>
          )}

          {applicationData.applicationStatus === 'UNDER_REVIEW' && (
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start">
                <span className="text-blue-400 mr-3 mt-1">•</span>
                <span>Your application is currently being reviewed by our team</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-400 mr-3 mt-1">•</span>
                <span>We may contact you for additional information if needed</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-400 mr-3 mt-1">•</span>
                <span>You'll receive an update within the next 24-48 hours</span>
              </div>
            </div>
          )}

          {applicationData.applicationStatus === 'CHANGES_REQUESTED' && (
            <div className="space-y-3">
              <p className="text-orange-300">Please review the feedback above and update your application accordingly.</p>
              <button
                onClick={() => navigate('/application')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Update Application
              </button>
            </div>
          )}

          {applicationData.applicationStatus === 'REJECTED' && (
            <div className="space-y-3 text-gray-300">
              <p>You may create a new account and reapply in the future if your circumstances change.</p>
              <div className="text-sm text-gray-400">
                Common reasons for rejection include insufficient follower count, inappropriate content, or incomplete applications.
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          {applicationData.applicationStatus === 'CHANGES_REQUESTED' && (
            <button
              onClick={() => navigate('/application')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              📝 Update Application
            </button>
          )}
          
          <button
            onClick={handleLogout}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            🚪 Logout
          </button>
        </div>

        {/* Support */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Questions about your application? Contact us at{' '}
            <a href="mailto:support@zylike.com" className="text-blue-400 hover:text-blue-300">
              support@zylike.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationPending;
