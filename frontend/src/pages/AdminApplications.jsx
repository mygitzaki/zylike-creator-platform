import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../api/axiosInstance';

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [impactId, setImpactId] = useState('');
  const [impactSubId, setImpactSubId] = useState('');

  useEffect(() => {
    fetchPendingApplications();
  }, []);

  const fetchPendingApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/application/admin/pending');

      if (response.status === 200) {
        const data = response.data;
        setApplications(data.applications || []);
      } else {
        toast.error('Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (creatorId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/application/admin/review/${creatorId}`, {
        action: 'approve',
        reviewNotes: reviewNotes,
        impactId: impactId || undefined,
        impactSubId: impactSubId || undefined
      });

      if (response.status === 200) {
        toast.success('Application approved successfully!');
        setSelectedApplication(null);
        setReviewNotes('');
        setImpactId('');
        setImpactSubId('');
        fetchPendingApplications(); // Refresh the list
      } else {
        toast.error('Failed to approve application');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    }
  };

  const handleRejectApplication = async (creatorId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/application/admin/review/${creatorId}`, {
        action: 'reject',
        rejectionReason: rejectionReason,
        reviewNotes: reviewNotes
      });

      if (response.status === 200) {
        toast.success('Application rejected');
        setSelectedApplication(null);
        setReviewNotes('');
        setRejectionReason('');
        fetchPendingApplications(); // Refresh the list
      } else {
        toast.error('Failed to reject application');
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      UNDER_REVIEW: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      APPROVED: 'bg-green-500/20 text-green-300 border-green-500/30',
      REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30',
      CHANGES_REQUESTED: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    };
    
    return `px-3 py-1 rounded-full text-xs font-medium border ${badges[status] || badges.PENDING}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Creator Applications</h1>
          <p className="text-gray-400">Review and manage creator applications</p>
        </div>

        {applications.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Pending Applications</h3>
            <p className="text-gray-400">All applications have been reviewed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applications List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Pending Applications ({applications.length})
              </h2>
              
              {applications.map((app) => (
                <div
                  key={app.id}
                  className={`bg-gray-800 border rounded-lg p-6 cursor-pointer transition-all duration-200 ${
                    selectedApplication?.id === app.id
                      ? 'border-blue-500 bg-gray-700/50'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedApplication(app)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{app.name}</h3>
                      <p className="text-gray-400">{app.email}</p>
                    </div>
                    <span className={getStatusBadge(app.applicationStatus)}>
                      {app.applicationStatus.replace('_', ' ')}
                    </span>
                  </div>

                  {app.bio && (
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">{app.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {app.socialInstagram && (
                      <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded text-xs">
                        📷 {app.socialInstagram}
                      </span>
                    )}
                    {app.socialTiktok && (
                      <span className="bg-black/20 text-white px-2 py-1 rounded text-xs">
                        🎵 {app.socialTiktok}
                      </span>
                    )}
                    {app.socialTwitter && (
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                        🐦 {app.socialTwitter}
                      </span>
                    )}
                    {app.socialYoutube && (
                      <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs">
                        📺 {app.socialYoutube}
                      </span>
                    )}
                    {app.socialFacebook && (
                      <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs">
                        👥 {app.socialFacebook}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    Applied: {new Date(app.submittedAt || app.createdAt).toLocaleDateString()}
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex gap-2 mt-2">
                    {app.bio && (
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                        📝 {app.bio.length} chars
                      </span>
                    )}
                    {app.socialFacebook && (
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                        👥 Facebook
                      </span>
                    )}
                    {app.facebookGroups && (
                      <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                        🏘️ Groups
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Application Details */}
            <div className="lg:sticky lg:top-6">
              {selectedApplication ? (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Review Application</h2>
                  
                  <div className="space-y-6">
                    {/* Creator Info */}
                    <div>
                      <h3 className="text-lg font-medium text-white mb-3">Creator Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-400">Name:</span> <span className="text-white">{selectedApplication.name}</span></div>
                        <div><span className="text-gray-400">Email:</span> <span className="text-white">{selectedApplication.email}</span></div>
                        {selectedApplication.bio && (
                          <div><span className="text-gray-400">Bio:</span> <span className="text-white">{selectedApplication.bio}</span></div>
                        )}
                      </div>
                    </div>

                    {/* Social Media */}
                    <div>
                      <h3 className="text-lg font-medium text-white mb-3">Social Media Accounts</h3>
                      <div className="space-y-2 text-sm">
                        {selectedApplication.socialInstagram && (
                          <div><span className="text-gray-400">Instagram:</span> <span className="text-pink-300">@{selectedApplication.socialInstagram}</span></div>
                        )}
                        {selectedApplication.socialTiktok && (
                          <div><span className="text-gray-400">TikTok:</span> <span className="text-white">@{selectedApplication.socialTiktok}</span></div>
                        )}
                        {selectedApplication.socialTwitter && (
                          <div><span className="text-gray-400">Twitter:</span> <span className="text-blue-300">@{selectedApplication.socialTwitter}</span></div>
                        )}
                        {selectedApplication.socialYoutube && (
                          <div><span className="text-gray-400">YouTube:</span> <span className="text-red-300">{selectedApplication.socialYoutube}</span></div>
                        )}
                        {selectedApplication.socialFacebook && (
                          <div><span className="text-gray-400">Facebook:</span> <span className="text-blue-300">{selectedApplication.socialFacebook}</span></div>
                        )}
                      </div>
                    </div>

                    {/* Additional Platform Links */}
                    {(selectedApplication.facebookGroups || selectedApplication.twitchChannel || selectedApplication.shopUrl || selectedApplication.pinterestProfile || selectedApplication.blogUrl || selectedApplication.personalWebsite || selectedApplication.linkedinProfile || selectedApplication.otherPlatforms) && (
                      <div>
                        <h3 className="text-lg font-medium text-white mb-3">Additional Platform Links</h3>
                        <div className="space-y-2 text-sm">
                          {selectedApplication.facebookGroups && (
                            <div><span className="text-gray-400">Facebook Groups:</span> <span className="text-blue-300 text-xs break-all">{selectedApplication.facebookGroups}</span></div>
                          )}
                          {selectedApplication.twitchChannel && (
                            <div><span className="text-gray-400">Twitch Channel:</span> <span className="text-purple-300">{selectedApplication.twitchChannel}</span></div>
                          )}
                          {selectedApplication.shopUrl && (
                            <div><span className="text-gray-400">Shop/Store:</span> <span className="text-green-300 text-xs break-all">{selectedApplication.shopUrl}</span></div>
                          )}
                          {selectedApplication.pinterestProfile && (
                            <div><span className="text-gray-400">Pinterest:</span> <span className="text-red-300">{selectedApplication.pinterestProfile}</span></div>
                          )}
                          {selectedApplication.blogUrl && (
                            <div><span className="text-gray-400">Blog/Medium:</span> <span className="text-yellow-300 text-xs break-all">{selectedApplication.blogUrl}</span></div>
                          )}
                          {selectedApplication.personalWebsite && (
                            <div><span className="text-gray-400">Personal Website:</span> <span className="text-blue-300 text-xs break-all">{selectedApplication.personalWebsite}</span></div>
                          )}
                          {selectedApplication.linkedinProfile && (
                            <div><span className="text-gray-400">LinkedIn:</span> <span className="text-blue-300 text-xs break-all">{selectedApplication.linkedinProfile}</span></div>
                          )}
                          {selectedApplication.otherPlatforms && (
                            <div><span className="text-gray-400">Other Platforms:</span> <span className="text-white text-xs break-all">{selectedApplication.otherPlatforms}</span></div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Impact.com ID Override (Optional) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 font-medium mb-2">
                          Impact Program ID (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="16662 (Walmart)"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-600 focus:outline-none"
                          onChange={(e) => setImpactId(e.target.value)}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Leave empty for auto-assignment
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 font-medium mb-2">
                          Impact Sub-Affiliate ID (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="zylike_finalt_123"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-600 focus:outline-none"
                          onChange={(e) => setImpactSubId(e.target.value)}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Leave empty for auto-assignment
                        </div>
                      </div>
                    </div>

                    {/* Review Notes */}
                    <div>
                      <label className="block text-gray-300 font-medium mb-2">
                        Review Notes (Optional)
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-600 focus:outline-none"
                        rows="3"
                        placeholder="Add any notes about this application..."
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleApproveApplication(selectedApplication.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                      >
                        ✅ Approve
                      </button>
                      
                      <button
                        onClick={() => {
                          const reason = prompt('Please provide a reason for rejection:');
                          if (reason) {
                            setRejectionReason(reason);
                            handleRejectApplication(selectedApplication.id);
                          }
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                  <div className="text-6xl mb-4">👈</div>
                  <h3 className="text-lg font-medium text-white mb-2">Select an Application</h3>
                  <p className="text-gray-400">Choose an application from the list to review details and take action.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApplications;
