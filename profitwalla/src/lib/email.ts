import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Profitwalla <notifications@profitwalla.com>';
const SUPPORT_EMAIL = 'support@profitwalla.com';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY not configured, skipping email');
      return false;
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

export async function sendApplicationReceived(
  clientEmail: string,
  clientName: string
): Promise<boolean> {
  return sendEmail({
    to: clientEmail,
    subject: 'Application Received - Profitwalla',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #00D4AA;">Application Received</h2>
        <p>Hi ${clientName},</p>
        <p>We've received your onboarding application. Our team will review your information and get back to you within 24-48 hours.</p>
        <p>You can check your application status anytime by logging in with your mobile number at <a href="https://profitwalla.com/login">profitwalla.com/login</a></p>
        <br/>
        <p>Best regards,<br/>Profitwalla Team</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #888;">Trading involves risk. Past performance does not guarantee future results.</p>
      </div>
    `,
  });
}

export async function sendStatusUpdate(
  clientEmail: string,
  clientName: string,
  newStatus: string,
  details?: string
): Promise<boolean> {
  const statusMessages: Record<string, { title: string; message: string }> = {
    reviewing: {
      title: 'Application Under Review',
      message: 'Our team is now reviewing your application. We\'ll update you shortly.',
    },
    approved: {
      title: 'Application Approved',
      message: 'Your application has been approved! We\'ll connect your account to our copy trading system shortly.',
    },
    pushed: {
      title: 'Account Being Connected',
      message: 'Your account is now being connected to our copy trading infrastructure. This typically takes 1-2 hours.',
    },
    connected: {
      title: 'Copy Trading Active',
      message: 'Your account is now connected and trades are being mirrored automatically. You can monitor your account through your MT5 terminal.',
    },
    rejected: {
      title: 'Application Not Approved',
      message: 'Unfortunately, your application could not be approved at this time. Please contact support for more information.',
    },
  };

  const statusInfo = statusMessages[newStatus];
  if (!statusInfo) return false;

  return sendEmail({
    to: clientEmail,
    subject: `${statusInfo.title} - Profitwalla`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #00D4AA;">${statusInfo.title}</h2>
        <p>Hi ${clientName},</p>
        <p>${statusInfo.message}</p>
        ${details ? `<p><strong>Details:</strong> ${details}</p>` : ''}
        <p>You can check your dashboard anytime at <a href="https://profitwalla.com/login">profitwalla.com/login</a></p>
        <br/>
        <p>Best regards,<br/>Profitwalla Team</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #888;">Trading involves risk. Past performance does not guarantee future results.</p>
      </div>
    `,
  });
}

export async function sendAdminNotification(
  adminEmail: string,
  clientName: string,
  action: string
): Promise<boolean> {
  return sendEmail({
    to: adminEmail,
    subject: `[Admin] ${action} - ${clientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #00D4AA;">Admin Notification</h2>
        <p><strong>Client:</strong> ${clientName}</p>
        <p><strong>Action:</strong> ${action}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        <br/>
        <p>Login to admin panel: <a href="https://profitwalla.com/admin">profitwalla.com/admin</a></p>
      </div>
    `,
  });
}

export async function sendContactFormNotification(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<boolean> {
  return sendEmail({
    to: SUPPORT_EMAIL,
    subject: `[Contact Form] ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #00D4AA;">New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">${message}</p>
      </div>
    `,
  });
}
