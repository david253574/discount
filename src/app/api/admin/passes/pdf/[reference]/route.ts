import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import PDFDocument from 'pdfkit'

export async function GET(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const user = await getSession()
    if (!user || user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { reference } = await params
    const credential = await prisma.discountCredential.findUnique({
      where: { reference }
    })

    if (!credential) {
      return new NextResponse('Pass not found', { status: 404 })
    }

    const allEligible = await prisma.discountEligibility.findMany({
      orderBy: { name: 'asc' }
    })

    const { searchParams } = new URL(request.url)
    const pin = searchParams.get('pin') || 'REDACTED'

    const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true })
    const chunks: Uint8Array[] = []

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))

      // Background color for every page
      doc.on('pageAdded', () => {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0a0a0a')
      })
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0a0a0a')

      const margin = 50;
      doc.x = margin;
      doc.y = margin;

      // Header Branding
      doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(10).text('CHRISTMAS DISCOUNT', 0, margin, { align: 'center', characterSpacing: 2, width: doc.page.width })
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(24).text('DISCOUNT PROGRAM', 0, doc.y + 5, { align: 'center', characterSpacing: 4, width: doc.page.width })
      
      // Selected Participant Info
      doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(10).text('ELIGIBLE PARTICIPANT', 0, doc.y + 40, { align: 'center', characterSpacing: 1, width: doc.page.width })
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text(credential.recipientName.toUpperCase(), 0, doc.y + 5, { align: 'center', characterSpacing: 2, width: doc.page.width })
      
      doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(10).text('PIN ISSUED', 0, doc.y + 30, { align: 'center', characterSpacing: 1, width: doc.page.width })
      doc.fillColor('#ffffff').font('Courier-Bold').fontSize(24).text(pin, 0, doc.y + 5, { align: 'center', characterSpacing: 4, width: doc.page.width })
      
      // Reset X for table
      doc.x = margin;
      doc.y = doc.y + 50;

      // Table layout config
      const tableTop = doc.y;
      const marginX = 50;
      const tableWidth = doc.page.width - marginX * 2;
      const rowHeight = 36;

      // Column definitions
      const colName = marginX + 20;
      const colAmount = marginX + 220;
      const colPin = marginX + 380;

      const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

      const drawTableHeader = (y: number) => {
        // Table Header Background
        doc.rect(marginX, y, tableWidth, 24).fill('#111111')
        doc.rect(marginX, y, tableWidth, 24).lineWidth(1).stroke('#222222')
        
        doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(10)
        doc.text('ELIGIBLE NAME', colName, y + 8, { characterSpacing: 1 })
        doc.text('AUTHORIZED AMOUNT', colAmount, y + 8, { characterSpacing: 1 })
        doc.text('PIN', colPin, y + 8, { characterSpacing: 1 })
        
        return y + 24;
      }

      let currentY = drawTableHeader(tableTop)

      for (const person of allEligible) {
        // Check pagination
        if (currentY + rowHeight > doc.page.height - margin) {
          doc.addPage()
          currentY = margin
          currentY = drawTableHeader(currentY)
        }

        const isSelected = person.name.toLowerCase() === credential.recipientName.toLowerCase()
        const finalAmt = person.amountToPay !== null ? person.amountToPay : null;

        if (isSelected) {
          // Highlighted Row
          doc.rect(marginX, currentY, tableWidth, rowHeight).fill('#111111')
          doc.rect(marginX, currentY, tableWidth, rowHeight).lineWidth(1).stroke('#333333')
          
          doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12)
          doc.text(person.name, colName, currentY + 12)
          
          doc.fillColor('#22c55e').font('Helvetica-Bold').fontSize(12)
          doc.text(finalAmt !== null ? formatCurrency(finalAmt) : '-', colAmount, currentY + 12)
          
          doc.fillColor('#ffffff').font('Courier-Bold').fontSize(12)
          doc.text(pin, colPin, currentY + 12, { characterSpacing: 2 })
        } else {
          // Normal Row
          doc.moveTo(marginX, currentY + rowHeight).lineTo(marginX + tableWidth, currentY + rowHeight).lineWidth(1).stroke('#1a1a1a')
          
          doc.fillColor('#9ca3af').font('Helvetica').fontSize(12)
          doc.text(person.name, colName, currentY + 12)
          
          doc.fillColor('#9ca3af').font('Helvetica').fontSize(12)
          doc.text(finalAmt !== null ? formatCurrency(finalAmt) : '-', colAmount, currentY + 12)
          
          // Secure Graphical Redaction for the PIN - No text written
          doc.rect(colPin, currentY + 10, 60, 16).fill('#222222')
          doc.fillColor('#555555').font('Helvetica-Bold').fontSize(8)
          doc.text('REDACTED', colPin + 8, currentY + 15, { characterSpacing: 1 })
        }

        currentY += rowHeight
      }

      doc.end()
    })

    const pdfBuffer = await pdfPromise

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Discount_Pass_${reference}.pdf"`
      }
    })
  } catch (error) {
    console.error('PDF error', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
