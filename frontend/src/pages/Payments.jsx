import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navigation from '../components/Navigation';

const PaymentSetupForm = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    // Bank Information
    bankName: initialData.bankName || '',
    accountNumber: initialData.accountNumber || '',
    routingNumber: initialData.routingNumber || '',
    accountType: initialData.accountType || 'checking',
    
    // Personal Information
    fullName: initialData.fullName || '',
    address: initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || '',
    zipCode: initialData.zipCode || '',
    country: initialData.country || 'United States',
    
    // Tax Information
    ssn: initialData.ssn || '',
    taxId: initialData.taxId || '',
    businessType: initialData.businessType || 'individual',
    
    // Additional Details
    phoneNumber: initialData.phoneNumber || '',
    dateOfBirth: initialData.dateOfBirth || '',
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      // Bank Information Validation
      if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
      if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
      if (!formData.routingNumber.trim()) newErrors.routingNumber = 'Routing number is required';
      if (formData.routingNumber.length !== 9) newErrors.routingNumber = 'Routing number must be 9 digits';
    } else if (step === 2) {
      // Personal Information Validation
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    } else if (step === 3) {
      // Tax Information Validation
      if (formData.businessType === 'individual' && !formData.ssn.trim()) {
        newErrors.ssn = 'SSN is required for individuals';
      }
      if (formData.businessType === 'business' && !formData.taxId.trim()) {
        newErrors.taxId = 'Tax ID is required for businesses';
      }
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
      if (!formData.dateOfBirth.trim()) newErrors.dateOfBirth = 'Date of birth is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      onSubmit(formData);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Bank Information</h2>
        <p className="text-gray-400">Enter your bank details for payments</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-gray-300 font-medium mb-2">
            Bank Name *
          </label>
          <input
            type="text"
            name="bankName"
            value={formData.bankName}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
              errors.bankName ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
            }`}
            placeholder="e.g., Chase Bank, Bank of America"
          />
          {errors.bankName && <p className="text-red-400 text-sm mt-1">{errors.bankName}</p>}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Account Number *
          </label>
          <input
            type="text"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
              errors.accountNumber ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
            }`}
            placeholder="Account number"
          />
          {errors.accountNumber && <p className="text-red-400 text-sm mt-1">{errors.accountNumber}</p>}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Routing Number *
          </label>
          <input
            type="text"
            name="routingNumber"
            value={formData.routingNumber}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
              errors.routingNumber ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
            }`}
            placeholder="9-digit routing number"
            maxLength="9"
          />
          {errors.routingNumber && <p className="text-red-400 text-sm mt-1">{errors.routingNumber}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-300 font-medium mb-2">
            Account Type
          </label>
          <select
            name="accountType"
            value={formData.accountType}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="checking">Checking Account</option>
            <option value="savings">Savings Account</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Personal Information</h2>
        <p className="text-gray-400">Your personal details for verification</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-gray-300 font-medium mb-2">
            Full Legal Name *
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
              errors.fullName ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
            }`}
            placeholder="As it appears on your ID"
          />
          {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-300 font-medium mb-2">
            Address *
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
              errors.address ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
            }`}
            placeholder="Street address"
          />
          {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            City *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
              errors.city ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
            }`}
            placeholder="City"
          />
          {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            State *
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
              errors.state ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
            }`}
            placeholder="State"
          />
          {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            ZIP Code *
          </label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
              errors.zipCode ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
            }`}
            placeholder="ZIP Code"
          />
          {errors.zipCode && <p className="text-red-400 text-sm mt-1">{errors.zipCode}</p>}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Country
          </label>
          <select
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Australia">Australia</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Tax Information</h2>
        <p className="text-gray-400">Required for tax reporting and compliance</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Business Type
          </label>
          <select
            name="businessType"
            value={formData.businessType}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="individual">Individual/Sole Proprietor</option>
            <option value="business">Business/Corporation</option>
            <option value="llc">LLC</option>
            <option value="partnership">Partnership</option>
          </select>
        </div>

        {formData.businessType === 'individual' ? (
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              Social Security Number *
            </label>
            <input
              type="password"
              name="ssn"
              value={formData.ssn}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                errors.ssn ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
              }`}
              placeholder="XXX-XX-XXXX"
            />
            {errors.ssn && <p className="text-red-400 text-sm mt-1">{errors.ssn}</p>}
          </div>
        ) : (
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              Tax ID (EIN) *
            </label>
            <input
              type="text"
              name="taxId"
              value={formData.taxId}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                errors.taxId ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
              }`}
              placeholder="XX-XXXXXXX"
            />
            {errors.taxId && <p className="text-red-400 text-sm mt-1">{errors.taxId}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                errors.phoneNumber ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
              }`}
              placeholder="(555) 123-4567"
            />
            {errors.phoneNumber && <p className="text-red-400 text-sm mt-1">{errors.phoneNumber}</p>}
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                errors.dateOfBirth ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
              }`}
            />
            {errors.dateOfBirth && <p className="text-red-400 text-sm mt-1">{errors.dateOfBirth}</p>}
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-blue-400 mr-3 mt-1">🔒</span>
            <div>
              <h4 className="text-blue-300 font-semibold mb-1">Security & Privacy</h4>
              <p className="text-blue-200 text-sm">
                Your personal information is encrypted and stored securely. We use this information only for tax reporting, identity verification, and payment processing as required by law.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step <= currentStep
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-600 text-gray-400'
              }`}
            >
              {step < currentStep ? '✓' : step}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Bank Info</span>
          <span>Personal</span>
          <span>Tax & Verify</span>
        </div>
      </div>

      {/* Form Steps */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>
        )}
        
        <div className="ml-auto">
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Complete Setup
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default function Payments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState(null);
  const [paymentAccount, setPaymentAccount] = useState(null);
  const [payoutStatus, setPayoutStatus] = useState(null);
  const [showSetupForm, setShowSetupForm] = useState(false);

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
      const [profileRes, payoutStatusRes] = await Promise.all([
        fetch('http://localhost:5000/api/auth/profile', {
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

      if (payoutStatusRes.ok) {
        const statusData = await payoutStatusRes.json();
        setPayoutStatus(statusData);
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSetup = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/payments/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('✅ Payment setup completed successfully!');
        setShowSetupForm(false);
        fetchPaymentData(); // Refresh data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to setup payment information');
      }
    } catch (error) {
      console.error('Error setting up payment:', error);
      toast.error('Failed to setup payment information');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading payment information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">💳 Payment Settings</h1>
            <p className="text-gray-400 text-lg">Manage your payment information and view payout details</p>
          </div>

          {showSetupForm ? (
            <div className="bg-gray-800 rounded-xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Payment Setup</h2>
                <button
                  onClick={() => setShowSetupForm(false)}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>
              
              <PaymentSetupForm 
                onSubmit={handlePaymentSetup}
                initialData={paymentAccount}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Account Status */}
              <div className="bg-gray-800 rounded-xl shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <span className="mr-3">🏦</span>
                  Payment Account
                </h2>
                
                {paymentAccount ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-green-400 text-2xl mr-3">✅</span>
                        <div>
                          <div className="font-semibold text-green-300">Account Setup Complete</div>
                          <div className="text-green-200 text-sm">Ready to receive payments</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bank Name:</span>
                        <span className="text-white">{paymentAccount.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Account Type:</span>
                        <span className="text-white capitalize">{paymentAccount.accountType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Account Ending:</span>
                        <span className="text-white">***{paymentAccount.accountNumber?.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-green-300">Active</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowSetupForm(true)}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      Update Payment Information
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🏦</div>
                    <h3 className="text-xl font-semibold mb-2">Setup Payment Account</h3>
                    <p className="text-gray-400 mb-6">
                      Complete your payment setup to start receiving payouts
                    </p>
                    <button
                      onClick={() => setShowSetupForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
                    >
                      Start Setup
                    </button>
                  </div>
                )}
              </div>

              {/* Payout Information */}
              <div className="bg-gray-800 rounded-xl shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <span className="mr-3">💰</span>
                  Payout Schedule
                </h2>

                <div className="space-y-6">
                  {/* Conservative Payment Policy */}
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-300 mb-3">Payment Timeline</h3>
                    <div className="space-y-2 text-sm text-blue-200">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs mr-3">1</span>
                        <span>Earnings become eligible after 15 days</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs mr-3">2</span>
                        <span>Payments processed on 15th and 30th of each month</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs mr-3">3</span>
                        <span>All earnings paid by 45 days maximum</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs mr-3">4</span>
                        <span>Minimum payout threshold: $25</span>
                      </div>
                    </div>
                  </div>

                  {/* Next Payout */}
                  {payoutStatus && (
                    <div className="space-y-4">
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400">Next Payout Date:</span>
                          <span className="text-white font-semibold">
                            {payoutStatus.nextPayoutDate ? 
                              new Date(payoutStatus.nextPayoutDate).toLocaleDateString() : 
                              'TBD'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Eligible Amount:</span>
                          <span className="text-green-400 font-semibold">
                            ${payoutStatus.eligibleAmount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400">Pending Amount:</span>
                          <span className="text-yellow-400 font-semibold">
                            ${payoutStatus.pendingAmount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Total Earnings:</span>
                          <span className="text-blue-400 font-semibold">
                            ${payoutStatus.totalEarnings?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment History */}
          {payoutStatus?.recentPayouts && payoutStatus.recentPayouts.length > 0 && (
            <div className="mt-8 bg-gray-800 rounded-xl shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="mr-3">📊</span>
                Recent Payouts
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 text-gray-400">Date</th>
                      <th className="text-left py-3 text-gray-400">Amount</th>
                      <th className="text-left py-3 text-gray-400">Status</th>
                      <th className="text-left py-3 text-gray-400">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutStatus.recentPayouts.map((payout, index) => (
                      <tr key={index} className="border-b border-gray-700/50">
                        <td className="py-3 text-white">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-green-400 font-semibold">
                          ${payout.amount.toFixed(2)}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            payout.status === 'COMPLETED' ? 'bg-green-500/20 text-green-300' :
                            payout.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {payout.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-300">Bank Transfer</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
