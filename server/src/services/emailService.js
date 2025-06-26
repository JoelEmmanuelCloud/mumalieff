// server/src/services/emailService.js
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = "notification@mumalieff.com";

// SendGrid Template IDs
const TEMPLATES = {
    // Auth Templates 
    REGISTRATION_OTP: 'd-5055e47f4abb4bb9be622d8ef9656e76',
    LOGIN_OTP: 'd-cbe45c030f094f82a3bb1a36fcf2f83d',
    FORGOT_PASSWORD_OTP: 'd-110a651213894c7695fb3057360c62b0',
    WELCOME_EMAIL: 'd-8e6df1c30633437a8ad82fca203b24c5',
    
    // E-commerce Templates
    ORDER_CONFIRMATION: 'd-c7dd785dea82475bae9e440b0be550c1',
    SHIPPING_CONFIRMATION: 'd-54e73adf2adf4063a5425f826d860199',
    DELIVERY_CONFIRMATION: 'd-e5fbe9ed8ff64c1f91bd29165beaca7d',
    ORDER_CANCELLATION: 'd-a2ea5729069a4ed3a8973c40e577fc09',
    ABANDONED_CART_REMINDER: 'd-eae04b1f48124861aac72b92b9d2456d',
    PAYMENT_FAILED: 'd-c7e712f8d89845429d1c731e709d76aa',
    ORDER_STATUS_UPDATE: 'd-f7c96491f45e4b46aa5c37937239e432',
};

/**
 * Get current device and location info for email context
 */
const getDeviceInfo = (req) => {
    const userAgent = req?.headers['user-agent'] || 'Unknown Device';
    const ip = req?.ip || req?.connection?.remoteAddress || 'Unknown IP';
    
    // Basic device detection
    let device = 'Desktop';
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    
    if (userAgent.includes('Mobile')) device = 'Mobile';
    if (userAgent.includes('Tablet')) device = 'Tablet';
    
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    return {
        device,
        browser,
        os,
        ip,
        userAgent,
        fullInfo: `${browser} on ${os} (${device})`
    };
};

/**
 * Format currency for display
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
    }).format(amount);
};

/**
 * Format date for display
 */
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * Format order items for email display
 */
const formatOrderItems = (orderItems) => {
    return orderItems.map(item => ({
        name: item.name,
        quantity: item.qty,
        price: formatCurrency(item.price),
        subtotal: formatCurrency(item.price * item.qty),
        image: item.image,
        size: item.size || 'N/A',
        color: item.color || 'N/A',
        hasCustomDesign: item.customDesign?.hasCustomDesign || false,
    }));
};

// ==================== AUTH EMAILS (existing) ====================

/**
 * Send registration OTP email using SendGrid template
 */
