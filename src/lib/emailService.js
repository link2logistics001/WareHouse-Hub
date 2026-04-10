import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Professional Email Service for Link2Logistics
 */
export const sendVerificationEmail = async (email, name, verificationLink) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Link2Logistics <onboarding@resend.dev>', // You should update this to your domain later
      to: [email],
      subject: 'Verify your Link2Logistics account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: 800; color: #E65100; letter-spacing: -1px; }
            .card { background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 0; }
            p { margin-bottom: 24px; }
            .button { display: inline-block; background-color: #E65100; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; text-align: center; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; }
            .divider { border-top: 1px solid #e2e8f0; margin: 32px 0; }
          </style>
        </head>
        <body>
          <div className="container">
            <div className="header">
              <div className="logo">Link2Logistics</div>
            </div>
            <div className="card">
              <h1>Welcome, ${name}!</h1>
              <p>Thank you for joining Link2Logistics. To get started, please verify your email address by clicking the button below:</p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationLink}" className="button">Verify Email Address</a>
              </div>
              <p style="font-size: 14px; color: #64748b;">
                If you did not create an account with us, you can safely ignore this email.
              </p>
              <div className="divider"></div>
              <p>Thanks,<br><strong>Link2Logistics Team</strong></p>
            </div>
            <div className="footer">
              &copy; 2026 Link2Logistics. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Email service exception:', err);
    return { success: false, error: err.message };
  }
};
