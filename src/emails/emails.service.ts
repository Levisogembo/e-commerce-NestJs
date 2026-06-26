import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';

@Injectable()
export class EmailsService {
  private transporter: nodemailer.Transporter;

  private compileTemplate(name: string, context: Record<string, any>): string {
    const filePath = path.join(
      process.cwd(),
      'src',
      'emails',
      'templates',
      `${name}.hbs`,
    );
    const source = fs.readFileSync(filePath, 'utf-8');
    const template = handlebars.compile(source);
    return template(context);
  }

  private getLogoAttachment(): nodemailer.SendMailOptions['attachments'] {
    return [
      {
        filename: 'cart.png',
        path: path.join(process.cwd(), 'src', 'utils', 'logos', 'cart.png'),
        cid: 'companyLogo',
        contentDisposition: 'inline',
        contentType: 'image/png',
      },
    ];
  }

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: configService.get<string>('SMTP_USER'),
        pass: configService.get<string>('SMTP_PASS'),
      },
      logger: true,
      debug: true,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendWelcomeMessage(to: string, user: string) {
    try {
      const currentYear = new Date().getFullYear();
      const loginUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:5173',
      );
      const html = this.compileTemplate('welcome', {
        user,
        currentYear,
        loginUrl,
      });
      const info = await this.transporter.sendMail({
        to,
        from: this.configService.get<string>('SMTP_USER'),
        subject: 'Welcome to our Store',
        attachments: this.getLogoAttachment(),
        html,
      });
      console.log('email successfully sent to:', info);
      return { status: 'success' };
    } catch (error) {
      console.log(error);
      return { status: 'err', message: error.message };
    }
  }

  async sendVerificationEmail(
    to: string,
    verificationUrl: string,
    user: string,
  ) {
    try {
      const currentYear = new Date().getFullYear();
      const html = this.compileTemplate('verify', {
        verificationUrl,
        currentYear,
        user,
      });
      const info = await this.transporter.sendMail({
        to,
        from: this.configService.get<string>('SMTP_USER'),
        subject: 'Verify Your Account',
        attachments: this.getLogoAttachment(),
        html,
      });
      console.log('email successfully sent to:', info);
      return { status: 'success' };
    } catch (error) {
      console.log(error);
      return { status: 'err', message: error.message };
    }
  }

  async sendPasswordReset(to: string, resetUrl: string, user: string) {
    try {
      const currentYear = new Date().getFullYear();
      const html = this.compileTemplate('passwordReset', {
        resetUrl,
        currentYear,
        user,
      });
      const info = await this.transporter.sendMail({
        to,
        from: this.configService.get<string>('SMTP_USER'),
        subject: 'Reset your password',
        attachments: this.getLogoAttachment(),
        html,
      });
      console.log('email successfully sent to:', info);
      return { status: 'success' };
    } catch (error) {
      console.log(error);
      return { status: 'err', message: error.message };
    }
  }

  async sendOrderSuccess(
    to: string,
    subject: string,
    template: string,
    data: Record<string, any>,
  ) {
    try {
      if (template === 'orderSuccess') {
        template = 'orderSuccess';
      } else if (template === 'orderFailure') {
        template = 'orderFailure';
      } else {
        template = 'reversalConfirmation';
      }
      const html = this.compileTemplate(template, { data });
      const info = await this.transporter.sendMail({
        to,
        from: this.configService.get<string>('SMTP_USER'),
        subject,
        html,
      });
      console.log('email successfully sent to:', info);
      return { status: 'success' };
    } catch (error) {
      console.log(error);
      return { status: 'err', message: error.message };
    }
  }
}
