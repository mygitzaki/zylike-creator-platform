import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const navigate = useNavigate();
  const [showSignupLink, setShowSignupLink] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Enhanced error messages
        let errorMessage = data.error || 'Login failed!';
        
        if (errorMessage.toLowerCase().includes('invalid')) {
          errorMessage = '❌ Invalid email or password. Please check your credentials.';
          setShowSignupLink(true);
        } else if (errorMessage.toLowerCase().includes('not found')) {
          errorMessage = '❌ Account not found. Would you like to create a new account?';
          setShowSignupLink(true);
        } else if (errorMessage.toLowerCase().includes('blocked') || errorMessage.toLowerCase().includes('disabled')) {
          errorMessage = '🚫 Your account has been disabled. Please contact support.';
        }
        
        toast.error(errorMessage);
        return;
      }

      localStorage.setItem('token', data.token);
      const decoded = JSON.parse(atob(data.token.split('.')[1]));

      toast.success('✅ Login successful! Redirecting...');

      setTimeout(async () => {
        if (decoded.role === 'ADMIN') {
          navigate('/admin');
        } else {
                          // Check application status for regular users
                try {
                  const applicationRes = await fetch('http://localhost:5000/api/application/status', {
                    headers: {
                      'Authorization': `Bearer ${data.token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (applicationRes.ok) {
                    const applicationData = await applicationRes.json();
                    const creator = applicationData.creator;
                    
                    // Handle different application states
                    if (creator.applicationStatus === 'APPROVED') {
                      // User is approved, go to dashboard
                      navigate('/dashboard');
                    } else if (creator.applicationStatus === 'PENDING' && !creator.submittedAt) {
                      // User hasn't completed application, redirect to application
                      navigate('/application');
                    } else if (creator.applicationStatus === 'CHANGES_REQUESTED') {
                      // User needs to update their application
                      navigate('/application');
                    } else {
                      // User has submitted application and is waiting for review
                      navigate('/application/pending');
                    }
                  } else {
                    // If application check fails, go to application as fallback
                    navigate('/application');
                  }
                } catch (err) {
                  console.log('Application check failed, going to application:', err);
                  // Fallback to application if check fails
                  navigate('/application');
                }
        }
      }, 1000);
    } catch (err) {
      console.error('Login error:', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        toast.error('🔌 Unable to connect to server. Please check your connection.');
      } else {
        toast.error('⚠️ Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('📧 Password reset instructions sent to your email!');
        setShowForgotPassword(false);
        setResetEmail('');
      } else {
        toast.error(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      toast.error('⚠️ Unable to send reset email. Please try again.');
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
              Welcome Back to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                Zylike
              </span>
            </h1>
            <p className="text-purple-100 text-lg md:text-xl leading-relaxed">
              Access your dashboard, view analytics, and track your affiliate success.
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-purple-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Track Performance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Manage Links</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-8 md:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Zylike Login</h2>
              <p className="text-gray-400">Access your affiliate dashboard</p>
            </div>

            {/* Login Form */}
            {!showForgotPassword ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    required
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    required
                    disabled={loading}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 disabled:opacity-50"
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
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            ) : (
              /* Forgot Password Form */
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2">Reset Password</h3>
                  <p className="text-gray-400 text-sm">Enter your email to receive reset instructions</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={resetEmail}
                    required
                    disabled={loading}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 disabled:opacity-50"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-all duration-200"
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      'Send Reset Email'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Conditional signup links */}
            {showSignupLink && !showForgotPassword && (
              <div className="mt-6 text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <span className="text-gray-300">Account not found? </span>
                <button 
                  type="button"
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200" 
                  onClick={() => navigate('/')}
                >
                  Create Account
                </button>
              </div>
            )}

            {!showForgotPassword && (
              <div className="mt-8 text-center">
                <span className="text-gray-400">Don't have an account? </span>
                <button 
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200" 
                  onClick={() => navigate('/')}
                >
                  Sign up
                </button>
              </div>
            )}

            {/* Help section */}
            <div className="mt-6 text-center">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-blue-400 font-medium mb-2">🔑 Demo Credentials</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><strong>Admin:</strong> admin@zylike.com / admin123</p>
                  <p><strong>Creator:</strong> Sign up to create a new account</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
