const axios = require('axios');

class TipaltiService {
  constructor() {
    // These will come from environment variables
    this.baseUrl = process.env.TIPALTI_BASE_URL || 'https://ui2.sandbox.tipalti.com';
    this.apiKey = process.env.TIPALTI_API_KEY;
    this.payerEntityId = process.env.TIPALTI_PAYER_ENTITY_ID;
    this.isSandbox = process.env.NODE_ENV !== 'production';
  }

  // Get authentication headers for Tipalti API
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'Tipalti-Payer-Entity-Id': this.payerEntityId
    };
  }

  // ===== PAYEE MANAGEMENT =====

  /**
   * Create a new payee in Tipalti
   * @param {Object} creator - Creator object from database
   * @param {Object} paymentAccount - Payment account details
   */
  async createPayee(creator, paymentAccount) {
    try {
      const payeeData = {
        payeeEntityId: creator.id, // Use our creator ID as Tipalti's external ID
        payeeDisplayName: creator.name,
        email: creator.email,
        
        // Payment preferences
        defaultPaymentMethod: this.mapPaymentMethod(paymentAccount.preferredMethod),
        minimumPaymentAmount: paymentAccount.minimumPayout,
        
        // Address information
        address: {
          line1: paymentAccount.addressLine1,
          line2: paymentAccount.addressLine2,
          city: paymentAccount.city,
          state: paymentAccount.state,
          country: paymentAccount.country,
          postalCode: paymentAccount.postalCode
        },

        // Tax information
        taxInfo: {
          taxId: paymentAccount.taxId,
          taxClassification: this.getTaxClassification(paymentAccount.country)
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/api/v1/payees`,
        payeeData,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        tipaltiPayeeId: response.data.payeeId,
        status: response.data.status,
        data: response.data
      };

    } catch (error) {
      console.error('Tipalti create payee error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Update existing payee in Tipalti
   */
  async updatePayee(tipaltiPayeeId, updateData) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/api/v1/payees/${tipaltiPayeeId}`,
        updateData,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Tipalti update payee error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get payee status and information from Tipalti
   */
  async getPayeeStatus(tipaltiPayeeId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/payees/${tipaltiPayeeId}`,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        status: response.data.status,
        onboardingStatus: response.data.onboardingStatus,
        data: response.data
      };

    } catch (error) {
      console.error('Tipalti get payee error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // ===== PAYMENT PROCESSING =====

  /**
   * Create a payment to a payee
   * @param {Object} payoutData - Payout information
   */
  async createPayment(payoutData) {
    try {
      const paymentData = {
        payeeEntityId: payoutData.creatorId,
        amount: payoutData.totalAmount,
        currency: payoutData.currency || 'USD',
        description: `Zylike Affiliate Payout - ${new Date().toISOString().split('T')[0]}`,
        externalReferenceId: payoutData.id, // Our payout ID
        paymentMethod: this.mapPaymentMethod(payoutData.paymentMethod),
        scheduledDate: payoutData.scheduledAt
      };

      const response = await axios.post(
        `${this.baseUrl}/api/v1/payments`,
        paymentData,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        tipaltiPaymentId: response.data.paymentId,
        status: response.data.status,
        data: response.data
      };

    } catch (error) {
      console.error('Tipalti create payment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get payment status from Tipalti
   */
  async getPaymentStatus(tipaltiPaymentId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/payments/${tipaltiPaymentId}`,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        status: response.data.status,
        data: response.data
      };

    } catch (error) {
      console.error('Tipalti get payment status error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(tipaltiPaymentId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/payments/${tipaltiPaymentId}/cancel`,
        {},
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Tipalti cancel payment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // ===== BULK OPERATIONS =====

  /**
   * Process bulk payments for multiple creators
   * @param {Array} payouts - Array of payout objects
   */
  async processBulkPayments(payouts) {
    try {
      const bulkPaymentData = {
        payments: payouts.map(payout => ({
          payeeEntityId: payout.creatorId,
          amount: payout.totalAmount,
          currency: payout.currency || 'USD',
          description: `Zylike Bulk Payout - ${new Date().toISOString().split('T')[0]}`,
          externalReferenceId: payout.id,
          paymentMethod: this.mapPaymentMethod(payout.paymentMethod)
        }))
      };

      const response = await axios.post(
        `${this.baseUrl}/api/v1/payments/bulk`,
        bulkPaymentData,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        batchId: response.data.batchId,
        processedPayments: response.data.payments,
        data: response.data
      };

    } catch (error) {
      console.error('Tipalti bulk payment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Map our payment methods to Tipalti's format
   */
  mapPaymentMethod(method) {
    const mapping = {
      'BANK_TRANSFER': 'ACH',
      'WIRE_TRANSFER': 'WIRE',
      'PAYPAL': 'PAYPAL',
      'PAYONEER': 'PAYONEER',
      'PREPAID_CARD': 'PREPAID_CARD',
      'CHECK': 'CHECK'
    };
    return mapping[method] || 'ACH';
  }

  /**
   * Get tax classification based on country
   */
  getTaxClassification(country) {
    return country === 'US' ? 'Individual' : 'Foreign';
  }

  /**
   * Map Tipalti status to our internal status
   */
  mapPaymentStatus(tipaltiStatus) {
    const mapping = {
      'PENDING': 'PENDING',
      'PROCESSING': 'PROCESSING',
      'SENT': 'COMPLETED',
      'FAILED': 'FAILED',
      'CANCELLED': 'CANCELLED',
      'ON_HOLD': 'ON_HOLD'
    };
    return mapping[tipaltiStatus] || 'PENDING';
  }

  // ===== WEBHOOK PROCESSING =====

  /**
   * Process webhook from Tipalti
   * @param {Object} webhookData - Webhook payload from Tipalti
   */
  async processWebhook(webhookData) {
    try {
      const { eventType, data } = webhookData;

      switch (eventType) {
        case 'payment.completed':
          return await this.handlePaymentCompleted(data);
        case 'payment.failed':
          return await this.handlePaymentFailed(data);
        case 'payee.onboarded':
          return await this.handlePayeeOnboarded(data);
        default:
          console.log(`Unhandled webhook event: ${eventType}`);
          return { success: true, message: 'Event ignored' };
      }

    } catch (error) {
      console.error('Webhook processing error:', error);
      return { success: false, error: error.message };
    }
  }

  async handlePaymentCompleted(data) {
    // This will be implemented when we create the payment controller
    console.log('Payment completed:', data);
    return { success: true };
  }

  async handlePaymentFailed(data) {
    // This will be implemented when we create the payment controller
    console.log('Payment failed:', data);
    return { success: true };
  }

  async handlePayeeOnboarded(data) {
    // This will be implemented when we create the payment controller
    console.log('Payee onboarded:', data);
    return { success: true };
  }

  // ===== CONNECTION TESTING =====

  /**
   * Test connection to Tipalti API
   */
  async testConnection() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/health`,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        status: 'Connected to Tipalti',
        environment: this.isSandbox ? 'Sandbox' : 'Production',
        data: response.data
      };

    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: 'Connection failed'
      };
    }
  }
}

module.exports = new TipaltiService();


