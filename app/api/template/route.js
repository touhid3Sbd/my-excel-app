// app/api/template/route.js → FIXED: TEMPLATE WITH YOUR EXCEL HEADERS
import { NextResponse } from 'next/server';
import { Workbook } from 'exceljs';

export async function GET() {
  const wb = new Workbook();
  const ws = wb.addWorksheet('Template');

  // YOUR EXCEL HEADERS
  ws.addRow([
    'Sl', 'Client Name', 'Status', 'Teritory', 'Parent', 'Software', 'Collector', 'Rep', 'OTC', 'MRC',
    'Month Added', 'SC From', 'Remarks', 'OtoMatic', 'Status1', 'Control Hub', 'Contract Paper',
    'Zone', 'Ultra Viwer', 'Contacts_1', 'Owner Name', 'Phone Number', 'Manager Name', 'Phone Number1'
  ]);

  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=template.xlsx'
    }
  });
}