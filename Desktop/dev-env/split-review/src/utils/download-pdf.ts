import { jsPDF } from "jspdf"
import type { Document } from "../types"

/**
 * Renders a document's SVG page images into a real multi-page PDF and
 * triggers a browser download. Each SVG data-URI is rasterized onto a
 * canvas at 612×792 (US Letter at 72 dpi), then added as a JPEG page.
 */
export async function downloadDocumentAsPdf(
  doc: Document,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const PAGE_W = 612
  const PAGE_H = 792

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [PAGE_W, PAGE_H],
  })

  const canvas = document.createElement("canvas")
  canvas.width = PAGE_W * 2
  canvas.height = PAGE_H * 2
  const ctx = canvas.getContext("2d")!
  ctx.scale(2, 2)

  for (let i = 0; i < doc.pages.length; i++) {
    if (i > 0) pdf.addPage([PAGE_W, PAGE_H], "portrait")
    onProgress?.(i + 1, doc.pages.length)

    const page = doc.pages[i]
    const img = new Image()
    img.width = PAGE_W
    img.height = PAGE_H

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = page.pageImageUrl
    })

    ctx.clearRect(0, 0, PAGE_W, PAGE_H)
    ctx.drawImage(img, 0, 0, PAGE_W, PAGE_H)

    const jpegData = canvas.toDataURL("image/jpeg", 0.92)
    pdf.addImage(jpegData, "JPEG", 0, 0, PAGE_W, PAGE_H)
  }

  pdf.save(doc.fileName.replace(/\.pdf$/i, "") + ".pdf")
}
