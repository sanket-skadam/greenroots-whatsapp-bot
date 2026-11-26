import PDFDocument from 'pdfkit';

export interface ReceiptData {
  orderId: string;
  paypalOrderId: string;
  wasteType: string;
  quantityTons: number;
  totalInr: number;
  totalUsd: string;
  farmerName: string;
  location: string;
  payoutNote: string;
}

export function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).fillColor('#1B5E20').text('GreenRoots Marketplace', { align: 'center' });
    doc.fontSize(11).fillColor('#555555').text('Verified PayPal Sandbox Transaction Receipt', {
      align: 'center',
    });
    doc.moveDown(1.5);

    doc.fillColor('#000000').fontSize(12);
    doc.text(`Receipt ID: ${data.orderId}`);
    doc.text(`PayPal Order ID: ${data.paypalOrderId}`);
    doc.text(`Date: ${new Date().toISOString()}`);
    doc.moveDown();

    doc.fontSize(13).text('Transaction Details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Crop Waste Type: ${data.wasteType}`);
    doc.text(`Quantity: ${data.quantityTons} Tons`);
    doc.text(`Seller (Farmer): ${data.farmerName}`);
    doc.text(`Pickup Location: ${data.location}`);
    doc.moveDown();

    doc.fontSize(13).text('Payment Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Total (INR): INR ${data.totalInr.toLocaleString('en-IN')}`);
    doc.text(`Settled via PayPal Sandbox (USD): $${data.totalUsd}`);
    doc.text(`Farmer Payout Status: ${data.payoutNote}`);
    doc.moveDown(2);

    doc
      .fontSize(10)
      .fillColor('#2E7D32')
      .text(
        'Environmental Impact: Preventing open-field stubble burning saves ~1.4 tons of CO2e per ton of biomass.',
        { align: 'center' }
      );

    doc.end();
  });
}

