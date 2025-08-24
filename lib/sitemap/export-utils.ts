import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Node, Edge } from 'reactflow'

export async function toPng(element: HTMLElement, options: any = {}) {
  const canvas = await html2canvas(element, {
    backgroundColor: options.backgroundColor || '#111827',
    scale: 2,
    logging: false,
    ...options
  })
  return canvas.toDataURL('image/png')
}

export async function toPdf(element: HTMLElement, options: any = {}) {
  const canvas = await html2canvas(element, {
    backgroundColor: '#111827',
    scale: 2,
    logging: false
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height]
  })

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
  
  // Add metadata
  if (options.projectName) {
    pdf.setProperties({
      title: options.projectName,
      subject: 'Sitemap Export',
      author: 'Sitemap Builder',
      keywords: 'sitemap, website, structure',
      creator: 'Catalyst Studio'
    })
  }

  // Add page with node details
  if (options.nodes) {
    pdf.addPage()
    pdf.setFontSize(20)
    pdf.text('Sitemap Details', 20, 30)
    
    let yPosition = 60
    pdf.setFontSize(12)
    
    options.nodes.forEach((node: Node, index: number) => {
      if (yPosition > pdf.internal.pageSize.height - 30) {
        pdf.addPage()
        yPosition = 30
      }
      
      pdf.text(`${index + 1}. ${node.data.label}`, 20, yPosition)
      if (node.data.url) {
        pdf.setFontSize(10)
        pdf.text(`   URL: ${node.data.url}`, 30, yPosition + 15)
        pdf.setFontSize(12)
        yPosition += 15
      }
      yPosition += 20
    })
  }

  pdf.save(options.filename || 'sitemap.pdf')
}