import { jsPDF } from 'jspdf';
import type { ProjectRecord } from '../services/database';

// ---------------------------------------------------------------------------
// Shared text helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Wrap long text into an array of lines that fit `maxWidth` characters
function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + (current ? ' ' : '') + word).length <= maxWidth) {
      current += (current ? ' ' : '') + word;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ---------------------------------------------------------------------------
// PDF export — full project
// ---------------------------------------------------------------------------

export function exportProjectToPdf(project: ProjectRecord): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  const maxLineW = Math.floor((pageW - margin * 2) / 5.5); // approx chars at 10pt
  let y = margin;

  const checkPage = (needed = 20) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading1 = (text: string) => {
    checkPage(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(text, margin, y);
    y += 26;
  };

  const heading2 = (text: string) => {
    checkPage(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(60, 80, 180);
    doc.text(text, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 20;
  };

  const body = (text: string, indent = 0) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = wrapText(text, maxLineW - Math.floor(indent / 5.5));
    for (const line of lines) {
      checkPage(14);
      doc.text(line, margin + indent, y);
      y += 14;
    }
  };

  const bullet = (text: string, prefix = '•') => {
    checkPage(14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = wrapText(text, maxLineW - 12);
    doc.text(prefix, margin + 8, y);
    doc.text(lines[0], margin + 22, y);
    y += 14;
    for (let i = 1; i < lines.length; i++) {
      checkPage(14);
      doc.text(lines[i], margin + 22, y);
      y += 14;
    }
  };

  const hr = () => {
    checkPage(12);
    doc.setDrawColor(200, 200, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 10;
  };

  const spacer = (h = 8) => { y += h; };

  // ── Title block ───────────────────────────────────────────────────────────
  heading1(project.brief.title);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 140);
  doc.text(`Generated: ${fmtDate(project.createdAt)}   Status: ${project.status}`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 16;
  hr();

  // ── Context ───────────────────────────────────────────────────────────────
  heading2('Context');
  body(project.brief.context);
  spacer();

  // ── Problem Statement ─────────────────────────────────────────────────────
  heading2('Problem Statement');
  body(project.brief.problemStatement);
  spacer();

  // ── Goals ─────────────────────────────────────────────────────────────────
  heading2('Goals');
  project.brief.goals.forEach((g, i) => bullet(g, `${i + 1}.`));
  spacer();

  // ── Constraints ───────────────────────────────────────────────────────────
  heading2('Constraints');
  project.brief.constraints.forEach((c) => bullet(c));
  spacer();

  // ── Technical Requirements ────────────────────────────────────────────────
  heading2('Technical Requirements');
  project.brief.technicalRequirements.forEach((r, i) => bullet(r, `${i + 1}.`));
  spacer();

  // ── Deliverables ──────────────────────────────────────────────────────────
  heading2('Deliverables');
  project.brief.deliverables.forEach((d) => bullet(d));
  spacer();

  // ── Milestones ────────────────────────────────────────────────────────────
  heading2('Milestones');
  project.brief.milestones.forEach((ms, i) => {
    checkPage(36);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${i + 1}. ${ms.title}`, margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 120);
    doc.text(
      `Due: ${ms.dueDate ? fmtDate(ms.dueDate) : 'TBD'}   Est: ~${ms.estimatedHours}h   Status: ${ms.status}`,
      margin + 12,
      y
    );
    doc.setTextColor(0, 0, 0);
    y += 14;
    body(ms.description, 12);
    if (ms.deliverables.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Deliverables:', margin + 12, y);
      y += 13;
      ms.deliverables.forEach((d) => bullet(d, '–'));
    }
    spacer(6);
  });

  // ── Notes ─────────────────────────────────────────────────────────────────
  const notes = project.notes ?? [];
  if (notes.length) {
    hr();
    heading2('Notes');
    [...notes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach((n) => {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 140);
        checkPage(13);
        doc.text(fmtDate(n.createdAt), margin, y);
        doc.setTextColor(0, 0, 0);
        y += 13;
        body(n.text, 12);
        spacer(4);
      });
  }

  doc.save(`${project.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}

// ---------------------------------------------------------------------------
// PDF export — single milestone
// ---------------------------------------------------------------------------

export function exportMilestoneToPdf(project: ProjectRecord, milestoneId: string): void {
  const ms = project.brief.milestones.find((m) => m.id === milestoneId);
  if (!ms) return;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const maxLineW = Math.floor((pageW - margin * 2) / 5.5);
  let y = margin;

  const checkPage = (needed = 20) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const body = (text: string, indent = 0) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = wrapText(text, maxLineW - Math.floor(indent / 5.5));
    for (const line of lines) {
      checkPage(14);
      doc.text(line, margin + indent, y);
      y += 14;
    }
  };

  const bullet = (text: string) => {
    const lines = wrapText(text, maxLineW - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('•', margin + 8, y);
    doc.text(lines[0], margin + 22, y);
    y += 14;
    for (let i = 1; i < lines.length; i++) {
      checkPage(14);
      doc.text(lines[i], margin + 22, y);
      y += 14;
    }
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(ms.title, margin, y);
  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 140);
  doc.text(`Project: ${project.brief.title}`, margin, y);
  y += 13;
  doc.text(
    `Due: ${ms.dueDate ? fmtDate(ms.dueDate) : 'TBD'}   Est: ~${ms.estimatedHours}h   Status: ${ms.status}`,
    margin,
    y
  );
  doc.setTextColor(0, 0, 0);
  y += 18;
  doc.setDrawColor(200, 200, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Description', margin, y);
  y += 16;
  body(ms.description);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Deliverables', margin, y);
  y += 16;
  ms.deliverables.forEach(bullet);

  doc.save(`Milestone_${ms.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}

// ---------------------------------------------------------------------------
// Word-friendly HTML export — full project
// ---------------------------------------------------------------------------

function projectToHtml(project: ProjectRecord): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const li = (items: string[]) =>
    `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

  const notes = project.notes ?? [];
  const notesHtml = notes.length
    ? `<h2>Notes</h2>` +
      [...notes]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(
          (n) =>
            `<p><em>${fmtDate(n.createdAt)}</em><br>${esc(n.text)}</p>`
        )
        .join('')
    : '';

  const milestonesHtml = project.brief.milestones
    .map(
      (ms, i) =>
        `<h3>${i + 1}. ${esc(ms.title)}</h3>
        <p><strong>Due:</strong> ${ms.dueDate ? fmtDate(ms.dueDate) : 'TBD'} &nbsp;|&nbsp;
           <strong>Estimated:</strong> ~${ms.estimatedHours}h &nbsp;|&nbsp;
           <strong>Status:</strong> ${ms.status}</p>
        <p>${esc(ms.description)}</p>
        <p><strong>Deliverables:</strong></p>${li(ms.deliverables)}`
    )
    .join('');

  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${esc(project.brief.title)}</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1a1a2e; margin: 2cm; }
    h1 { color: #3a3a8c; font-size: 18pt; }
    h2 { color: #3a3a8c; font-size: 13pt; border-bottom: 1px solid #c0c0e0; padding-bottom: 4pt; margin-top: 18pt; }
    h3 { color: #444; font-size: 11pt; margin-top: 12pt; }
    p, li { line-height: 1.5; }
    .meta { color: #666; font-size: 9pt; }
  </style>
</head>
<body>
  <h1>${esc(project.brief.title)}</h1>
  <p class="meta">Generated: ${fmtDate(project.createdAt)} &nbsp;|&nbsp; Status: ${project.status}</p>
  <h2>Context</h2>
  <p>${esc(project.brief.context)}</p>
  <h2>Problem Statement</h2>
  <p>${esc(project.brief.problemStatement)}</p>
  <h2>Goals</h2>
  <ol>${project.brief.goals.map((g) => `<li>${esc(g)}</li>`).join('')}</ol>
  <h2>Constraints</h2>
  ${li(project.brief.constraints)}
  <h2>Technical Requirements</h2>
  <ol>${project.brief.technicalRequirements.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
  <h2>Deliverables</h2>
  ${li(project.brief.deliverables)}
  <h2>Milestones</h2>
  ${milestonesHtml}
  ${notesHtml}
</body>
</html>`;
}

export function exportProjectToDoc(project: ProjectRecord): void {
  const html = projectToHtml(project);
  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/[^a-z0-9]/gi, '_')}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Word-friendly HTML export — single milestone
// ---------------------------------------------------------------------------

export function exportMilestoneToDoc(
  project: ProjectRecord,
  milestoneId: string
): void {
  const ms = project.brief.milestones.find((m) => m.id === milestoneId);
  if (!ms) return;

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${esc(ms.title)}</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1a1a2e; margin: 2cm; }
    h1 { color: #3a3a8c; font-size: 16pt; }
    .meta { color: #666; font-size: 9pt; }
    li { line-height: 1.5; }
  </style>
</head>
<body>
  <h1>${esc(ms.title)}</h1>
  <p class="meta">Project: ${esc(project.brief.title)}</p>
  <p class="meta">Due: ${ms.dueDate ? fmtDate(ms.dueDate) : 'TBD'} &nbsp;|&nbsp; Est: ~${ms.estimatedHours}h &nbsp;|&nbsp; Status: ${ms.status}</p>
  <h2>Description</h2>
  <p>${esc(ms.description)}</p>
  <h2>Deliverables</h2>
  <ul>${ms.deliverables.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
</body>
</html>`;

  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Milestone_${ms.title.replace(/[^a-z0-9]/gi, '_')}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
