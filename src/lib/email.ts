import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"Sistema IMGC" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Recuperación de Contraseña - Sistema IMGC</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sistema de Gestión de Activos IMGC</h1>
            </div>
            <div class="content">
              <h2>Recuperación de Contraseña</h2>
              <p>Has solicitado restablecer tu contraseña de administrador.</p>
              <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
              <p>Si el botón no funciona, copia y pega esta URL en tu navegador:</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              <p><strong>Este enlace expirará en 1 hora.</strong></p>
              <p>Si no solicitaste este cambio, ignora este mensaje.</p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Recuperación de Contraseña - Sistema IMGC

      Has solicitado restablecer tu contraseña de administrador.

      Para crear una nueva contraseña, visita: ${resetUrl}

      Este enlace expirará en 1 hora.

      Si no solicitaste este cambio, ignora este mensaje.
    `;

    await this.sendEmail({
      to: email,
      subject: 'Recuperación de Contraseña - Sistema IMGC',
      html,
      text,
    });
  }
}

export const emailService = new EmailService();