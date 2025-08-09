import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { toast } from 'react-toastify';

export default function Brands() {
  const [creator, setCreator] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('Name (A-Z)');
  const navigate = useNavigate();

  // Mock brands data
  const brands = [
    {
      id: 1,
      name: "& Other Stories",
      url: "https://www.stories.com/",
      commission: "Up to: 10.5%",
      category: "Apparel",
      logo: "📸",
      color: "bg-gray-800"
    },
    {
      id: 2,
      name: "1-800 Contacts",
      url: "https://www.1800contacts.com/",
      commission: "Up to: 9.8%",
      category: "Accessories",
      logo: "👁️",
      color: "bg-blue-600"
    },
    {
      id: 3,
      name: "100% Pure",
      url: "https://www.100percentpure.com/",
      commission: "Up to: 3.5%",
      category: "Beauty & Skincare",
      logo: "🌿",
      color: "bg-green-600"
    },
    {
      id: 4,
      name: "111SKIN",
      url: "https://111skin.com/",
      commission: "Up to: 7%",
      category: "Beauty & Skincare",
      logo: "✨",
      color: "bg-black"
    },
    {
      id: 5,
      name: "1800baskets",
      url: "https://www.1800baskets.com/",
      commission: "Up to: 7%",
      category: "Gifts & Flowers",
      logo: "🧺",
      color: "bg-orange-600"
    },
    {
      id: 6,
      name: "Nike",
      url: "https://www.nike.com/",
      commission: "Up to: 4%",
      category: "Activewear & Athletics",
      logo: "✓",
      color: "bg-black"
    },
    {
      id: 7,
      name: "Walgreens",
      url: "https://www.walgreens.com/",
      commission: "Up to: 8%",
      category: "Health & Wellness",
      logo: "🏥",
      color: "bg-red-600"
    },
    {
      id: 8,
      name: "Stanley",
      url: "https://www.stanley1913.com/",
      commission: "Up to: 5%",
      category: "Home & Garden",
      logo: "🔨",
      color: "bg-green-800"
    }
  ];

  const categories = [
    "Accessories", "Activewear & Athletics", "Apparel", "Automotive",
    "Babies & Kids", "Beauty & Skincare", "Books & Media", "Education",
    "Food & Drinks", "Gifts & Flowers", "Health & Wellness", "Home & Garden"
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profileData = await profileRes.json();

        if (profileData.creator) {
          setCreator(profileData.creator);
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Data fetch failed:', err);
        navigate('/login');
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || brand.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedBrands = [...filteredBrands].sort((a, b) => {
    switch(sortBy) {
      case 'Name (A-Z)':
        return a.name.localeCompare(b.name);
      case 'Name (Z-A)':
        return b.name.localeCompare(a.name);
      case 'Commission (High-Low)':
        return parseFloat(b.commission.match(/[\d.]+/)[0]) - parseFloat(a.commission.match(/[\d.]+/)[0]);
      case 'Commission (Low-High)':
        return parseFloat(a.commission.match(/[\d.]+/)[0]) - parseFloat(b.commission.match(/[\d.]+/)[0]);
      default:
        return 0;
    }
  });

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <header className="bg-indigo-600 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-lg">Z</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white">Zylike</h1>
                </div>
                <nav className="hidden md:flex space-x-6">
                  <button onClick={() => navigate('/analytics')} className="text-white/70 hover:text-white px-3 py-2 text-sm font-medium">Analytics</button>
                  <a href="#" className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium border-b-2 border-white">Brands</a>
                  <button onClick={() => navigate('/links')} className="text-white/70 hover:text-white px-3 py-2 text-sm font-medium">Links</button>
                  <button onClick={() => navigate('/earnings')} className="text-white/70 hover:text-white px-3 py-2 text-sm font-medium">Earnings</button>
                  <div className="relative">
                    <button className="text-white/70 hover:text-white px-3 py-2 text-sm font-medium flex items-center">
                      More
                      <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <input
                    type="text"
                    placeholder="Enter URL to create a link"
                    className="w-80 px-4 py-2 bg-indigo-500 text-white placeholder-indigo-200 rounded-lg focus:outline-none focus:bg-indigo-400"
                  />
                  <button className="ml-2 p-2 text-white hover:bg-indigo-500 rounded">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>
                </div>
                
                <button className="p-2 text-white hover:bg-indigo-500 rounded">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="p-2 text-white hover:bg-indigo-500 rounded"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Brands</h1>
            <p className="text-gray-600 mt-1">Search our brands and browse their stores.</p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by brand name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Categories 0</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Filters */}
            <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              Filters 0
              <svg className="inline ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Name (A-Z)</option>
                <option>Name (Z-A)</option>
                <option>Commission (High-Low)</option>
                <option>Commission (Low-High)</option>
              </select>
              <svg className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Brands Grid */}
          <div className="space-y-4">
            {sortedBrands.map((brand) => (
              <div key={brand.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Brand Logo */}
                    <div className={`w-16 h-16 ${brand.color} rounded-lg flex items-center justify-center`}>
                      <span className="text-white text-2xl">{brand.logo}</span>
                    </div>
                    
                    {/* Brand Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{brand.name}</h3>
                      <p className="text-sm text-gray-500">{brand.url}</p>
                      <div className="mt-1">
                        <span className="text-sm font-medium text-indigo-600">{brand.commission}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Category and Actions */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{brand.category}</div>
                      {/* Favorite button */}
                      <button className="mt-2 text-gray-400 hover:text-red-500">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Arrow */}
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No results */}
          {sortedBrands.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No brands found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
