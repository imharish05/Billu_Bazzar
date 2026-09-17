'use strict';

const Razorpay = require('razorpay');
const crypto = require('crypto');
const PaymentGatewayInterface = require('./PaymentGatewayInterface');

class RazorpayService extends PaymentGatewayInterface {
  /**
   * Helper to get a configured Razorpay instance with response interceptor
   * to prevent SDK crashes on network/timeout errors.
   * @private
   * @returns {Razorpay}
   */
  _getInstance() {
    const key_id = process.env.RAZORPAY_KEY_ID?.trim();
    const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(key_id || '') || !key_secret || /mock|REPLACE|your_/i.test(key_id + key_secret)) {
      throw Object.assign(new Error('Razorpay is not configured. Set valid Razorpay API credentials on the server.'), { status: 503, code: 'PAYMENT_GATEWAY_NOT_CONFIGURED' });
    }
    const instance = new Razorpay({ key_id, key_secret });
    if (instance.api?.rq?.defaults) instance.api.rq.defaults.timeout = 15000;

    if (instance.api && instance.api.rq && instance.api.rq.interceptors) {
      instance.api.rq.interceptors.response.use(
        (response) => response,
        (error) => {
          if (!error.response) {
            error.response = {
              status: 500,
              data: {
                error: {
                  code: 'NETWORK_ERROR',
                  description: error.message || 'Network error connecting to Razorpay'
                }
              }
            };
          }
          return Promise.reject(error);
        }
      );
    }

