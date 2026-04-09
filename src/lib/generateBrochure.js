import jsPDF from 'jspdf';

/**
 * Generates a professional PDF brochure for a warehouse listing.
 * Uses jsPDF to draw a clean, branded layout with warehouse details.
 *
 * @param {Object} warehouse — Firestore warehouse document data
 */
export async function generateBrochure(warehouse) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = 0;

  // ── Color palette ──
  const orange   = [234, 88, 12];
  const darkBg   = [15, 23, 42];
  const textDark = [30, 41, 59];
  const textMid  = [100, 116, 139];
  const white    = [255, 255, 255];
  const lightBg  = [248, 250, 252];
  const emerald  = [16, 185, 129];

  // ── Helper: load image as base64 via server proxy (bypasses CORS) ──
  const loadImageAsBase64 = (url) => {
    return new Promise((resolve) => {
      if (!url) { resolve(null); return; }
      const proxyUrl = '/api/proxy-image?url=' + encodeURIComponent(url);
      fetch(proxyUrl)
        .then(res => {
          if (!res.ok) throw new Error('proxy fetch failed: ' + res.status);
          return res.blob();
        })
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        })
        .catch(() => resolve(null));
    });
  };

  // ── Helper: draw text that handles ₹ symbol properly ──
  const safeText = (text, x, yPos, opts) => {
    // Replace ₹ with Rs. for font compatibility
    const safe = String(text).replace(/₹/g, 'Rs.');
    pdf.text(safe, x, yPos, opts);
  };

  // ── Helper: fitted image (maintains aspect ratio, covers area) ──
  const addFittedImage = (imgData, x, yPos, maxW, maxH, format) => {
    try {
      pdf.addImage(imgData, format || 'JPEG', x, yPos, maxW, maxH);
      return true;
    } catch {
      return false;
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  Preload all images in parallel
  // ═══════════════════════════════════════════════════════════
  const photos = warehouse.photos || {};
  const [frontImg, insideImg, dockImg, rateImg] = await Promise.all([
    loadImageAsBase64(photos.frontView),
    loadImageAsBase64(photos.insideView),
    loadImageAsBase64(photos.dockArea),
    loadImageAsBase64(photos.rateCard),
  ]);

  const imageMap = {
    frontView: frontImg,
    insideView: insideImg,
    dockArea: dockImg,
    rateCard: rateImg,
  };

  // ═══════════════════════════════════════════════════════════
  //  PAGE 1 — Header + Hero Image + Details
  // ═══════════════════════════════════════════════════════════

  // ── Top header bar ──
  pdf.setFillColor(...darkBg);
  pdf.rect(0, 0, pageW, 44, 'F');

  // Orange accent line
  pdf.setFillColor(...orange);
  pdf.rect(0, 44, pageW, 2, 'F');

  // Brand name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(...white);
  pdf.text('Link2Logistics', margin, 18);

  // Tagline
  pdf.setFontSize(8);
  pdf.setTextColor(180, 185, 200);
  pdf.text('Smart Warehouse Marketplace', margin, 26);

  // Brochure label on right
  pdf.setFontSize(8);
  pdf.setTextColor(...orange);
  pdf.text('PROPERTY BROCHURE', pageW - margin, 18, { align: 'right' });
  pdf.setTextColor(180, 185, 200);
  pdf.setFontSize(7);
  pdf.text(
    new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    pageW - margin, 26, { align: 'right' }
  );

  y = 54;

  // ── Front View Image ──
  if (frontImg) {
    const imgH = 80;
    addFittedImage(frontImg, margin, y, contentW, imgH);

    // Dark overlay label at bottom of image
    pdf.setFillColor(0, 0, 0);
    const savedOpacity = pdf.internal.getGState && pdf.internal.getGState();
    try {
      pdf.setGState(new pdf.GState({ opacity: 0.6 }));
      pdf.rect(margin, y + imgH - 14, contentW, 14, 'F');
      pdf.setGState(new pdf.GState({ opacity: 1.0 }));
    } catch {
      pdf.setFillColor(30, 30, 30);
      pdf.rect(margin, y + imgH - 14, contentW, 14, 'F');
    }
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...white);
    pdf.text('FRONT VIEW', margin + 6, y + imgH - 5);

    y += imgH + 8;
  } else {
    y += 4;
  }

  // ── Warehouse Name ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(...textDark);
  const nameLines = pdf.splitTextToSize(warehouse.warehouseName || 'Warehouse', contentW);
  pdf.text(nameLines, margin, y);
  y += nameLines.length * 9 + 3;

  // ── Category + Verified badges ──
  const catText = (warehouse.warehouseCategory || 'General').toUpperCase();
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');

  // Category pill
  const catTw = pdf.getTextWidth(catText);
  const catPillW = catTw + 10;
  pdf.setFillColor(...orange);
  pdf.roundedRect(margin, y, catPillW, 7, 2, 2, 'F');
  pdf.setTextColor(...white);
  pdf.text(catText, margin + 5, y + 5);

  // Verified pill
  const verText = 'VERIFIED';
  const verTw = pdf.getTextWidth(verText);
  const verPillW = verTw + 10;
  pdf.setFillColor(...emerald);
  pdf.roundedRect(margin + catPillW + 4, y, verPillW, 7, 2, 2, 'F');
  pdf.setTextColor(...white);
  pdf.text(verText, margin + catPillW + 4 + 5, y + 5);
  y += 14;

  // ── Location ──
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...textMid);
  const locParts = [warehouse.addressWithZip, warehouse.city, warehouse.state].filter(Boolean);
  const locText = locParts.join(', ') || 'Location not specified';
  const locLines = pdf.splitTextToSize(locText, contentW);
  pdf.text(locLines, margin, y);
  y += locLines.length * 5 + 8;

  // ── Pricing Block ──
  const priceBoxH = 24;
  pdf.setFillColor(...darkBg);
  pdf.roundedRect(margin, y, contentW, priceBoxH, 3, 3, 'F');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(180, 185, 200);
  pdf.text('STARTING PRICE', margin + 10, y + 9);

  // Price value — use Rs. instead of ₹ for font compatibility
  const rawPrice = warehouse.pricingAmount || warehouse.storageRate;
  const priceStr = rawPrice
    ? 'Rs. ' + Number(rawPrice).toLocaleString('en-IN')
    : 'Contact Owner';

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(...white);
  pdf.text(priceStr, margin + 10, y + 19);

  // Unit text next to price
  const priceTextW = pdf.getTextWidth(priceStr);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(180, 185, 200);
  const unitStr = 'per ' + (warehouse.pricingUnit || 'sq ft') + ' / month';
  pdf.text(unitStr, margin + 10 + priceTextW + 5, y + 19);

  y += priceBoxH + 8;

  // ── Key Metrics Row ──
  const metrics = [
    { label: 'TOTAL AREA',    value: warehouse.totalArea     ? Number(warehouse.totalArea).toLocaleString() + ' sq ft' : 'N/A' },
    { label: 'AVAILABLE',     value: warehouse.availableArea ? Number(warehouse.availableArea).toLocaleString() + ' sq ft' : 'N/A' },
    { label: 'CLEAR HEIGHT',  value: warehouse.clearHeight   ? warehouse.clearHeight + ' ft' : 'N/A' },
    { label: 'DOCK DOORS',    value: warehouse.numberOfDockDoors || 'N/A' },
  ];

  const gap = 3;
  const cardW = (contentW - gap * 3) / 4;
  const cardH = 22;

  metrics.forEach((m, i) => {
    const x = margin + i * (cardW + gap);
    pdf.setFillColor(...lightBg);
    pdf.roundedRect(x, y, cardW, cardH, 2, 2, 'F');

    // Thin top accent
    pdf.setFillColor(...orange);
    pdf.rect(x, y, cardW, 1.5, 'F');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(...textMid);
    pdf.text(m.label, x + 4, y + 8);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...textDark);
    pdf.text(String(m.value), x + 4, y + 17);
  });

  y += cardH + 10;

  // ── Specifications Section ──
  const drawSpecSection = (title, specs, startY) => {
    const validSpecs = specs.filter(s => s.value && String(s.value).trim());
    if (validSpecs.length === 0) return startY;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...textDark);
    pdf.text(title, margin, startY);

    // Underline
    pdf.setDrawColor(230, 232, 236);
    pdf.setLineWidth(0.3);
    pdf.line(margin, startY + 2, pageW - margin, startY + 2);
    startY += 8;

    validSpecs.forEach((s, i) => {
      const rowY = startY + i * 8;

      // Alternating row background
      if (i % 2 === 0) {
        pdf.setFillColor(250, 250, 252);
        pdf.rect(margin, rowY - 3, contentW, 8, 'F');
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...textMid);
      pdf.text(s.label, margin + 4, rowY + 2);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...textDark);
      pdf.text(String(s.value), pageW - margin - 4, rowY + 2, { align: 'right' });
    });

    return startY + validSpecs.length * 8 + 6;
  };

  y = drawSpecSection('Warehouse Specifications', [
    { label: 'Construction Type',  value: warehouse.typeOfConstruction },
    { label: 'Container Handling', value: warehouse.containerHandling },
    { label: 'Warehouse Age',      value: warehouse.warehouseAge },
    { label: 'WMS Available',      value: warehouse.wmsAvailable },
    { label: 'Storage Types',      value: warehouse.storageTypes?.join(', ') },
  ], y);

  y = drawSpecSection('Operations', [
    { label: 'Operating Hours',    value: warehouse.operationTime },
    { label: 'Days of Operation',  value: warehouse.daysOfOperation },
    { label: 'Min Commitment',     value: warehouse.minCommitment },
    { label: 'Short-Term Storage', value: warehouse.shortTermStorage },
    { label: 'Inbound Handling',   value: warehouse.inboundHandling },
    { label: 'Outbound Handling',  value: warehouse.outboundHandling },
  ], y);

  // ── Amenities (if fits on page 1, else will go to page 2) ──
  const amenities = warehouse.amenities || [];
  const securityFeatures = warehouse.securityFeatures || [];

  // ═══════════════════════════════════════════════════════════
  //  PAGE 2 — Photos + Amenities + Contact
  // ═══════════════════════════════════════════════════════════
  pdf.addPage();

  // Mini header bar
  pdf.setFillColor(...darkBg);
  pdf.rect(0, 0, pageW, 12, 'F');
  pdf.setFillColor(...orange);
  pdf.rect(0, 12, pageW, 1.5, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(...white);
  pdf.text('Link2Logistics', margin, 8);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(180, 185, 200);
  pdf.text(warehouse.warehouseName || '', pageW - margin, 8, { align: 'right' });

  y = 20;

  // ── Photo Gallery ──
  const galleryPhotos = [
    { key: 'frontView',  label: 'Front View',  img: frontImg },
    { key: 'insideView', label: 'Inside View', img: insideImg },
    { key: 'dockArea',   label: 'Dock Area',   img: dockImg },
    { key: 'rateCard',   label: 'Rate Card',   img: rateImg },
  ].filter(p => p.img);

  if (galleryPhotos.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...textDark);
    pdf.text('Photo Gallery', margin, y);
    y += 6;

    // Layout: 2 columns
    const colGap = 4;
    const imgW = (contentW - colGap) / 2;
    const imgH = 55;

    galleryPhotos.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + col * (imgW + colGap);
      const imgY = y + row * (imgH + 12);

      // Check page overflow
      if (imgY + imgH + 14 > pageH - 30) {
        // Don't draw — would overflow
        return;
      }

      addFittedImage(p.img, x, imgY, imgW, imgH);

      // Label bar at bottom of image
      pdf.setFillColor(30, 30, 30);
      pdf.rect(x, imgY + imgH - 10, imgW, 10, 'F');
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...white);
      pdf.text(p.label.toUpperCase(), x + 4, imgY + imgH - 3);
    });

    const totalRows = Math.ceil(galleryPhotos.length / 2);
    y += totalRows * (imgH + 12) + 4;
  }

  // ── Amenities Section ──
  if (amenities.length > 0) {
    if (y + 30 > pageH - 40) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...textDark);
    pdf.text('Premium Amenities', margin, y);
    y += 7;

    const chipH = 7;
    let chipX = margin;
    pdf.setFontSize(7);

    amenities.forEach((a) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      const tw = pdf.getTextWidth(a) + 14;

      if (chipX + tw > pageW - margin) {
        chipX = margin;
        y += chipH + 3;
      }

      // Chip background
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(chipX, y, tw, chipH, 2, 2, 'F');

      // Green dot
      pdf.setFillColor(...emerald);
      pdf.circle(chipX + 5, y + chipH / 2, 1, 'F');

      // Text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...textDark);
      pdf.text(a, chipX + 9, y + 5);

      chipX += tw + 3;
    });

    y += chipH + 10;
  }

  // ── Security Features ──
  if (securityFeatures.length > 0) {
    if (y + 20 > pageH - 40) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...textDark);
    pdf.text('Security Features', margin, y);
    y += 7;

    securityFeatures.forEach((f) => {
      pdf.setFillColor(...emerald);
      pdf.circle(margin + 3, y + 1, 1, 'F');

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...textDark);
      pdf.text(String(f), margin + 8, y + 2.5);
      y += 7;
    });

    y += 6;
  }

  // ── Suitable Goods ──
  const suitableGoods = warehouse.suitableGoods || [];
  if (suitableGoods.length > 0) {
    if (y + 20 > pageH - 40) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...textDark);
    pdf.text('Suitable For', margin, y);
    y += 7;

    let chipX = margin;
    const chipH = 7;

    suitableGoods.forEach((g) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      const tw = pdf.getTextWidth(g) + 12;

      if (chipX + tw > pageW - margin) {
        chipX = margin;
        y += chipH + 3;
      }

      pdf.setFillColor(254, 243, 199); // amber-100
      pdf.roundedRect(chipX, y, tw, chipH, 2, 2, 'F');
      pdf.setTextColor(...textDark);
      pdf.text(g, chipX + 6, y + 5);

      chipX += tw + 3;
    });

    y += chipH + 10;
  }

  // ── Contact Information Box ──
  if (y + 44 > pageH - 20) {
    pdf.addPage();
    y = 20;
  }

  const contactBoxH = 38;
  pdf.setFillColor(...darkBg);
  pdf.roundedRect(margin, y, contentW, contactBoxH, 3, 3, 'F');

  // Orange accent on left
  pdf.setFillColor(...orange);
  pdf.rect(margin, y, 3, contactBoxH, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...orange);
  pdf.text('Contact Information', margin + 12, y + 10);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...white);

  const contactLines = [
    warehouse.contactPerson ? 'Contact Person:  ' + warehouse.contactPerson : null,
    warehouse.companyName   ? 'Company:  ' + warehouse.companyName : null,
    warehouse.businessType  ? 'Business Type:  ' + warehouse.businessType : null,
  ].filter(Boolean);

  contactLines.forEach((line, i) => {
    pdf.text(line, margin + 12, y + 18 + i * 7);
  });

  y += contactBoxH + 10;

  // ── Google Maps Link ──
  if (warehouse.googleMapPin) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...textMid);
    pdf.text('Google Maps: ' + warehouse.googleMapPin, margin, y);
    y += 8;
  }

  // ── Footer ──
  const footerY = pageH - 14;
  pdf.setFillColor(...lightBg);
  pdf.rect(0, footerY - 2, pageW, 16, 'F');
  pdf.setDrawColor(230, 232, 236);
  pdf.line(0, footerY - 2, pageW, footerY - 2);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(...textMid);
  pdf.text(
    'Generated by Link2Logistics  |  link2logistics.in  |  All information is subject to verification.',
    pageW / 2, footerY + 5, { align: 'center' }
  );

  // Also add footer to page 1
  pdf.setPage(1);
  pdf.setFillColor(...lightBg);
  pdf.rect(0, footerY - 2, pageW, 16, 'F');
  pdf.setDrawColor(230, 232, 236);
  pdf.line(0, footerY - 2, pageW, footerY - 2);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(...textMid);
  pdf.text(
    'Generated by Link2Logistics  |  link2logistics.in  |  Page 1 of 2',
    pageW / 2, footerY + 5, { align: 'center' }
  );

  // ── Save ──
  const safeName = (warehouse.warehouseName || 'warehouse')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_');
  pdf.save(`${safeName}_Brochure.pdf`);
}
