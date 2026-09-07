import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

type AnalysisLike = {
  type?: string;
  createdAt?: string;
  cvText?: string;
  jobDescription?: string;
  analysis?: any;
  rewrittenCv?: string | null;
};

export async function generateAnalysisPdf(item: AnalysisLike, fileName = 'analysis.pdf') {
  if (!item) return;

  // Build a clean HTML representation
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.padding = '24px';
  container.style.background = '#ffffff';
  container.style.color = '#111827';
  container.style.fontFamily = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
  container.style.lineHeight = '1.4';

  const title = document.createElement('h1');
  title.textContent = item.analysis?.match_label || 'Analysis Report';
  title.style.fontSize = '22px';
  title.style.margin = '0 0 8px 0';
  container.appendChild(title);

  const meta = document.createElement('div');
  meta.style.fontSize = '12px';
  meta.style.color = '#6b7280';
  meta.textContent = `Type: ${item.type || 'analysis'} • ${item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}`;
  container.appendChild(meta);

  if (item.jobDescription) {
    const jdTitle = document.createElement('h3'); jdTitle.textContent = 'Job Description'; jdTitle.style.marginTop = '18px'; jdTitle.style.fontSize = '14px'; container.appendChild(jdTitle);
    const jd = document.createElement('div'); jd.style.fontSize = '12px'; jd.style.marginTop = '6px'; jd.textContent = item.jobDescription; container.appendChild(jd);
  }

  if (item.cvText) {
    const cvTitle = document.createElement('h3'); cvTitle.textContent = 'Resume'; cvTitle.style.marginTop = '18px'; cvTitle.style.fontSize = '14px'; container.appendChild(cvTitle);
    const cv = document.createElement('div'); cv.style.fontSize = '12px'; cv.style.marginTop = '6px'; cv.textContent = item.cvText; container.appendChild(cv);
  }

  const analysis = item.analysis || {};
  const summaryTitle = document.createElement('h3'); summaryTitle.textContent = 'Summary'; summaryTitle.style.marginTop = '18px'; summaryTitle.style.fontSize = '14px'; container.appendChild(summaryTitle);
  const summary = document.createElement('div'); summary.style.fontSize = '12px'; summary.style.marginTop = '6px'; summary.textContent = analysis.summary || '';
  container.appendChild(summary);

  // Key/value pairs
  const fields = [
    ['Match Score', analysis.match_score],
    ['Label', analysis.match_label],
  ];
  const kvWrap = document.createElement('div'); kvWrap.style.marginTop = '12px';
  fields.forEach(([k,v]) => {
    if (v === undefined || v === null || v === '') return;
    const row = document.createElement('div'); row.style.display = 'flex'; row.style.justifyContent = 'space-between'; row.style.fontSize = '12px'; row.style.marginTop = '6px';
    const key = document.createElement('div'); key.textContent = String(k); key.style.color = '#6b7280';
    const val = document.createElement('div'); val.textContent = String(v); val.style.fontWeight = '600';
    row.appendChild(key); row.appendChild(val); kvWrap.appendChild(row);
  });
  container.appendChild(kvWrap);

  // Lists: strengths, weaknesses, missing_skills
  const listSections: Array<[string, any]> = [
    ['Strengths', analysis.strengths || []],
    ['Weaknesses', analysis.weaknesses || []],
    ['Missing Skills', analysis.missing_skills || []],
  ];
  listSections.forEach(([titleText, arr]) => {
    if (!arr || arr.length === 0) return;
    const h = document.createElement('h4'); h.textContent = titleText; h.style.marginTop = '14px'; h.style.fontSize = '13px'; container.appendChild(h);
    const ul = document.createElement('ul'); ul.style.marginTop = '6px'; ul.style.paddingLeft = '18px'; ul.style.fontSize = '12px';
    (arr as any[]).forEach((it) => { const li = document.createElement('li'); li.textContent = String(it); ul.appendChild(li); });
    container.appendChild(ul);
  });

  if (item.rewrittenCv) {
    const h = document.createElement('h4'); h.textContent = 'Rewritten CV'; h.style.marginTop = '14px'; h.style.fontSize = '13px'; container.appendChild(h);
    const div = document.createElement('div'); div.style.marginTop = '6px'; div.style.fontSize = '12px'; div.textContent = item.rewrittenCv; container.appendChild(div);
  }

  // Attach off-DOM, render to canvas, and save
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate pixel-to-mm ratio and page slice height in pixels
    const pxPerMm = canvas.width / pageWidth;
    const pageHeightPx = Math.floor(pageHeight * pxPerMm);

    let y = 0;
    const imgWidth = pageWidth - 20; // 10mm margin left/right

    while (y < canvas.height) {
      const sliceHeight = Math.min(pageHeightPx, canvas.height - y);
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = canvas.width;
      tmpCanvas.height = sliceHeight;
      const ctx = tmpCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      const imgData = tmpCanvas.toDataURL('image/png');

      const sliceHeightMm = (sliceHeight / canvas.width) * imgWidth; // height in mm when scaled to imgWidth

      if (y > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, sliceHeightMm);

      y += sliceHeight;
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}

export default generateAnalysisPdf;
