import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Orders } from 'src/typeorm/entities/Order';
import { Repository } from 'typeorm';
import { orderStatus } from './Dtos/status.enum';
import * as PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Orders) private ordersRepository: Repository<Orders>,
  ) {}

  async generateInvoice(orderId: string): Promise<Buffer | any> {
    const order = await this.ordersRepository.findOne({
      where: { orderId },
      relations: ['orderItems', 'orderItems.Product', 'user', 'payments'],
      select: {
        user: { userId: true, firstName: true, lastName: true, email: true },
      },
    });
    if (!order) throw new NotFoundException('order not found');
    const invoiceStatuses = [
      orderStatus.COMPLETED,
      orderStatus.SHIPPED,
      orderStatus.DELIVERED,
    ];
    if (!invoiceStatuses.includes(order.status))
      throw new BadRequestException(
        'Invoice only available for shipped or paid orders',
      );
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    //convert pdf into a buffer
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => {
      buffers.push(chunk);
    });

    doc
      .fillColor('#10B981') // emerald
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('ELIXIR STORE', {
        align: 'center',
      });

    doc.moveDown(0.3);

    doc
      .fillColor('black')
      .fontSize(18)
      .font('Helvetica')
      .text('ORDER INVOICE', {
        align: 'center',
      });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#D1D5DB').stroke();
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(11).text(`Invoice No:`, 50, doc.y);

    doc
      .font('Helvetica')
      .text(
        `INV-${order.orderNumber ?? order.orderId.substring(0, 8)}`,
        130,
        doc.y - 15,
      );
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').text(`Order No:`, 50);

    doc
      .font('Helvetica')
      .text(order.orderNumber ?? order.orderId, 130, doc.y - 15);
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').text(`Date:`, 50); //this specifies aligning of text value by modifying x-coordinates

    doc.font('Helvetica').text(
      new Date(order.createdAt).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      130, //this specifies aligning of text value by modifying x-coordinates
      doc.y - 15,
    );
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#D1D5DB').stroke();
    doc.moveDown();
    const sectionTop = doc.y;
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#10B981')
      .text('BILL TO', 50, sectionTop);

    doc
      .moveDown(0.5)
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('black')
      .text(`${order.user.firstName} ${order.user.lastName}`, 50);

    doc
      .moveDown(0.3)
      .font('Helvetica')
      .fontSize(11)
      .fillColor('gray')
      .text(order.user.email, 50);

    doc.moveDown(0.3).fillColor('black').text(order.billingAddress, 50, doc.y, {
      width: 220,
    });

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#10B981')
      .text('PAYMENT DETAILS', 330, sectionTop);

    const formattedDate = order.paidAt
      ? new Date(order.paidAt).toLocaleDateString('en-KE', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '-';
    doc.fillColor('black');

    const paymentX = 330;
    const valueX = 430;

    let y = sectionTop + 25;

    doc.font('Helvetica-Bold').fontSize(11).text('Status:', paymentX, y);
    doc.font('Helvetica').fontSize(11).text(order.status, valueX, y);

    y += 20;

    doc.font('Helvetica-Bold').fontSize(11).text('Method:', paymentX, y);
    doc.font('Helvetica').fontSize(11).text(order.paymentMethod, valueX, y);

    y += 20;

    doc.font('Helvetica-Bold').fontSize(11).text('Paid:', paymentX, y);
    doc.font('Helvetica').fontSize(11).text(formattedDate, valueX, y);

    y += 20;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('Transaction ID:', paymentX, y);
    doc
      .font('Helvetica')
      .fontSize(11)
      .text(order.transactionId ?? '-', valueX, y);
    doc.y = Math.max(doc.y, sectionTop + 90);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#D1D5DB').stroke();

    doc.moveDown();

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#10B981')
      .text('PRODUCTS', 50);

    doc.moveDown(0.8);
    //defining column positions
    doc.fillColor('black');
    const productX = 50;
    const qtyX = 310;
    const priceX = 380;
    const subtotalX = 480;

    let tableY = doc.y;

    doc.font('Helvetica-Bold').fontSize(11);

    doc.text('Product', productX, tableY);

    doc.text('Qty', qtyX, tableY, {
      width: 40,
      align: 'center',
    });

    doc.text('Unit Price', priceX, tableY, {
      width: 70,
      align: 'right',
    });

    doc.text('Subtotal', subtotalX, tableY, {
      width: 65,
      align: 'right',
    });

    //separator
    tableY += 18;

    doc
      .moveTo(productX, tableY)
      .lineTo(545, tableY)
      .strokeColor('#D1D5DB')
      .stroke();
    tableY += 10;

    order.orderItems.forEach((item) => {
      doc.font('Helvetica').fontSize(10);

      doc.text(item.Product.name, productX, tableY, {
        width: 220,
      });

      doc.text(item.quantity.toString(), qtyX, tableY, {
        width: 40,
        align: 'center',
      });

      doc.text(`Ksh ${item.unitPrice.toLocaleString()}`, priceX, tableY, {
        width: 70,
        align: 'right',
      });

      doc.text(
        `Ksh ${(item.unitPrice * item.quantity).toLocaleString()}`,
        subtotalX,
        tableY,
        {
          width: 65,
          align: 'right',
        },
      );

      tableY += 24;

      doc
        .moveTo(productX, tableY - 6)
        .lineTo(545, tableY - 6)
        .strokeColor('#F3F4F6')
        .stroke();
    });
    doc.y = tableY + 10;

    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#D1D5DB').stroke();

    doc.moveDown();
    const labelX = 360;
    const valuesX = 470;

    let summaryY = doc.y;
    const subTotal = order.orderItems.reduce(
      (sum, item) => sum + item.subTotal,
      0,
    );
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('black')
      .text('Subtotal', labelX, summaryY);

    doc.text(`Ksh ${subTotal.toLocaleString()}`, valuesX, summaryY, {
      width: 70,
      align: 'right',
    });

    summaryY += 22;

    doc.text('Discount', labelX, summaryY);

    doc.text(
      `Ksh ${(order.discountAmount ?? 0).toLocaleString()}`,
      valuesX,
      summaryY,
      {
        width: 70,
        align: 'right',
      },
    );

    summaryY += 24;

    doc
      .moveTo(labelX, summaryY)
      .lineTo(545, summaryY)
      .lineWidth(1.5)
      .strokeColor('#6B7280')
      .stroke();

    summaryY += 12;

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#10B981')
      .text('TOTAL', labelX, summaryY);

    doc.text(`Ksh ${order.total.toLocaleString()}`, valuesX, summaryY, {
      width: 70,
      align: 'right',
    });

    doc.fillColor('black').font('Helvetica').fontSize(11);
    //doc.moveDown(4);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#D1D5DB')
      .lineWidth(1)
      .stroke();

    // doc.moveDown();
    doc.x = 50;
    doc.y = Math.max(doc.y + 20, 720);
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#10B981')
      .text('Thank you for shopping with Elixir Store!', {
        align: 'center',
      });

    doc.moveDown(0.5);
    doc.fillColor('gray').font('Helvetica').fontSize(10);

    doc.text(
      'If you have any questions regarding this invoice, please contact us.',
      {
        align: 'center',
      },
    );

    doc.moveDown(0.5);

    doc.text('support@elixirstore.com', {
      align: 'center',
    });

    doc.text('www.elixirstore.com', {
      align: 'center',
    });

    doc.moveDown();
    doc
      .fontSize(9)
      .fillColor('#9CA3AF')
      .text(
        'This invoice was generated electronically and is valid without a signature.',
        {
          align: 'center',
        },
      );
    doc.moveDown();

    doc
      .fontSize(8)
      .fillColor('#9CA3AF')
      .text(`Generated on ${new Date().toLocaleString('en-KE')}`, {
        align: 'center',
      });
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      doc.on('error', reject);

      doc.end();
    });
  }
}
