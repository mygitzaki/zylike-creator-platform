import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navigation from '../components/Navigation';

export default function Payments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState(null);
  const [paymentAccount, setPaymentAccount] = useState(null);
  const [payoutStatus, setPayoutStatus] = useState(null);
  const [tipaltiLoading, setTipaltiLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchPaymentData();
  }, [navigate]);

  const fetchPaymentData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const [profileRes, accountRes, payoutStatusRes] = await Promise.all([
        fetch('http://localhost:5000/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/payments/account', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/payouts/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setCreator(profileData);
      }

      if (accountRes.ok) {
        const accountData = await accountRes.json();
        setPaymentAccount(accountData.paymentAccount);
      }

      if (payoutStatusRes.ok) {
        const statusData = await payoutStatusRes.json();
        setPayoutStatus(statusData.status);
      }

    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handleTipaltiOnboarding = async () => {
    setTipaltiLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:5000/api/payments/tipalti/onboard', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else {
        toast.error(data.message || 'Failed to start onboarding process');
      }
    } catch (error) {
      console.error('Error starting Tipalti onboarding:', error);
      toast.error('Failed to connect to payment system');
    } finally {
      setTipaltiLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading payment information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <Navigation creator={creator} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Payment Center</h1>
          <p className="text-purple-200 text-sm sm:text-base">Secure payments powered by Tipalti</p>
        </div>

        {/* Conservative Payment Policy */}
        <div className="bg-gradient-to-r from-blue-800/20 to-purple-800/20 rounded-2xl p-6 mb-8 border border-blue-700/30">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🏦</span>
            </div>
            <h2 className="text-xl font-bold text-white">Payment Schedule</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-blue-400">15 Days</div>
              <div className="text-sm text-gray-300">Minimum eligibility</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-purple-400">45 Days</div>
              <div className="text-sm text-gray-300">Maximum hold period</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-green-400">15th & 30th</div>
              <div className="text-sm text-gray-300">Payment dates</div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="font-semibold text-white mb-2">How it works:</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• <strong>Day 0:</strong> You earn a commission from a sale</li>
              <li>• <strong>Day 15:</strong> Eligible for next payout (if you meet $25 minimum)</li>
              <li>• <strong>Day 45:</strong> Automatically included in next payout (regardless of minimum)</li>
              <li>• <strong>15th & 30th:</strong> Scheduled payout dates every month</li>
            </ul>
          </div>
          
          {payoutStatus && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl border border-green-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div>
                  <p className="text-green-300 font-medium">Next Payout: {formatDate(payoutStatus.nextPayoutDate)}</p>
                  <p className="text-sm text-gray-300">
                    {payoutStatus.willGetPaidNext ? 
                      `You'll receive ${formatCurrency(payoutStatus.eligibleAmount)} in the next payout` :
                      `You need ${formatCurrency(Math.max(0, payoutStatus.minimumPayout - payoutStatus.eligibleAmount))} more to reach the $25 minimum`
                    }
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  payoutStatus.willGetPaidNext 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {payoutStatus.willGetPaidNext ? 'Scheduled' : 'Pending'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Setup */}
        <div className="bg-gradient-to-br from-purple-800/20 to-blue-800/20 rounded-2xl p-6 mb-8 border border-purple-700/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🔒</span>
              </div>
              <h2 className="text-xl font-bold text-white">Payment Setup</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              paymentAccount?.isVerified 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {paymentAccount?.isVerified ? 'Verified' : 'Setup Required'}
            </div>
          </div>
          
          <p className="text-purple-200 mb-6">
            Complete your secure payment setup with Tipalti to receive payouts. All tax and compliance requirements are handled automatically.
          </p>
          
          <button
            onClick={handleTipaltiOnboarding}
            disabled={tipaltiLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:scale-105 disabled:scale-100"
          >
            {tipaltiLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Connecting...
              </div>
            ) : paymentAccount?.isVerified ? (
              '⚙️ Update Payment Settings'
            ) : (
              '🚀 Start Secure Setup with Tipalti'
            )}
          </button>
        </div>

        {/* Earnings Status */}
        {payoutStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🔒</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Locked Earnings</h3>
              <p className="text-2xl font-bold text-white">{formatCurrency(payoutStatus.lockedAmount || 0)}</p>
              <p className="text-xs text-orange-300 mt-1">Still in hold period</p>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">⏳</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Ready for Payout</h3>
              <p className="text-2xl font-bold text-white">{formatCurrency(payoutStatus.eligibleAmount || 0)}</p>
              <p className="text-xs text-yellow-300 mt-1">Meets eligibility criteria</p>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">⏸️</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Pending Payouts</h3>
              <p className="text-2xl font-bold text-white">{formatCurrency(payoutStatus.pendingAmount || 0)}</p>
              <p className="text-xs text-blue-300 mt-1">Being processed</p>
            </div>
          </div>
        )}

        {/* Recent Earnings */}
        {payoutStatus?.earnings?.eligible?.length > 0 && (
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl mb-8">
            <h3 className="text-xl font-bold text-white mb-6">Recent Earnings</h3>
            <div className="space-y-3">
              {payoutStatus.earnings.eligible.slice(0, 5).map((earning, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white/5 rounded-xl border border-white/10 space-y-2 sm:space-y-0">
                  <div>
                    <p className="text-white font-medium">{formatCurrency(earning.netAmount)}</p>
                    <p className="text-gray-400 text-sm">Earned {formatDate(earning.earnedAt)}</p>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:text-right sm:items-end">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      earning.status === 'LOCKED' ? 'bg-orange-500/20 text-orange-400' :
                      earning.status === 'ELIGIBLE' ? 'bg-yellow-500/20 text-yellow-400' :
                      earning.status === 'PENDING_PAYOUT' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {earning.status === 'LOCKED' ? 'Locked' :
                       earning.status === 'ELIGIBLE' ? 'Ready' :
                       earning.status === 'PENDING_PAYOUT' ? 'Processing' : 'Paid'}
                    </div>
                    {earning.lockedUntil && new Date(earning.lockedUntil) > new Date() && (
                      <p className="text-xs text-gray-500 mt-1">
                        Unlocks {formatDate(earning.lockedUntil)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Payouts */}
        {payoutStatus?.payouts?.completed?.length > 0 && (
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Payout History</h3>
            <div className="space-y-3">
              {payoutStatus.payouts.completed.map((payout, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white/5 rounded-xl border border-white/10 space-y-2 sm:space-y-0">
                  <div>
                    <p className="text-white font-medium">{formatCurrency(payout.totalAmount)}</p>
                    <p className="text-gray-400 text-sm">Completed {formatDate(payout.completedAt)}</p>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:text-right sm:items-end">
                    <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                      Completed
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {payout.paymentMethod}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!payoutStatus?.earnings?.eligible?.length && !payoutStatus?.payouts?.completed?.length) && (
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-white mb-2">No Earnings Yet</h3>
            <p className="text-gray-400 mb-6">Start creating affiliate links and promoting products to earn commissions!</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:scale-105"
            >
              Start Earning
            </button>
          </div>
        )}
      </div>
    </div>
  );
}