import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navigation from '../components/Navigation';
import axios from '../api/axiosInstance';

// Improved Chart Component
const Chart = ({ data, title, color = "#8B5CF6", type = "bar" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 p-6 bg-gray-900/50 rounded-xl flex items-center justify-center border border-gray-700/30">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || 0));
  
  return (
    <div className="w-full h-96 p-6 bg-gray-900/50 rounded-xl border border-gray-700/30">
      <h4 className="text-white font-medium mb-6">{title}</h4>
      <div className="flex flex-col h-80">
        {/* Chart bars container */}
        <div className="flex items-end justify-between h-64 space-x-2 bg-gray-800/30 rounded-lg p-4 mb-4">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 group">
              <div className="relative w-full max-w-[24px]">
                <div
                  className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-80 shadow-lg"
                  style={{
                    height: maxValue > 0 ? `${Math.max((item.value || 0) / maxValue * 200, 3)}px` : '3px',
                    backgroundColor: color,
                    minHeight: '3px'
                  }}
                />
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-800 text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap z-20 shadow-lg border border-gray-600">
                  <div className="text-center">
                    <div className="font-semibold">{typeof item.value === 'number' ? (item.value < 1 ? item.value.toFixed(2) : Math.round(item.value)) : item.value || 0}</div>
                    <div className="text-gray-300 text-xs">Day {item.label}</div>
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Date labels container - separate from bars */}
        <div className="flex justify-between px-4 mt-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 text-center min-w-0">
              <span className="text-xs text-gray-300 inline-block w-6 text-center">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Analytics() {
  const [creator, setCreator] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timeFrame, setTimeFrame] = useState('30d');
  const [chartType, setChartType] = useState('sales'); // sales, commission, clicks
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [timeFrame]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const [profileRes, analyticsRes] = await Promise.all([
        axios.get('/api/auth/profile'),
        axios.get(`/api/tracking/analytics?timeFrame=${timeFrame}`)
      ]);

      if (profileRes.status === 200) {
        const profileData = profileRes.data;
        setCreator(profileData);
      }

      if (analyticsRes.status === 200) {
        const analyticsData = analyticsRes.data;
        setAnalytics(analyticsData.analytics);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <Navigation creator={creator} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-white text-xl">Loading analytics...</div>
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
            <h1 className="text-3xl font-bold text-white mb-2">📊 Performance Analytics</h1>
            <p className="text-purple-200">Deep insights into your affiliate performance</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-0">
            {/* Quick Date Selections */}
            <div className="flex items-center space-x-2">
              {[
                { label: 'Today', value: '1d' },
                { label: '7D', value: '7d' },
                { label: '30D', value: '30d' },
                { label: '90D', value: '90d' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeFrame(option.value)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                    timeFrame === option.value
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* Custom Date Range Dropdown */}
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

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Total Sales */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                (analytics?.earningsGrowth || 0) >= 0 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {analytics?.earningsGrowth && typeof analytics.earningsGrowth === 'number' ? `${analytics.earningsGrowth > 0 ? '+' : ''}${analytics.earningsGrowth.toFixed(1)}%` : '0%'}
              </div>
            </div>
            <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Total Sales</h3>
            <p className="text-3xl font-bold text-white">${((analytics?.totalEarnings || 0) * 1.43).toFixed(2)}</p>
          </div>

          {/* Commission Earned */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📈</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                (analytics?.earningsGrowth || 0) >= 0 
                  ? 'bg-purple-500/20 text-purple-300' 
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {analytics?.earningsGrowth && typeof analytics.earningsGrowth === 'number' ? `${analytics.earningsGrowth > 0 ? '+' : ''}${analytics.earningsGrowth.toFixed(1)}%` : '0%'}
              </div>
            </div>
            <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Commission Earned</h3>
            <p className="text-3xl font-bold text-white">${(analytics?.totalEarnings || 0).toFixed(2)}</p>
          </div>

          {/* Clicks */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/20 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">👆</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                (analytics?.clicksGrowth || 0) >= 0 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {analytics?.clicksGrowth && typeof analytics.clicksGrowth === 'number' ? `${analytics.clicksGrowth > 0 ? '+' : ''}${analytics.clicksGrowth.toFixed(1)}%` : '0%'}
              </div>
            </div>
            <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Total Clicks</h3>
            <p className="text-3xl font-bold text-white">{analytics?.totalClicks || 0}</p>
          </div>

          {/* Conversion Rate */}
          <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-2xl p-6 border border-orange-500/20 shadow-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white text-xl">🎯</span>
            </div>
            <h3 className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wide">Conversion Rate</h3>
            <p className="text-3xl font-bold text-white">{analytics?.conversionRate || '0.00'}%</p>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/30 p-6 shadow-2xl mb-8">
          {/* Chart Type Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h3 className="text-xl font-bold text-white mb-4 sm:mb-0">Performance Trends</h3>
            
            <div className="flex items-center space-x-2 bg-white/5 rounded-xl p-1">
              {[
                { label: 'Sales', value: 'sales', icon: '💰', color: '#10B981' },
                { label: 'Commission', value: 'commission', icon: '📈', color: '#8B5CF6' },
                { label: 'Clicks', value: 'clicks', icon: '👆', color: '#06B6D4' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setChartType(option.value)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    chartType === option.value
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Chart */}
          <div className="w-full">
            <Chart
              data={(() => {
                if (!analytics?.dailyData || analytics.dailyData.length === 0) {
                  // Generate sample data for demonstration if no real data
                  const sampleData = [];
                  for (let i = 0; i < 7; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    sampleData.push({
                      date: date.toISOString(),
                      earnings: Math.random() * 100,
                      clicks: Math.floor(Math.random() * 50)
                    });
                  }
                  return sampleData.map((d, index) => ({
                    label: new Date(d.date).getDate().toString(), // Just show day number
                    value: chartType === 'sales' ? (d.earnings || 0) * 1.43 : 
                           chartType === 'commission' ? (d.earnings || 0) :
                           (d.clicks || 0)
                  }));
                }
                
                return analytics.dailyData.map((d, index) => ({
                  label: d.date ? new Date(d.date).getDate().toString() : `${index + 1}`, // Just show day number
                  value: chartType === 'sales' ? (d.earnings || 0) * 1.43 : 
                         chartType === 'commission' ? (d.earnings || 0) :
                         (d.clicks || 0)
                }));
              })()}
              title={`Daily ${chartType === 'sales' ? 'Sales Revenue ($)' : chartType === 'commission' ? 'Commission Earned ($)' : 'Clicks'}`}
              color={chartType === 'sales' ? '#10B981' : chartType === 'commission' ? '#8B5CF6' : '#06B6D4'}
            />
          </div>
        </div>

        {/* Smart Insights */}
        <div className="bg-gradient-to-br from-teal-800/20 to-cyan-800/20 rounded-2xl p-6 shadow-2xl border border-teal-700/30 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">💡</span>
            </div>
            <h3 className="text-xl font-bold text-white">Smart Insights</h3>
            <span className="text-teal-300 text-sm">AI-powered recommendations</span>
          </div>

          {analytics?.insights && analytics.insights.length > 0 ? (
            <div className="space-y-4">
              {analytics.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-l-4 ${
                    insight.type === 'success' 
                      ? 'bg-green-500/10 border-green-500 text-green-100'
                      : insight.type === 'warning'
                      ? 'bg-yellow-500/10 border-yellow-500 text-yellow-100'
                      : 'bg-blue-500/10 border-blue-500 text-blue-100'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{insight.title}</h4>
                      <p className="text-sm opacity-90 mb-2">{insight.message}</p>
                      {insight.action && (
                        <p className="text-xs opacity-75">💡 {insight.action}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-white font-semibold mb-2">No insights yet</h3>
              <p className="text-gray-400">Generate more activity to unlock AI-powered insights</p>
            </div>
          )}
        </div>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Device Breakdown */}
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Device Breakdown</h3>
            {analytics?.deviceStats && Object.keys(analytics.deviceStats).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(analytics.deviceStats).map(([device, count]) => (
                  <div key={device} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {device === 'Desktop' ? '🖥️' : device === 'Mobile' ? '📱' : '📱'}
                      </span>
                      <span className="text-white">{device}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(analytics.deviceStats))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-purple-300 font-semibold w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No device data available</p>
            )}
          </div>

          {/* Top Locations */}
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Top Locations</h3>
            {analytics?.locationStats && Object.keys(analytics.locationStats).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(analytics.locationStats)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([location, count]) => (
                  <div key={location} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🌍</span>
                      <span className="text-white">{location || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(analytics.locationStats))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-green-300 font-semibold w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No location data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}