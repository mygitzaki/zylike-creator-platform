import React from 'react';

const AdminTest = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Test Page</h1>
      <p className="text-gray-300">If you can see this, the basic routing is working.</p>
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Test Information</h2>
        <ul className="space-y-2 text-sm">
          <li>✅ Component loaded successfully</li>
          <li>✅ No JavaScript errors</li>
          <li>✅ Basic styling working</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminTest;
