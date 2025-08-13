import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navigation from '../components/Navigation';
import axios from '../api/axiosInstance';
import BonusTracker from '../components/BonusTracker';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export default function Earnings() {
  const [creator, setCreator] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [timeFrame, setTimeFrame] = useState('30d');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [timeFrame, fetchData, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, analyticsRes] = await Promise.all([
        axios.get('/auth/profile'),
        axios.get(`/tracking/analytics?timeFrame=${timeFrame}`)
      ]);

      if (profileRes.status === 200) {
        const profileData = profileRes.data;
        // The backend returns { creator: { ... } }
        setCreator(profileData.creator || profileData);
      }

      if (analyticsRes.status === 200) {
        const analyticsData = analyticsRes.data;
        setAnalytics(analyticsData.analytics);
        setRecentTransactions(analyticsData.recentTransactions || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  }, [timeFrame]);

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
          <div className="text-white text-xl">Loading earnings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <Navigation creator={creator} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">💰 Earnings Overview</h1>
            <p className="text-purple-200">Track your commissionable sales and bonuses</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Earnings Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Total Earnings */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl p-6 border border-emerald-500/20 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
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
            <p className="text-3xl font-bold text-white">{formatCurrency(analytics?.totalEarnings)}</p>
            <p className="text-emerald-300 text-sm mt-2">💎 From commissionable sales</p>
          </div>

          {/* Average Order Value */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/20 shadow-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white text-xl">📊</span>
            </div>
            <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Avg Order Value</h3>
            <p className="text-3xl font-bold text-white">{formatCurrency(analytics?.avgOrderValue)}</p>
            <p className="text-blue-300 text-sm mt-2">Per conversion</p>
          </div>

          {/* Total Transactions */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20 shadow-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white text-xl">📈</span>
            </div>
            <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Transactions</h3>
            <p className="text-3xl font-bold text-white">{analytics?.transactionsCount || 0}</p>
            <p className="text-purple-300 text-sm mt-2">Completed sales</p>
          </div>
        </div>

        {/* Bonus Tracker */}
        <div className="mb-8">
          <BonusTracker />
        </div>

        {/* Transaction History */}
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Transaction History</h3>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Latest first</span>
            </div>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm">💰</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Sale Transaction</p>
                      <p className="text-gray-400 text-sm">{formatDate(transaction.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-white font-medium">Sale: {formatCurrency(transaction.amount)}</p>
                      <p className="text-green-400 text-sm">Earned: {formatCurrency(transaction.earnings)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-300 text-2xl">💰</span>
              </div>
              <h3 className="text-white font-semibold mb-2">No transactions yet</h3>
              <p className="text-gray-400 mb-6">Start creating affiliate links to earn commissions</p>
              <button
                onClick={() => navigate('/links')}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:scale-105"
              >
                Create Your First Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}