const sendRegistrationOTP = async (email, otp, name = 'User', req = null) => {
    try {
        const msg = {
            to: email,
            from: {
                email: FROM_EMAIL,
                name: 'Mumalieff'
            },
            templateId: TEMPLATES.REGISTRATION_OTP,
            dynamicTemplateData: {
                firstName: name,
                code: otp,
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        console.log(`Registration OTP email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('Registration OTP email sending failed:', error);
        throw new Error('Failed to send verification email');
    }
};

/**
 * Send login OTP email using SendGrid template
 */
const sendLoginOTP = async (email, otp, name = 'User', req = null) => {
    try {
        const deviceInfo = getDeviceInfo(req);
        const loginTime = new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
        
        const msg = {
            to: email,
            from: {
                email: FROM_EMAIL,
                name: 'Mumalieff'
            },
            templateId: TEMPLATES.LOGIN_OTP,
            dynamicTemplateData: {
                firstName: name,
                code: otp,
                loginTime: loginTime,
                deviceInfo: deviceInfo.fullInfo,
                location: 'Lagos, Nigeria',
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        console.log(`Login OTP email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('Login OTP email sending failed:', error);
        throw new Error('Failed to send verification email');
    }
};

/**
 * Send forgot password OTP email using SendGrid template
 */
const sendForgotPasswordOTP = async (email, otp, name = 'User', req = null) => {
    try {
        const deviceInfo = getDeviceInfo(req);
        const requestTime = new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
        
        const msg = {
            to: email,
            from: {
                email: FROM_EMAIL,
                name: 'Mumalieff'
            },
            templateId: TEMPLATES.FORGOT_PASSWORD_OTP,
            dynamicTemplateData: {
                firstName: name,
                code: otp,
                requestTime: requestTime,
                deviceInfo: deviceInfo.fullInfo,
                location: 'Lagos, Nigeria',
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        console.log(`Forgot password OTP email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('Forgot password OTP email sending failed:', error);
        throw new Error('Failed to send verification email');
    }
};

/**
 * Send welcome email using SendGrid template
 */
const sendWelcomeEmail = async (email, name = 'User') => {
    try {
        const baseUrl = process.env.CLIENT_URL || 'https://mumalieff.com';
        
        const msg = {
            to: email,
            from: {
                email: FROM_EMAIL,
                name: 'Mumalieff'
            },
            templateId: TEMPLATES.WELCOME_EMAIL,
            dynamicTemplateData: {
                firstName: name,
                currentYear: new Date().getFullYear(),
                customizeUrl: `${baseUrl}/products?category=customize-your-prints`,
                convictionUrl: `${baseUrl}/products?category=wear-your-conviction`,
                shopUrl: `${baseUrl}/products`,
                profileUrl: `${baseUrl}/profile`,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                instagramUrl: 'https://www.instagram.com/mumalieff?igsh=MTFqZTQ0eXBvNWk1ZA==',
                tiktokUrl: 'https://www.tiktok.com/@mumalieff?_t=ZM-8xDuUhGR3Zt&_r=1',
                facebookUrl: 'https://facebook.com/mumalieff',
                twitterUrl: 'https://twitter.com/mumalieff',
                religiousUrl: `${baseUrl}/products?category=wear-your-conviction&style=religious-spiritual`,
                motivationalUrl: `${baseUrl}/products?category=wear-your-conviction&style=motivational`,
            },
        };
        
        await sgMail.send(msg);
        console.log(`Welcome email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('Welcome email sending failed:', error);
        return false;
    }
};

// ==================== E-COMMERCE EMAILS (new) ====================

/**
 * Send order confirmation email
 */
const sendOrderConfirmationEmail = async (order, user) => {
    try {
        const baseUrl = process.env.CLIENT_URL || 'https://mumalieff.com';
        
        const msg = {
            to: user.email,
            from: {
                email: FROM_EMAIL,
                name: 'Mumalieff'
            },
            templateId: TEMPLATES.ORDER_CONFIRMATION,
            dynamicTemplateData: {
                firstName: user.name,
                orderNumber: order.orderNumber || order._id.slice(-8),
                orderDate: formatDate(order.createdAt),
                orderItems: formatOrderItems(order.orderItems),
                
                // Pricing
                subtotal: formatCurrency(order.itemsPrice),
                shipping: order.shippingPrice > 0 ? formatCurrency(order.shippingPrice) : 'Free',
                tax: formatCurrency(order.taxPrice),
                discount: order.discount > 0 ? formatCurrency(order.discount) : null,
                total: formatCurrency(order.totalPrice),
                promoCode: order.promoCode || null,
                
                // Shipping
                shippingAddress: {
                    address: order.shippingAddress.address,
                    city: order.shippingAddress.city,
                    state: order.shippingAddress.state,
                    postalCode: order.shippingAddress.postalCode,
                    country: order.shippingAddress.country,
                },
                
                // Payment
                paymentMethod: order.paymentMethod === 'paystack-card' ? 'Card Payment' : 'Bank Transfer',
                isPaid: order.isPaid,
                paymentStatus: order.isPaid ? 'Paid' : 'Pending',
                
                // Estimated delivery
                estimatedDelivery: order.estimatedDeliveryDate ? 
                    formatDate(order.estimatedDeliveryDate) : 
                    '3-5 business days',
                
                // URLs
                orderUrl: `${baseUrl}/order/${order._id}`,
                trackOrderUrl: `${baseUrl}/order/${order._id}`,
                shopUrl: `${baseUrl}/products`,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        console.log(`Order confirmation email sent successfully to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Order confirmation email sending failed:', error);
        return false;
    }
};

/**
 * Send shipping confirmation email
 */
const sendShippingConfirmationEmail = async (order, user, trackingInfo = {}) => {
    try {
        const baseUrl = process.env.CLIENT_URL || 'https://mumalieff.com';
        
        const msg = {
            to: user.email,
            from: {
                email: FROM_EMAIL,
                name: 'Mumalieff'
            },
            templateId: TEMPLATES.SHIPPING_CONFIRMATION,
            dynamicTemplateData: {
                firstName: user.firstName,
                orderNumber: order.orderNumber || order._id.slice(-8),
                shippedDate: formatDate(new Date()),
                trackingNumber: order.trackingNumber || trackingInfo.trackingNumber,
                carrier: trackingInfo.carrier || 'Our delivery partner',
                
                // Estimated delivery
                estimatedDelivery: order.estimatedDeliveryDate ? 
                    formatDate(order.estimatedDeliveryDate) : 
                    formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)), // 3 days from now
                
                // Order items (summary)
                orderItems: formatOrderItems(order.orderItems.slice(0, 3)), // Show first 3 items
                totalItems: order.orderItems.length,
                hasMoreItems: order.orderItems.length > 3,
                
                // Shipping address
                shippingAddress: {
                    address: order.shippingAddress.address,
                    city: order.shippingAddress.city,
                    state: order.shippingAddress.state,
                    postalCode: order.shippingAddress.postalCode,
                    country: order.shippingAddress.country,
                },
                
                // URLs
                orderUrl: `${baseUrl}/order/${order._id}`,
                trackOrderUrl: `${baseUrl}/order/${order._id}`,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        console.log(`Shipping confirmation email sent successfully to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Shipping confirmation email sending failed:', error);
        return false;
    }
};

/**
 * Send delivery confirmation email
 */
const sendDeliveryConfirmationEmail = async (order, user) => {
    try {
        const baseUrl = process.env.CLIENT_URL || 'https://mumalieff.com';
        
        const msg = {
            to: user.email,
            from: {
                email: FROM_EMAIL,
                name: 'Mumalieff'
            },
            templateId: TEMPLATES.DELIVERY_CONFIRMATION,
            dynamicTemplateData: {
                firstName: user.firstName,
                orderNumber: order.orderNumber || order._id.slice(-8),
                deliveredDate: formatDate(order.deliveredAt || new Date()),
                
                // Order summary
                orderItems: formatOrderItems(order.orderItems.slice(0, 3)),
                totalItems: order.orderItems.length,
                hasMoreItems: order.orderItems.length > 3,
                total: formatCurrency(order.totalPrice),
                
                // Review request
                reviewUrl: `${baseUrl}/order/${order._id}/review`,
                orderUrl: `${baseUrl}/order/${order._id}`,
                shopAgainUrl: `${baseUrl}/products`,
                
                // Social sharing
                instagramUrl: 'https://www.instagram.com/mumalieff?igsh=MTFqZTQ0eXBvNWk1ZA==',
                tiktokUrl: 'https://www.tiktok.com/@mumalieff?_t=ZM-8xDuUhGR3Zt&_r=1',
                
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        console.log(`Delivery confirmation email sent successfully to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Delivery confirmation email sending failed:', error);
        return false;
    }
};

/**
 * Send order cancellation email
 */
const sendOrderCancellationEmail = async (order, user, cancellationReason = '') => {
    try {
        const baseUrl = process.env.CLIENT_URL || 'https://mumalieff.com';
        
        const msg = {
            to: user.email,
            from: {
                email: FROM_EMAIL,
                name: 'Mumalieff'
            },
            templateId: TEMPLATES.ORDER_CANCELLATION,
            dynamicTemplateData: {
                firstName: user.firstName,
                orderNumber: order.orderNumber || order._id.slice(-8),
                cancelledDate: formatDate(new Date()),
                cancellationReason: cancellationReason || 'Customer requested cancellation',
                
                // Order details
                orderItems: formatOrderItems(order.orderItems),
                total: formatCurrency(order.totalPrice),
                
                // Refund information
                isPaidOrder: order.isPaid,
                refundAmount: order.isPaid ? formatCurrency(order.totalPrice) : null,
                refundMethod: order.isPaid ? 'Original payment method' : null,
                refundTimeframe: order.isPaid ? '5-10 business days' : null,
                
                // Next steps
                shopUrl: `${baseUrl}/products`,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        console.log(`Order cancellation email sent successfully to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Order cancellation email sending failed:', error);
        return false;
    }
};

/**
 * Send abandoned cart reminder email
 */
const sendAbandonedCartEmail = async (cartData, user, reminderType = 'first') => {
    try {
        const baseUrl = process.env.CLIENT_URL || 'https://mumalieff.com';
        
        // Different messaging based on reminder type
        const reminderContent = {
            first: {
                subject: 'You left something in your cart',
                urgency: 'low',
                discount: null,
            },
            second: {
                subject: 'Still thinking it over?',
                urgency: 'medium',
                discount: '10% off',
            },
            final: {
                subject: 'Last chance - your cart expires soon!',
                urgency: 'high',
                discount: '15% off',
            }
        };
        
        const content = reminderContent[reminderType] || reminderContent.first;
        
        const msg = {
            to: user.email,
            from: {
                email: FROM_EMAIL,
                name: 'Mumalieff'
            },
            templateId: TEMPLATES.ABANDONED_CART_REMINDER,
            dynamicTemplateData: {
                firstName: user.firstName,
                reminderType: reminderType,
                urgencyLevel: content.urgency,
                
                // Cart details
                cartItems: formatOrderItems(cartData.items || []),
                cartTotal: formatCurrency(cartData.total || 0),
                itemCount: cartData.items ? cartData.items.length : 0,
                
                // Incentives
                hasDiscount: !!content.discount,
                discountOffer: content.discount,
                discountCode: content.discount ? `SAVE${content.discount.replace('%', '')}` : null,
                
                // URLs
                cartUrl: `${baseUrl}/cart`,
                checkoutUrl: `${baseUrl}/cart`,
                shopUrl: `${baseUrl}/products`,
                
                // Social proof
                popularProducts: [], // You can add popular products here
                
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        console.log(`Abandoned cart email (${reminderType}) sent successfully to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Abandoned cart email sending failed:', error);
        return false;
    }
};

/**
 * Send payment failed email
 */
const sendPaymentFailedEmail = async (order, user, failureReason = '') => {
    try {
        const baseUrl = process.env.CLIENT_URL || 'https://mumalieff.com';
        
        const msg = {
            to: user.email,
            from: {
                email: FROM_EMAIL,
                name: 'Mumalieff'
            },
            templateId: TEMPLATES.PAYMENT_FAILED,
            dynamicTemplateData: {
                firstName: user.firstName,
                orderNumber: order.orderNumber || order._id.slice(-8),
                failureReason: failureReason || 'Payment could not be processed',
                
                // Order details
                total: formatCurrency(order.totalPrice),
                orderItems: formatOrderItems(order.orderItems.slice(0, 3)),
                
                // Action URLs
                retryPaymentUrl: `${baseUrl}/order/${order._id}`,
                orderUrl: `${baseUrl}/order/${order._id}`,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        console.log(`Payment failed email sent successfully to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Payment failed email sending failed:', error);
        return false;
    }
};

/**
 * Send order status update email
 */
const sendOrderStatusUpdateEmail = async (order, user, previousStatus, newStatus) => {
    try {
        const baseUrl = process.env.CLIENT_URL || 'https://mumalieff.com';
        
        const statusMessages = {
            'Processing': 'We\'re preparing your order',
            'Shipped': 'Your order is on its way',
            'Delivered': 'Your order has been delivered',
            'Cancelled': 'Your order has been cancelled',
        };
        
        const msg = {
            to: user.email,
            from: {
                email: FROM_EMAIL,
                name: 'Mumalieff'
            },
            templateId: TEMPLATES.ORDER_STATUS_UPDATE,
            dynamicTemplateData: {
                firstName: user.firstName,
                orderNumber: order.orderNumber || order._id.slice(-8),
                previousStatus: previousStatus,
                newStatus: newStatus,
                statusMessage: statusMessages[newStatus] || `Order status updated to ${newStatus}`,
                updateDate: formatDate(new Date()),
                
                // Additional info based on status
                trackingNumber: newStatus === 'Shipped' ? order.trackingNumber : null,
                estimatedDelivery: newStatus === 'Shipped' && order.estimatedDeliveryDate ? 
                    formatDate(order.estimatedDeliveryDate) : null,
                
                // URLs
                orderUrl: `${baseUrl}/order/${order._id}`,
                trackOrderUrl: newStatus === 'Shipped' ? `${baseUrl}/order/${order._id}` : null,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        console.log(`Order status update email sent successfully to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Order status update email sending failed:', error);
        return false;
    }
};

/**
 * Generic OTP email sender - determines which template to use based on type
 */
const sendOTPEmail = async (email, otp, type, name = 'User', req = null) => {
    switch (type) {
        case 'registration':
            return await sendRegistrationOTP(email, otp, name, req);
        case 'login':
            return await sendLoginOTP(email, otp, name, req);
        case 'forgot_password':
            return await sendForgotPasswordOTP(email, otp, name, req);
        default:
            throw new Error('Invalid OTP type');
    }
};

module.exports = {
    // Auth emails (existing)
    sendOTPEmail,
    sendRegistrationOTP,
    sendLoginOTP,
    sendForgotPasswordOTP,
    sendWelcomeEmail,
    
    // E-commerce emails (new)
    sendOrderConfirmationEmail,
    sendShippingConfirmationEmail,
    sendDeliveryConfirmationEmail,
    sendOrderCancellationEmail,
    sendAbandonedCartEmail,
    sendPaymentFailedEmail,
    sendOrderStatusUpdateEmail,
    
    // Utilities
    formatCurrency,
    formatDate,
    formatOrderItems,
    
    // Templates reference
    TEMPLATES,
};