// ✅ frontend/src/api/adminApi.js
import axios from './axiosInstance';

// Get full profile of a creator
export const fetchCreatorProfile = async (creatorId) => {
  const res = await axios.get(`/admin/creator/${creatorId}`);
  return res.data;
};

// Promote a user to ADMIN
export const promoteCreatorToAdmin = async (creatorId) => {
  const res = await axios.put(`/admin/creator/${creatorId}/promote`);
  return res.data;
};

// Delete a user
export const deleteCreatorById = async (creatorId) => {
  const res = await axios.delete(`/admin/creator/${creatorId}`);
  return res.data;
};

// ✅ Get impact stats of a specific creator
export const fetchCreatorImpactStats = async (creatorId) => {
  const res = await axios.get(`/admin/creator/${creatorId}/impact-stats`);
  return res.data;
};

// ✅ Seed new transactions from Impact.com actions
export const seedImpactTransactions = async () => {
  const res = await axios.post(`/admin/seed-transactions`);
  return res.data;
};

// ✅ Set custom commission rate for a creator
export const setCreatorCommissionRate = async (creatorId, commissionRate, reason = '') => {
  const response = await axios.put(`/admin/creator/${creatorId}/commission`, {
    commissionRate,
    reason
  });
  return response;
};

// Check database data directly
export const checkDatabase = async () => {
  const response = await axios.get('/admin/debug/database');
  return response;
};
