import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@mumalieff.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Email not sent.');
    return false;
  }

  try {
    const msg = {
      to: options.to,
      from: FROM_EMAIL,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      html: options.html,
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendOTPEmail = async (email: string, otp: string, type: string): Promise<boolean> => {
  const typeMap: Record<string, string> = {
    registration: 'Registration',
    login: 'Login',
    forgot_password: 'Password Reset',
  };

  const subject = `Your Mumalieff ${typeMap[type] || 'Verification'} Code`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .otp-code { font-size: 32px; font-weight: bold; color: #D4AF37; text-align: center; padding: 20px; background-color: #fff; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Mumalieff</h1>
          </div>
          <div class="content">
            <h2>Your ${typeMap[type] || 'Verification'} Code</h2>
            <p>Please use the following code to complete your ${type.replace('_', ' ')}:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Mumalieff. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendOrderConfirmationEmail = async (
  email: string,
  orderNumber: string,
  orderDetails: any
): Promise<boolean> => {
  const subject = `Order Confirmation - ${orderNumber}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .order-details { background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
          </div>
          <div class="content">
            <p>Thank you for your order!</p>
            <div class="order-details">
              <h3>Order #${orderNumber}</h3>
              <p>We've received your order and will process it shortly.</p>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Mumalieff. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};
