// server/src/services/emailService.js
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = "notification@mumalieff.com";

// SendGrid Template IDs - Replace these with your actual template IDs from SendGrid
const TEMPLATES = {
    REGISTRATION_OTP: 'd-5055e47f4abb4bb9be622d8ef9656e76',
    LOGIN_OTP: 'd-cbe45c030f094f82a3bb1a36fcf2f83d',
    FORGOT_PASSWORD_OTP: 'd-110a651213894c7695fb3057360c62b0',
    WELCOME_EMAIL: 'd-8e6df1c30633437a8ad82fca203b24c5',
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
                location: 'Lagos, Nigeria', // You can enhance this with IP geolocation
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
                location: 'Lagos, Nigeria', // You can enhance this with IP geolocation
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
        const baseUrl = process.env.FRONTEND_URL || 'https://mumalieff.com';
        
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
                
                // Product category URLs
                customizeUrl: `${baseUrl}/products?category=customize-your-prints`,
                convictionUrl: `${baseUrl}/products?category=wear-your-conviction`,
                shopUrl: `${baseUrl}/products`,
                profileUrl: `${baseUrl}/profile`,
                
                // Support
                supportEmail: process.env.SUPPORT_EMAIL || 'support@mumalieff.com',
                
                // Social Media - Your actual accounts
                instagramUrl: 'https://www.instagram.com/mumalieff?igsh=MTFqZTQ0eXBvNWk1ZA==',
                tiktokUrl: 'https://www.tiktok.com/@mumalieff?_t=ZM-8xDuUhGR3Zt&_r=1',
                facebookUrl: 'https://facebook.com/mumalieff',
                twitterUrl: 'https://twitter.com/mumalieff',
                
                // Additional URLs for product discovery
                religiousUrl: `${baseUrl}/products?category=wear-your-conviction&style=religious-spiritual`,
                motivationalUrl: `${baseUrl}/products?category=wear-your-conviction&style=motivational`,
            },
        };
        
        await sgMail.send(msg);
        console.log(`Welcome email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('Welcome email sending failed:', error);
        // Don't throw error for welcome email as it's not critical
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

/**
 * Send order confirmation email (bonus template)
 */
const sendOrderConfirmation = async (email, orderData) => {
    try {
        // You can create an order confirmation template later
        const msg = {
            to: email,
            from: {
                email: FROM_EMAIL,
                name: 'Mumalieff'
            },
            subject: `Order Confirmation - ${orderData.orderNumber}`,
            html: `
                <h2>Thank you for your order!</h2>
                <p>Dear ${orderData.customerName},</p>
                <p>Your order #${orderData.orderNumber} has been confirmed.</p>
                <p>Order Total: ${orderData.total}</p>
                <p>We'll send you another email when your order ships.</p>
                <br>
                <p>Best regards,<br>The Mumalieff Team</p>
            `,
        };
        
        await sgMail.send(msg);
        console.log(`Order confirmation email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('Order confirmation email sending failed:', error);
        return false;
    }
};

module.exports = {
    sendOTPEmail,
    sendRegistrationOTP,
    sendLoginOTP,
    sendForgotPasswordOTP,
    sendWelcomeEmail,
    sendOrderConfirmation,
    TEMPLATES, // Export templates for reference
};