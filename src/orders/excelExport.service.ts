import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportExcelService {
  async generateExcel(orders: any[]) {
    const workBook = new ExcelJS.Workbook();
    const workSheet = workBook.addWorksheet('Orders');
    workSheet.columns = [
      {
        header: 'Order Number',
        key: 'orderNumber',
        width: 20,
      },

      {
        header: 'Customer',
        key: 'customer',
        width: 25,
      },

      {
        header: 'Email',
        key: 'email',
        width: 30,
      },

      {
        header: 'Product',
        key: 'product',
        width: 30,
      },

      {
        header: 'Quantity',
        key: 'quantity',
        width: 12,
      },

      {
        header: 'Unit Price',
        key: 'unitPrice',
        width: 15,
      },

      {
        header: 'Amount',
        key: 'amount',
        width: 15,
      },

      {
        header: 'Order Total',
        key: 'total',
        width: 15,
      },

      {
        header: 'Status',
        key: 'status',
        width: 20,
      },

      {
        header: 'Payment Method',
        key: 'paymentMethod',
        width: 20,
      },

      {
        header: 'Paid At',
        key: 'paidAt',
        width: 25,
      },
    ];

    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        workSheet.addRow({
          orderNumber: order.orderNumber || order.orderId,

          customer: `${order.user.firstName} ${order.user.lastName}`,

          email: order.user.email,

          product: item.Product.name,

          quantity: item.quantity,

          unitPrice: item.unitPrice,

          amount: item.unitPrice * item.quantity,

          total: order.total,

          status: order.status,

          paymentMethod: order.paymentMethod,

          paidAt: order.paidAt ? order.paidAt.toISOString() : '',
        });
      });
    });

    workSheet.getRow(1).font = { bold: true };
    return await workBook.xlsx.writeBuffer();
  }
}
