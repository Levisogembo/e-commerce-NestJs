import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { use } from 'passport';

@Injectable()
export class EmailsService {
  private transporter: nodemailer.Transporter;
  private compileTemplate(name: string, context: Record<string, any>): string {
    //const filePath = path.join(__dirname,'templates',`${name}.hbs`) for production
    const filePath = path.join(
      process.cwd(),
      'src',
      'emails',
      'templates',
      `${name}.hbs`,
    );
    const source = fs.readFileSync(filePath, 'utf-8');
    console.log(filePath);

    const template = handlebars.compile(source);
    return template(context);
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
      const html = this.compileTemplate('welcome', { user, currentYear });
      const info = this.transporter.sendMail({
        to,
        from: this.configService.get<string>('SMTP_USER'),
        subject: 'Welcome to our Store',
        attachments: [
          {
            filename: 'cart.png',
            path: path.resolve('./src/utils/logos/cart.png'),
            cid: 'companyLogo',
          },
        ],
        html,
      });
      console.log('email successfully sent to:', info);
      return { status: 'success' };
    } catch (error) {
      console.log(error);
      return { status: 'err', message: error.message };
    }
  }

  async sendVerificationEmail(to:string,verificationUrl:string,user:string){
    try {
      const currentYear = new Date().getFullYear();
      const html = this.compileTemplate('verify', { verificationUrl, currentYear, user});
      const info = this.transporter.sendMail({
        to,
        from: this.configService.get<string>('SMTP_USER'),
        subject: 'Verify Your Account',
        attachments: [
          {
            filename: 'cart.png',
            path: path.resolve('./src/utils/logos/cart.png'),
            cid: 'companyLogo',
          },
        ],
        html,
      });
      console.log('email successfully sent to:', info);
      return { status: 'success' };
    } catch (error) {
      console.log(error);
      return { status: 'err', message: error.message };
    }
  }

  async sendPasswordReset(to:string,resetUrl:string,user:string){
    try {
      const currentYear = new Date().getFullYear();
      const html = this.compileTemplate('passwordReset', { resetUrl, currentYear, user});
      const info = this.transporter.sendMail({
        to,
        from: this.configService.get<string>('SMTP_USER'),
        subject: 'Reset your password',
        attachments: [
          {
            filename: 'cart.png',
            path: path.resolve('./src/utils/logos/cart.png'),
            cid: 'companyLogo',
          },
        ],
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
