import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';

const BonusTracker = () => {
  const [bonusData, setBonusData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBonusData();
  }, []);

  const fetchBonusData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.get('/bonus/tracker');

      if (response.status === 200) {
        const data = response.data;
        setBonusData(data.bonusTracker);
      }
    } catch (error) {
      console.error('Error fetching bonus data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      0: 'text-gray-400',
      1: 'text-green-400',
      2: 'text-blue-400',
      3: 'text-purple-400',
      4: 'text-yellow-400'
    };
    return colors[tier] || 'text-gray-400';
  };

  const getTierBadgeColor = (tier) => {
    const colors = {
      0: 'bg-gray-500/20 text-gray-400',
      1: 'bg-green-500/20 text-green-400',
      2: 'bg-blue-500/20 text-blue-400',
      3: 'bg-purple-500/20 text-purple-400',
      4: 'bg-yellow-500/20 text-yellow-400'
    };
    return colors[tier] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
        <div className="text-white text-center">Loading bonus tracker...</div>
      </div>
    );
  }

  if (!bonusData) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
        <div className="text-white text-center">Unable to load bonus tracker</div>
      </div>
    );
  }

  const { tierInfo } = bonusData;
  const nextTier = tierInfo.next;
  const amountToNext = nextTier ? nextTier.threshold - bonusData.currentPeriodSales : 0;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          🎁 Bonus Tracker
        </h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-sm font-medium">Live</span>
        </div>
        <div className="text-right">
          <div className="text-gray-400 text-sm">Payout on</div>
          <div className="text-white font-semibold">{formatDate(bonusData.nextPayoutDate)}</div>
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-8">
        {bonusData.currentTier === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-2">No Bonus Earned</h3>
            <p className="text-gray-400 mb-4">
              You have not made any <span className="text-purple-400 font-semibold">commissionable product sales</span> yet. 
              Earn {formatCurrency(5000)} in commissionable sales to unlock your first bonus tier.
            </p>
            <p className="text-xs text-gray-500 mb-2">
              💡 Your dashboard only shows qualifying commissionable sales
            </p>
            <p className="text-xs text-green-300">
              💎 All earnings displayed count towards bonus tiers
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-green-400 mb-2">
              {formatCurrency(bonusData.currentTierBonus)} Bonus Earned!
            </h3>
            <p className="text-gray-400">
              You've achieved Tier {bonusData.currentTier} with {formatCurrency(bonusData.currentPeriodSales)} in commissionable sales
            </p>
          </div>
        )}
      </div>

      {/* Tier Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-purple-300">Current Progress</span>
          <span className="text-purple-300">
            {nextTier ? `${tierInfo.progressToNext}% to next tier` : 'Max tier reached!'}
          </span>
        </div>
        
        {nextTier && (
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${tierInfo.progressToNext}%` }}
            ></div>
          </div>
        )}

        {nextTier ? (
          <div className="text-center">
            <p className="text-gray-300 text-sm">
              Earn <span className="text-purple-400 font-semibold">{formatCurrency(amountToNext)}</span> more to unlock 
              <span className="text-green-400 font-semibold"> {formatCurrency(nextTier.bonus)} bonus</span>
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-yellow-400 text-sm font-semibold">
              🏆 Maximum tier achieved! Keep earning to maintain your status.
            </p>
          </div>
        )}
      </div>

      {/* Tier Structure */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {tierInfo.allTiers.slice(1).map((tier) => {
          const isCurrentTier = tier.tier === bonusData.currentTier;
          const isAchieved = bonusData.currentPeriodSales >= tier.threshold;
          
          return (
            <div
              key={tier.tier}
              className={`text-center p-4 rounded-xl border transition-all duration-300 ${
                isCurrentTier 
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/40' 
                  : isAchieved
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="text-sm text-gray-400 mb-1">Tier {tier.tier}</div>
              <div className="text-lg font-bold text-white mb-1">{formatCurrency(tier.threshold)}</div>
              <div className={`text-sm font-semibold ${getTierColor(tier.tier)}`}>
                {formatCurrency(tier.bonus)} bonus
              </div>
              {isCurrentTier && (
                <div className="mt-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                    Current
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="text-yellow-400 text-xl">⚠️</div>
          <div>
            <h4 className="text-yellow-200 font-semibold mb-2">Important: Non-Cumulative Bonuses</h4>
            <p className="text-yellow-300 text-sm leading-relaxed">
              Your dashboard shows <strong>only commissionable sales</strong> that count towards bonuses. 
              Bonuses are <strong>not cumulative</strong> - you only receive the bonus for the highest tier you achieve in each payout period. 
              For example, if you reach Tier 3 ({formatCurrency(20000)} in sales), you receive the {formatCurrency(200)} bonus only, 
              not the bonuses from Tier 1 and Tier 2.
            </p>
          </div>
        </div>
      </div>

      {/* View All Tiers Button */}
      <div className="mt-6 text-center">
        <button className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors duration-200">
          View All Tiers →
        </button>
      </div>
    </div>
  );
};

export default BonusTracker;
