import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = ({ creator }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/earnings', label: 'Earnings', icon: '💰' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/links', label: 'Links', icon: '🔗' },
    { path: '/payments', label: 'Payments', icon: '💳' }
    // Removed Profile Setup - approved creators don't need onboarding
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-purple-900/90 to-blue-900/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Zylike Creator</h1>
              {creator && (
                <p className="text-purple-200 text-sm">Welcome back, {creator.name} ✨</p>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  isActive(item.path)
                    ? 'bg-white/20 text-white shadow-lg scale-105'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="hidden lg:block">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Profile Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300">
                <span className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                  {creator?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
                <span className="hidden lg:block">{creator?.name || 'Profile'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Profile Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-64 bg-gray-800/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-lg font-bold">
                      {creator?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{creator?.name || 'Creator'}</h4>
                      <p className="text-sm text-gray-300">{creator?.email || 'No email'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        (creator?.isActive !== false && creator?.impactSubId) 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {(creator?.isActive !== false && creator?.impactSubId) ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Member Since:</span>
                      <span className="text-white">
                        {creator?.createdAt ? new Date(creator.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </span>
                    </div>
                    {creator?.commissionRate && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Commission:</span>
                        <span className="text-white">{creator.commissionRate}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/payments')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:scale-105"
            >
              💳 Payments
            </button>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:scale-105"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isActive(item.path)
                    ? 'bg-white/20 text-white'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
            
            {/* Mobile Profile Section */}
            <div className="pt-4 border-t border-white/10">
              <div className="p-3 bg-white/5 rounded-lg mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-sm font-bold">
                    {creator?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm">{creator?.name || 'Creator'}</h4>
                    <p className="text-xs text-gray-300">{creator?.email || 'No email'}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      (creator?.isActive !== false && creator?.impactSubId) 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {(creator?.isActive !== false && creator?.impactSubId) ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Member Since:</span>
                    <span className="text-white">
                      {creator?.createdAt ? new Date(creator.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    navigate('/payments');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-medium"
                >
                  💳 Payments
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-3 rounded-xl font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
