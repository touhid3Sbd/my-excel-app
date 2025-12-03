// app/api/template/route.js
// CLEAN BLUE HEADER – NO PINK ANYWHERE
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('People');

    // Define your columns (change keys to match your actual data)
    sheet.columns = [
      { header: 'name', key: 'name', width: 25 },
      { header: 'age', key: 'age', width: 12 },
      { header: 'email', key: 'email', width: 35 },
      { header: 'city', key: 'city', width: 20 },
      { header: 'phone', key: 'phone', width: 20 },
    ];

    // Sample row
    sheet.addRow({
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
      city: 'New York',
      phone: '123-456-7890'
    });

    // CLEAN BLUE HEADER (instead of pink)
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };     // White text
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }   // Modern blue (instead of pink FFF06292)
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=excel-template.xlsx',
      },
    });
  } catch (error) {
    console.error(error);
    return new Response('Error generating template', { status: 500 });
  }
}