    return instance;
  }

  /**
   * Create an order in Razorpay.
   * @param {Object} orderData
   * @param {number} orderData.amount - Total amount in standard currency unit (INR)
   * @param {string} [orderData.currency='INR'] - Currency code
   * @param {string} orderData.receipt - Unique receipt reference ID
   * @returns {Promise<import('./PaymentGatewayInterface').PaymentResult>}
   */
  async createOrder({ amount, currency = 'INR', receipt }) {
    try {
      const paise = Math.round(Number(amount) * 100);
      if (!Number.isSafeInteger(paise) || paise < 100) throw Object.assign(new Error('Razorpay order amount must be at least INR 1.'), { status: 400 });
      const instance = this._getInstance();

      const options = {
        amount: Math.round(amount * 100), // amount in paisa
        currency,
        receipt,
      };

      const order = await instance.orders.create(options);

      return {
        success: true,
        gatewayRef: order.id,
        amount,
        currency,
        status: order.status.toUpperCase(),
        raw: order,
      };
    } catch (err) {
      if (err.status) throw err;
      console.error('[Razorpay createOrder]', err.statusCode || err.code || '', err.error?.description || err.message || 'Request failed');
      const authentication = err.statusCode === 401;
      throw Object.assign(new Error(authentication
        ? 'Razorpay rejected the API credentials. Check the server payment configuration.'
        : 'Unable to connect to Razorpay or create a payment order. Please retry.'), {
        status: authentication ? 503 : 502,
        code: authentication ? 'PAYMENT_GATEWAY_AUTH_FAILED' : 'PAYMENT_GATEWAY_ERROR',
      });
    }
  }

  /**
   * Verify signature of Razorpay webhook events.
   * @param {any} payload - The raw request body
   * @param {string} signature - The x-razorpay-signature header
   * @returns {Promise<boolean>}
   */
  async verifySignature(payload, signature) {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_mocksecret';
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
      return expectedSignature === signature;
    } catch (err) {
      console.error('[Razorpay verifySignature] Error:', err.message);
      return false;
    }
  }

  /**
   * Fetch payment details from Razorpay.
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<import('./PaymentGatewayInterface').PaymentResult>}
   */
  async fetchPayment(paymentId) {
    try {
      const instance = this._getInstance();
      const payment = await instance.payments.fetch(paymentId);
      return {
        success: payment.status === 'captured',
        gatewayRef: payment.order_id,
        amount: payment.amount / 100, // normalized to INR rupees
        currency: payment.currency,
        status: payment.status.toUpperCase(),
        raw: payment,
      };
    } catch (err) {
      console.error('[Razorpay fetchPayment] Error:', err.message);
      throw err;
    }
  }

  /**
   * Process refund in Razorpay.
   * @param {string} paymentId - Razorpay payment ID to refund
   * @param {number} amount - Amount in INR rupees to refund
   * @returns {Promise<import('./PaymentGatewayInterface').PaymentResult>}
   */
  async refund(paymentId, amount) {
    try {
      const instance = this._getInstance();
      let resolvedPaymentId = paymentId;

      // If an Order ID (order_...) was passed instead of a Payment ID (pay_...), fetch the associated captured payment
      if (typeof resolvedPaymentId === 'string' && resolvedPaymentId.startsWith('order_')) {
        try {
          const orderPayments = await instance.orders.fetchPayments(resolvedPaymentId);
          const capturedPayment = (orderPayments?.items || []).find(p => p.status === 'captured') || (orderPayments?.items || [])[0];
          if (capturedPayment && capturedPayment.id) {
            console.log(`[Razorpay refund] Resolved order ID ${resolvedPaymentId} to captured payment ID ${capturedPayment.id}`);
            resolvedPaymentId = capturedPayment.id;
          } else {
            return {
              success: false,
              status: `No valid payment found for Razorpay Order ID ${resolvedPaymentId}`,
            };
          }
        } catch (fetchOrderErr) {
          console.error(`[Razorpay refund] Error fetching payments for order ID ${resolvedPaymentId}:`, fetchOrderErr.message);
          return {
            success: false,
            status: fetchOrderErr?.error?.description || fetchOrderErr.message || 'Failed to retrieve payments for order',
            error: fetchOrderErr,
          };
        }
      }

      let refundAmountInPaisa = amount ? Math.round(amount * 100) : null;

      // Check payment status and remaining refundable balance on Razorpay
      try {
        const paymentDetails = await instance.payments.fetch(resolvedPaymentId);
        if (paymentDetails && paymentDetails.amount) {
          const alreadyRefunded = paymentDetails.amount_refunded || 0;
          const maxAvailablePaisa = Math.max(0, paymentDetails.amount - alreadyRefunded);

          if (maxAvailablePaisa === 0) {
            console.log('[Razorpay refund] Payment was already fully refunded on Razorpay.');
            const existingRefundId = (paymentDetails.refunds?.items?.[0]?.id) || paymentDetails.id || `rfnd_${Date.now()}`;
            return {
              success: true,
              gatewayRef: existingRefundId,
              gatewayPaymentId: resolvedPaymentId,
              amount: parseFloat(amount || 0),
              currency: paymentDetails.currency || 'INR',
              status: 'REFUNDED',
              raw: { ...paymentDetails, payment_id: resolvedPaymentId },
            };
          }

          if (refundAmountInPaisa && refundAmountInPaisa > maxAvailablePaisa) {
            console.warn(`[Razorpay refund] Requested refund (${refundAmountInPaisa} paise) exceeds available balance (${maxAvailablePaisa} paise). Auto-capping to ${maxAvailablePaisa} paise.`);
            refundAmountInPaisa = maxAvailablePaisa;
          }
        }
      } catch (fetchErr) {
        console.warn('[Razorpay refund] Pre-fetch payment warning:', fetchErr.message);
      }

      const options = {};
      if (refundAmountInPaisa) {
        options.amount = refundAmountInPaisa;
      }

      const refundObj = await instance.payments.refund(resolvedPaymentId, options);
      const isSuccess = refundObj.status === 'processed' || refundObj.status === 'pending' || !!refundObj.id;
      if (isSuccess) {
        console.log(`✅ [Razorpay Refund Success] Refund of ${refundObj.currency || 'INR'} ${refundObj.amount / 100} completed successfully for Payment ID: ${resolvedPaymentId}. Gateway Refund Ref: ${refundObj.id}`);
      }
      return {
        success: isSuccess,
        gatewayRef: refundObj.id,
        gatewayPaymentId: resolvedPaymentId,
        amount: refundObj.amount / 100,
        currency: refundObj.currency || 'INR',
        status: (refundObj.status || 'PROCESSED').toUpperCase(),
        raw: { ...refundObj, payment_id: resolvedPaymentId },
      };
    } catch (err) {
      const errorDescription = err?.error?.description || err?.message || 'Payment gateway rejected refund request';
      console.error('❌ [Razorpay Refund Error]:', errorDescription);
      return {
        success: false,
        status: errorDescription,
        error: err?.error || err,
      };
    }
  }
}

module.exports = new RazorpayService();
