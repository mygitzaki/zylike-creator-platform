// src/pages/Signup.jsx
import React, { useState } from "react";
import axios from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [showLoginLink, setShowLoginLink] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post("/creator/signup", formData);
      toast.success("✅ Account created! Please complete your creator application...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const errorData = err.response?.data;
      const errorMsg = errorData?.error || errorData?.message || "Signup failed!";
      
      if (errorMsg.toLowerCase().includes("email already") || errorMsg.toLowerCase().includes("already in use")) {
        toast.error("📧 Account already exists with this email!");
        setShowLoginLink(true);
      } else if (errorMsg.toLowerCase().includes("validation")) {
        toast.error("⚠️ Please check your input and try again.");
      } else if (errorMsg.toLowerCase().includes("password")) {
        toast.error("🔒 Password must be at least 6 characters long.");
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        toast.error("🔌 Unable to connect to server. Please check your connection.");
      } else {
        toast.error(`❌ ${errorMsg}`);
      }
      
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Left Section - Hero */}
      <div className="md:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-8 md:p-12">
        <div className="max-w-md text-center space-y-6">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-white">
              Welcome to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                Zylike
              </span>
            </h1>
            <p className="text-purple-100 text-lg md:text-xl leading-relaxed">
              The ultimate creator platform. Track performance, manage links, and maximize your earnings.
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-purple-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Real-time Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Instant Payments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-8 md:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Join Zylike</h2>
              <p className="text-gray-400">Create your account and complete our creator application</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                  required
                />
              </div>



              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>

              {/* Application Process Info */}
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <h4 className="text-blue-300 font-semibold mb-2 flex items-center">
                  <span className="mr-2">📝</span>
                  Next Steps After Account Creation
                </h4>
                <ul className="text-blue-200 text-sm space-y-1">
                  <li>• Complete your creator profile</li>
                  <li>• Connect your social media accounts</li>
                  <li>• Submit application for review</li>
                  <li>• Get approved and start earning!</li>
                </ul>
              </div>
            </form>

            {/* Conditional login link for existing accounts */}
            {showLoginLink && (
              <div className="mt-6 text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <span className="text-gray-300">Account already exists? </span>
                <button 
                  type="button"
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200" 
                  onClick={() => navigate("/login")}
                >
                  Sign In Instead
                </button>
              </div>
            )}

            <div className="mt-8 text-center">
              <span className="text-gray-400">Already have an account? </span>
              <button 
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200" 
                onClick={() => navigate('/login')}
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
