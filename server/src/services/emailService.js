const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = "notification@mumalieff.com";

const TEMPLATES = {
    REGISTRATION_OTP: 'd-5055e47f4abb4bb9be622d8ef9656e76',
    LOGIN_OTP: 'd-cbe45c030f094f82a3bb1a36fcf2f83d',
    FORGOT_PASSWORD_OTP: 'd-110a651213894c7695fb3057360c62b0',
    WELCOME_EMAIL: 'd-8e6df1c30633437a8ad82fca203b24c5',
    ORDER_CONFIRMATION: 'd-c7dd785dea82475bae9e440b0be550c1',
    SHIPPING_CONFIRMATION: 'd-54e73adf2adf4063a5425f826d860199',
    DELIVERY_CONFIRMATION: 'd-e5fbe9ed8ff64c1f91bd29165beaca7d',
    ORDER_CANCELLATION: 'd-a2ea5729069a4ed3a8973c40e577fc09',
    ABANDONED_CART_REMINDER: 'd-eae04b1f48124861aac72b92b9d2456d',
    PAYMENT_FAILED: 'd-c7e712f8d89845429d1c731e709d76aa',
    ORDER_STATUS_UPDATE: 'd-f7c96491f45e4b46aa5c37937239e432',
};

const getDeviceInfo = (req) => {
    const userAgent = req?.headers['user-agent'] || 'Unknown Device';
    const ip = req?.ip || req?.connection?.remoteAddress || 'Unknown IP';
    
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

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

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
        return true;
    } catch (error) {
        throw new Error('Failed to send verification email');
    }
};

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
        return true;
    } catch (error) {
        throw new Error('Failed to send verification email');
    }
};

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
        return true;
    } catch (error) {
        throw new Error('Failed to send verification email');
    }
};

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
        return true;
    } catch (error) {
        return false;
    }
};

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
                
                subtotal: formatCurrency(order.itemsPrice),
                shipping: order.shippingPrice > 0 ? formatCurrency(order.shippingPrice) : 'Free',
                tax: formatCurrency(order.taxPrice),
                discount: order.discount > 0 ? formatCurrency(order.discount) : null,
                total: formatCurrency(order.totalPrice),
                promoCode: order.promoCode || null,
                
                shippingAddress: {
                    address: order.shippingAddress.address,
                    city: order.shippingAddress.city,
                    state: order.shippingAddress.state,
                    postalCode: order.shippingAddress.postalCode,
                    country: order.shippingAddress.country,
                },
                
                paymentMethod: order.paymentMethod === 'paystack-card' ? 'Card Payment' : 'Bank Transfer',
                isPaid: order.isPaid,
                paymentStatus: order.isPaid ? 'Paid' : 'Pending',
                
                estimatedDelivery: order.estimatedDeliveryDate ? 
                    formatDate(order.estimatedDeliveryDate) : 
                    '3-5 business days',
                
                orderUrl: `${baseUrl}/order/${order._id}`,
                trackOrderUrl: `${baseUrl}/order/${order._id}`,
                shopUrl: `${baseUrl}/products`,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        return true;
    } catch (error) {
        return false;
    }
};

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
                
                estimatedDelivery: order.estimatedDeliveryDate ? 
                    formatDate(order.estimatedDeliveryDate) : 
                    formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
                
                orderItems: formatOrderItems(order.orderItems.slice(0, 3)),
                totalItems: order.orderItems.length,
                hasMoreItems: order.orderItems.length > 3,
                
                shippingAddress: {
                    address: order.shippingAddress.address,
                    city: order.shippingAddress.city,
                    state: order.shippingAddress.state,
                    postalCode: order.shippingAddress.postalCode,
                    country: order.shippingAddress.country,
                },
                
                orderUrl: `${baseUrl}/order/${order._id}`,
                trackOrderUrl: `${baseUrl}/order/${order._id}`,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        return true;
    } catch (error) {
        return false;
    }
};

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
                
                orderItems: formatOrderItems(order.orderItems.slice(0, 3)),
                totalItems: order.orderItems.length,
                hasMoreItems: order.orderItems.length > 3,
                total: formatCurrency(order.totalPrice),
                
                reviewUrl: `${baseUrl}/order/${order._id}/review`,
                orderUrl: `${baseUrl}/order/${order._id}`,
                shopAgainUrl: `${baseUrl}/products`,
                
                instagramUrl: 'https://www.instagram.com/mumalieff?igsh=MTFqZTQ0eXBvNWk1ZA==',
                tiktokUrl: 'https://www.tiktok.com/@mumalieff?_t=ZM-8xDuUhGR3Zt&_r=1',
                
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        return true;
    } catch (error) {
        return false;
    }
};

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
                
                orderItems: formatOrderItems(order.orderItems),
                total: formatCurrency(order.totalPrice),
                
                isPaidOrder: order.isPaid,
                refundAmount: order.isPaid ? formatCurrency(order.totalPrice) : null,
                refundMethod: order.isPaid ? 'Original payment method' : null,
                refundTimeframe: order.isPaid ? '5-10 business days' : null,
                
                shopUrl: `${baseUrl}/products`,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        return true;
    } catch (error) {
        return false;
    }
};

const sendAbandonedCartEmail = async (cartData, user, reminderType = 'first') => {
    try {
        const baseUrl = process.env.CLIENT_URL || 'https://mumalieff.com';
        
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
                
                cartItems: formatOrderItems(cartData.items || []),
                cartTotal: formatCurrency(cartData.total || 0),
                itemCount: cartData.items ? cartData.items.length : 0,
                
                hasDiscount: !!content.discount,
                discountOffer: content.discount,
                discountCode: content.discount ? `SAVE${content.discount.replace('%', '')}` : null,
                
                cartUrl: `${baseUrl}/cart`,
                checkoutUrl: `${baseUrl}/cart`,
                shopUrl: `${baseUrl}/products`,
                
                popularProducts: [],
                
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        return true;
    } catch (error) {
        return false;
    }
};

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
                
                total: formatCurrency(order.totalPrice),
                orderItems: formatOrderItems(order.orderItems.slice(0, 3)),
                
                retryPaymentUrl: `${baseUrl}/order/${order._id}`,
                orderUrl: `${baseUrl}/order/${order._id}`,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        return true;
    } catch (error) {
        return false;
    }
};

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
                
                trackingNumber: newStatus === 'Shipped' ? order.trackingNumber : null,
                estimatedDelivery: newStatus === 'Shipped' && order.estimatedDeliveryDate ? 
                    formatDate(order.estimatedDeliveryDate) : null,
                
                orderUrl: `${baseUrl}/order/${order._id}`,
                trackOrderUrl: newStatus === 'Shipped' ? `${baseUrl}/order/${order._id}` : null,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                
                currentYear: new Date().getFullYear(),
            },
        };
        
        await sgMail.send(msg);
        return true;
    } catch (error) {
        return false;
    }
};

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
    sendOTPEmail,
    sendRegistrationOTP,
    sendLoginOTP,
    sendForgotPasswordOTP,
    sendWelcomeEmail,
    sendOrderConfirmationEmail,
    sendShippingConfirmationEmail,
    sendDeliveryConfirmationEmail,
    sendOrderCancellationEmail,
    sendAbandonedCartEmail,
    sendPaymentFailedEmail,
    sendOrderStatusUpdateEmail,
    formatCurrency,
    formatDate,
    formatOrderItems,
    TEMPLATES,
};