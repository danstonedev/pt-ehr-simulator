// Document export functionality for PT EMR Sim
// Handles Word document generation with professional formatting

// Import regional definitions to reconstruct table rows for export
// This avoids relying on UI-only computed fields and ensures consistent names/normals
/* global docx */
import { regionalAssessments } from '../features/soap/objective/RegionalAssessments.js';

/* eslint-disable complexity */
export function exportToWord(caseData, draft) {
  try {
    // Check if docx library is available
    if (typeof docx === 'undefined') {
      console.error(
        'Docx library not found. Available globals:',
        Object.keys(window || {}).filter((k) => k.toLowerCase().includes('docx')),
      );
      alert('Word export library not loaded. Please refresh the page and try again.');
      return;
    }

    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      HeadingLevel,
      AlignmentType,
      BorderStyle,
      WidthType,
      Footer,
      PageNumber,
      NumberOfTotalPages,
      // UnderlineType,
      VerticalAlign,
      TableLayoutType,
      Header,
    } = docx;

    // Centralized formatting configuration matching case editor design
    const FORMAT = {
      // Font settings - Use system fonts for portability
      font: 'Calibri',
      fontFallback: 'Arial',
      headingFont: 'Calibri Light',

      // Text sizes (maintain accessibility while matching design)
      sizes: {
        title: 32, // 16pt - Main document title (larger for impact)
        heading1: 28, // 14pt - Major sections (SUBJECTIVE, OBJECTIVE, etc.)
        heading2: 24, // 12pt - Subsections (Pain Assessment, etc.)
        body: 22, // 11pt - Body text (minimum accessible size)
        small: 20, // 10pt - Table text, hints
      },

      // Colors matching UND theme; body text remains black for print
      colors: {
        // Core
        black: '000000',
        white: 'FFFFFF',
        // Neutral grayscale aligned to web tokens
        gray: '4A4A4A', // between neutral-700/750
        grayText: '616161', // neutral-700 for secondary text
        // Brand
        blue: '009A44', // UND Green (legacy key used across file)
        green: '009A44',
        darkBlue: '007a35',
        accent: '009A44',
        // Web-like table theme (UND neutrals)
        neutralHeader: '2C2C2C', // neutral-900 for table header background
        grid: 'E0E0E0', // neutral-300 borders
        inputBg: 'F5F5F5', // neutral-100 input bg
        zebra: 'FAFAFA', // neutral-50 zebra
        // Misc
        red: 'dc3545',
        lightGray: 'f8f9fa',
        sectionBg: '1A1A1A',
      },

      // Spacing (in points) - more generous for professional appearance
      spacing: {
        beforeSection: 240, // 12pt space before major sections (condensed)
        afterSection: 120, // 6pt space after major sections
        beforeSubsection: 120, // 6pt space before subsections
        afterSubsection: 80, // ~4pt space after subsections
        beforeParagraph: 40, // ~2pt space before paragraphs
        afterParagraph: 40, // ~2pt space after paragraphs
        lineSpacing: 240, // 1.0x line spacing (tighter)
      },

      // Table formatting
      table: {
        borderSize: 4,
        cellPadding: 100, // 5pt in twentieths of a point
      },
      // Indentation levels (in twips; 1 inch = 1440)
      indent: {
        quarter: 360, // 0.25"
        level1: 720, // 0.5"
        level2: 1080, // 0.75"
      },
    };

    // Web-like dark header bar with UND-green underline
    const createWebSectionHeader = (text) => {
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.SINGLE, size: 16, color: FORMAT.colors.green },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      createTextRun(text, {
                        size: FORMAT.sizes.heading2,
                        color: 'FFFFFF',
                        bold: true,
                      }),
                    ],
                    spacing: { before: 0, after: 0 },
                  }),
                ],
                shading: { fill: '1E1E1E' },
                margins: { top: 40, bottom: 40, left: 240, right: 240 },
              }),
            ],
          }),
        ],
      });
    };

    // Helper function to create a UND-themed section divider
    const createSectionDivider = () => {
      // UND Green divider line matching case editor theme
      const cell = new TableCell({
        children: [new Paragraph('')],
        shading: undefined,
        margins: { top: 80, bottom: 80, left: 0, right: 0 },
      });
      return new Table({
        rows: [new TableRow({ children: [cell] })],
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.SINGLE, size: 18, color: FORMAT.colors.blue }, // UND Green thick line
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
      });
    };

    // Helper function to safely access nested object properties
    const getSafeValue = (obj, path, defaultValue = '') => {
      try {
        return path.split('.').reduce((curr, prop) => curr?.[prop], obj) || defaultValue;
        // eslint-disable-next-line no-unused-vars
      } catch (error) {
        return defaultValue;
      }
    };

    // Helper function to format arrays
    // eslint-disable-next-line no-unused-vars
    const formatArray = (arr, defaultValue = '') => {
      if (!Array.isArray(arr) || arr.length === 0) return defaultValue;
      return arr.join(', ');
    };

    // Helper function to create styled text runs with fallback fonts
    const createTextRun = (text, options = {}) => {
      return new TextRun({
        text: text?.toString() || '',
        font: options.font || FORMAT.font,
        size: options.size || FORMAT.sizes.body,
        color: options.color || FORMAT.colors.black,
        bold: options.bold || false,
        italics: options.italics || false,
        underline: options.underline,
      });
    };

    // Helper function to create numbered section headers with left rule and keepNext
    /* eslint-disable complexity */
    const createSectionHeader = (text, level = 1, options = {}) => {
      const { prefix, pageBreakBefore = false, indentLeft } = options;
      const spacing =
        level === 1
          ? { before: FORMAT.spacing.beforeSection, after: FORMAT.spacing.afterSection }
          : level === 2
            ? { before: FORMAT.spacing.beforeSubsection, after: FORMAT.spacing.afterSubsection }
            : { before: FORMAT.spacing.beforeParagraph, after: FORMAT.spacing.afterParagraph }; // Level 3

      // Level 1 headers: UND Green, uppercase, bold
      // Level 2 headers: Black text with UND-green underline
      // Level 3 headers: Dark gray, smaller, for sub-subsections
      const textColor =
        level === 1 ? FORMAT.colors.blue : level === 2 ? FORMAT.colors.black : FORMAT.colors.gray;
      const label = prefix ? `${prefix} ${text}` : text;
      const textTransform = level === 1 ? label.toUpperCase() : label;
      const fontSize =
        level === 1
          ? FORMAT.sizes.heading1
          : level === 2
            ? FORMAT.sizes.heading2
            : FORMAT.sizes.body;
      const headingLevel =
        level === 1
          ? HeadingLevel.HEADING_1
          : level === 2
            ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3;

      const computedIndent =
        typeof indentLeft !== 'undefined'
          ? indentLeft
          : level === 2
            ? FORMAT.indent.quarter
            : level === 3
              ? FORMAT.indent.level2
              : undefined;

      return new Paragraph({
        children: [
          createTextRun(textTransform, {
            size: fontSize,
            color: textColor,
            bold: true,
            font: level === 1 ? FORMAT.headingFont : FORMAT.font,
          }),
        ],
        heading: headingLevel,
        spacing: spacing,
        keepNext: true,
        pageBreakBefore,
        indent: computedIndent ? { left: computedIndent } : undefined,
        border:
          level === 1
            ? { left: { style: BorderStyle.SINGLE, size: 24, color: FORMAT.colors.blue } }
            : level === 2
              ? { bottom: { style: BorderStyle.SINGLE, size: 16, color: FORMAT.colors.blue } }
              : undefined,
      });
    };

    // Helper function to create body paragraphs
    const createBodyParagraph = (text, options = {}) => {
      if (!text || text.trim() === '') {
        return new Paragraph({
          children: [
            createTextRun('— not documented', { color: FORMAT.colors.gray, italics: true }),
          ],
          spacing: {
            before: FORMAT.spacing.beforeParagraph,
            after: FORMAT.spacing.afterParagraph,
            line: FORMAT.spacing.lineSpacing,
          },
          indent: options.indentLeft ? { left: options.indentLeft } : undefined,
          keepLines: options.keepLines || false,
        });
      }

      const textRuns = text
        .split('\n')
        .map((line, index, array) => {
          const runs = [createTextRun(line, options)];
          if (index < array.length - 1) {
            runs.push(new TextRun({ break: 1 }));
          }
          return runs;
        })
        .flat();

      return new Paragraph({
        children: textRuns,
        spacing: {
          before: FORMAT.spacing.beforeParagraph,
          after: FORMAT.spacing.afterParagraph,
          line: FORMAT.spacing.lineSpacing,
        },
        indent: options.indentLeft ? { left: options.indentLeft } : undefined,
        keepLines: options.keepLines || false,
        ...options,
      });
    };

    // Helper: create a simple bulleted list from lines with indentation
    const createBulletedList = (lines, indentLeft) => {
      if (!Array.isArray(lines) || lines.length === 0) return [];
      return lines.map(
        (line) =>
          new Paragraph({
            children: [createTextRun(`• ${line}`, { size: FORMAT.sizes.body })],
            spacing: { before: 0, after: 20, line: FORMAT.spacing.lineSpacing },
            indent: indentLeft ? { left: indentLeft } : undefined,
          }),
      );
    };

    // Helper: labeled line with bold label and normal value; optional bullet
    const createLabelValueLine = (
      label,
      value,
      { indentLeft, bullet = false, compact = false } = {},
    ) => {
      const children = [];
      if (bullet) children.push(createTextRun('• ', { size: FORMAT.sizes.body }));
      if (label && label.trim()) {
        children.push(createTextRun(`${label}: `, { bold: true }));
      }
      children.push(createTextRun(value ?? ''));
      return new Paragraph({
        children,
        spacing: compact
          ? { before: 0, after: 20, line: FORMAT.spacing.lineSpacing }
          : { before: 20, after: 20, line: FORMAT.spacing.lineSpacing },
        indent: indentLeft ? { left: indentLeft } : undefined,
      });
    };

    // Helper function to create UND-themed tables with proper formatting
    // eslint-disable-next-line no-unused-vars
    const createFormattedTable = (data, headers = [], columnWidths, alignments = [], opts = {}) => {
      const rows = [];

      // Add header row if provided - UND themed
      if (headers.length > 0) {
        const headerCells = headers.map(
          (header, i) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    createTextRun(header, {
                      bold: true,
                      size: FORMAT.sizes.small,
                      color: 'FFFFFF', // White text on UND green background
                    }),
                  ],
                }),
              ],
              shading: { fill: FORMAT.colors.blue }, // UND Green header background
              verticalAlign:
                typeof VerticalAlign !== 'undefined' ? VerticalAlign.CENTER : undefined,
              margins: {
                top: FORMAT.table.cellPadding,
                bottom: FORMAT.table.cellPadding,
                left: FORMAT.table.cellPadding,
                right: FORMAT.table.cellPadding,
              },
              width:
                Array.isArray(columnWidths) && columnWidths[i]
                  ? { size: columnWidths[i], type: WidthType.DXA }
                  : undefined,
              borders:
                i === 0
                  ? { left: { style: BorderStyle.SINGLE, size: 24, color: FORMAT.colors.blue } }
                  : undefined,
            }),
        );
        rows.push(new TableRow({ children: headerCells, tableHeader: true }));
      }

      // Add data rows
      data.forEach((rowData, idx) => {
        const cells = rowData.map(
          (cellData, i) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    createTextRun(cellData?.toString() || '', {
                      size: opts.textSize || FORMAT.sizes.small,
                    }),
                  ],
                  alignment:
                    alignments[i] === 'right'
                      ? AlignmentType.RIGHT
                      : alignments[i] === 'center'
                        ? AlignmentType.CENTER
                        : AlignmentType.LEFT,
                }),
              ],
              margins: {
                top: FORMAT.table.cellPadding,
                bottom: FORMAT.table.cellPadding,
                left: FORMAT.table.cellPadding,
                right: FORMAT.table.cellPadding,
              },
              verticalAlign:
                typeof VerticalAlign !== 'undefined' ? VerticalAlign.CENTER : undefined,
              shading: idx % 2 === 0 ? undefined : { fill: FORMAT.colors.zebra },
              width:
                Array.isArray(columnWidths) && columnWidths[i]
                  ? { size: columnWidths[i], type: WidthType.DXA }
                  : undefined,
            }),
        );
        rows.push(new TableRow({ children: cells, cantSplit: true }));
      });

      const tableOptions = {
        rows: rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: FORMAT.table.borderSize },
          bottom: { style: BorderStyle.SINGLE, size: FORMAT.table.borderSize },
          left: { style: BorderStyle.SINGLE, size: FORMAT.table.borderSize },
          right: { style: BorderStyle.SINGLE, size: FORMAT.table.borderSize },
          insideHorizontal: { style: BorderStyle.SINGLE, size: FORMAT.table.borderSize },
          insideVertical: { style: BorderStyle.SINGLE, size: FORMAT.table.borderSize },
        },
      };
      if (Array.isArray(columnWidths) && columnWidths.length) {
        tableOptions.columnWidths = columnWidths;
        // Switch to fixed layout and use exact DXA width (sum of columns) so columns align across tables
        const total = columnWidths.reduce((a, b) => a + b, 0);
        tableOptions.width = { size: total, type: WidthType.DXA };
        if (typeof TableLayoutType !== 'undefined') {
          tableOptions.layout = TableLayoutType.FIXED;
        }
      }
      return new Table(tableOptions);
    };

    // Simple spacer paragraph to add vertical space between tables
    const createSpacer = (before = 0, after = 160) =>
      new Paragraph({
        children: [new TextRun('')],
        spacing: { before, after },
      });

    // Date formatting helper (e.g., Aug 20, 2025)
    const fmtDate = (d) => {
      try {
        const dt = d instanceof Date ? d : new Date(d);
        return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch {
        return '';
      }
    };

    // Clinical value formatters
    const formatRom = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val).trim();
      if (!s) return '';
      if (s.includes('°')) return s;
      // Append degree if purely numeric or ends with number
      if (/^\d+(\.\d+)?$/.test(s)) return `${s}°`;
      return s;
    };
    const formatMmt = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val).trim();
      if (!s) return '';
      if (s.includes('/5')) return s;
      if (/^[0-5](\+|\-)?$/.test(s)) return `${s}/5`;
      return s;
    };

    // Helper: compute age from YYYY-MM-DD string (export-time accuracy)
    const computeAgeFromDob = (dobStr) => {
      if (!dobStr) return '';
      const dob = new Date(dobStr);
      if (isNaN(dob.getTime())) return '';
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      return age >= 0 && age < 200 ? String(age) : '';
    };

    // Main document content creation
    const elements = [];

    // No document title per request

    // Patient Information Section header in black (use level-2 styling), no indent
    elements.push(createSectionHeader('PATIENT INFORMATION', 2, { indentLeft: 0 }));

    // Prefer snapshot.dob, then top-level patientDOB, then meta.patientDOB
    const dobValue =
      getSafeValue(caseData, 'snapshot.dob') ||
      getSafeValue(caseData, 'patientDOB') ||
      getSafeValue(caseData, 'meta.patientDOB', '');
    const computedAge = computeAgeFromDob(dobValue);
    const ageValue =
      computedAge ||
      getSafeValue(caseData, 'snapshot.age', getSafeValue(caseData, 'patientAge', 'Not specified'));
    const genderValue = getSafeValue(
      caseData,
      'snapshot.sex',
      getSafeValue(caseData, 'patientGender', 'Not specified'),
    );

    const subjQuick = (draft && draft.subjective) || {};
    // Output patient information as simple labeled lines (no table)
    const patientInfoLines = [
      [
        'Patient Name',
        getSafeValue(caseData, 'snapshot.name', getSafeValue(caseData, 'title', 'Not specified')),
      ],
      ['DOB', dobValue || 'Not specified'],
      ['Age', ageValue || 'Not specified'],
      ['Gender', genderValue || 'Not specified'],
      [
        'Primary Complaint',
        subjQuick.chiefComplaint ||
          getSafeValue(caseData, 'history.chief_complaint', 'Not specified'),
      ],
      ['Date of Evaluation', fmtDate(new Date())],
    ];

    patientInfoLines.forEach(([label, value]) => {
      elements.push(
        createLabelValueLine(label, value, { indentLeft: FORMAT.indent.level1, compact: true }),
      );
    });

    // SUBJECTIVE Section (draft-first mapping)
    elements.push(createSectionDivider());
    elements.push(createWebSectionHeader('SUBJECTIVE'));
    const subj = (draft && draft.subjective) || {};
    elements.push(createSectionHeader('History of Present Illness', 2));
    const hpiLines = [];
    const chiefConcern =
      subj.chiefComplaint || getSafeValue(caseData, 'history.chief_complaint') || '';
    const detailedHistory =
      subj.historyOfPresentIllness || getSafeValue(caseData, 'history.hpi') || '';
    if (chiefConcern) hpiLines.push(`Chief Concern: ${chiefConcern}`);
    if (detailedHistory) hpiLines.push(`Detailed History of Current Condition: ${detailedHistory}`);
    if (hpiLines.length) {
      if (chiefConcern)
        elements.push(
          createLabelValueLine('Chief Concern', chiefConcern, { indentLeft: FORMAT.indent.level1 }),
        );
      if (detailedHistory)
        elements.push(
          createLabelValueLine('Detailed History of Current Condition', detailedHistory, {
            indentLeft: FORMAT.indent.level1,
          }),
        );
    } else {
      elements.push(
        createBodyParagraph('— not documented', {
          indentLeft: FORMAT.indent.level1,
          italics: true,
          color: FORMAT.colors.grayText,
        }),
      );
    }
    elements.push(createSectionHeader('Symptom Assessment', 2));
    const painHasAny = !!(
      subj.painLocation ||
      subj.painScale ||
      subj.painQuality ||
      subj.painPattern ||
      subj.aggravatingFactors ||
      subj.easingFactors
    );
    if (painHasAny) {
      if (subj.painLocation)
        elements.push(
          createLabelValueLine('Location', subj.painLocation, { indentLeft: FORMAT.indent.level1 }),
        );
      if (subj.painScale)
        elements.push(
          createLabelValueLine('Pain Scale', `${subj.painScale}/10`, {
            indentLeft: FORMAT.indent.level1,
          }),
        );
      if (subj.painQuality)
        elements.push(
          createLabelValueLine('Quality', subj.painQuality, { indentLeft: FORMAT.indent.level1 }),
        );
      if (subj.painPattern)
        elements.push(
          createLabelValueLine('Pattern', subj.painPattern, { indentLeft: FORMAT.indent.level1 }),
        );
      if (subj.aggravatingFactors)
        elements.push(
          createLabelValueLine('Aggravating', subj.aggravatingFactors, {
            indentLeft: FORMAT.indent.level1,
          }),
        );
      if (subj.easingFactors)
        elements.push(
          createLabelValueLine('Easing', subj.easingFactors, { indentLeft: FORMAT.indent.level1 }),
        );
    } else {
      elements.push(
        createBodyParagraph('Pain assessment not completed', { indentLeft: FORMAT.indent.level1 }),
      );
    }
    elements.push(createSectionHeader('Functional Status', 2));
    const hasFunctional = !!(subj.functionalLimitations || subj.priorLevel || subj.patientGoals);
    if (hasFunctional) {
      if (subj.functionalLimitations)
        elements.push(
          createLabelValueLine('Current Limitations', subj.functionalLimitations, {
            indentLeft: FORMAT.indent.level1,
          }),
        );
      if (subj.priorLevel)
        elements.push(
          createLabelValueLine('Prior Level of Function', subj.priorLevel, {
            indentLeft: FORMAT.indent.level1,
          }),
        );
      if (subj.patientGoals)
        elements.push(
          createLabelValueLine('Patient Goals', subj.patientGoals, {
            indentLeft: FORMAT.indent.level1,
          }),
        );
    } else {
      elements.push(
        createBodyParagraph('Functional status not documented', {
          indentLeft: FORMAT.indent.level1,
        }),
      );
    }
    elements.push(createSectionHeader('Additional History', 2));
    const hasAddHist = !!(subj.medicationsCurrent || subj.redFlags || subj.additionalHistory);
    if (hasAddHist) {
      if (subj.medicationsCurrent)
        elements.push(
          createLabelValueLine('Current Medications', subj.medicationsCurrent, {
            indentLeft: FORMAT.indent.level1,
          }),
        );
      if (subj.redFlags)
        elements.push(
          createLabelValueLine('Red Flags/Screening', subj.redFlags, {
            indentLeft: FORMAT.indent.level1,
          }),
        );
      if (subj.additionalHistory)
        elements.push(
          createLabelValueLine('Additional Relevant History', subj.additionalHistory, {
            indentLeft: FORMAT.indent.level1,
          }),
        );
    } else {
      elements.push(
        createBodyParagraph('No additional history provided', { indentLeft: FORMAT.indent.level1 }),
      );
    }

    // OBJECTIVE Section (draft-first)
    elements.push(createSectionDivider());
    elements.push(createWebSectionHeader('OBJECTIVE'));
    const obj = (draft && draft.objective) || {};
    // General observations & vitals
    elements.push(createSectionHeader('General Observations & Vital Signs', 2));
    elements.push(createBodyParagraph(obj.text || '', { indentLeft: FORMAT.indent.level1 }));
    // Inspection/Palpation
    elements.push(createSectionHeader('Inspection', 2));
    elements.push(
      createBodyParagraph(getSafeValue(obj, 'inspection.visual', ''), {
        indentLeft: FORMAT.indent.level1,
      }),
    );
    elements.push(createSectionHeader('Palpation', 2));
    elements.push(
      createBodyParagraph(getSafeValue(obj, 'palpation.findings', ''), {
        indentLeft: FORMAT.indent.level1,
      }),
    );
    // Regional Assessment - Enhanced table formatting
    // Indent header slightly to visually align with indented tables (match gutter, not full table width)
    elements.push(
      createSectionHeader('Regional Assessment', 2, { indentLeft: FORMAT.indent.quarter }),
    );
    const ra = obj.regionalAssessments || {};

    // Helper to slugify a movement name for PROM row keys
    const slug = (s) => (s || '').toString().toLowerCase().replace(/\s+/g, '-');

    // Build combined reference lists based on selected regions
    const selected =
      Array.isArray(ra.selectedRegions) && ra.selectedRegions.length
        ? ra.selectedRegions.filter((k) => regionalAssessments[k])
        : []; // if none selected, we won't render any tables

    // Use consistent column widths across Regional Assessment tables so L/R align between tables
    // Web-like proportions scaled to fit 9360 twips printable width: ~50% / ~14% / ~14% / ~22%
    // Derived from proposal (5200/1400/1400/2360) but scaled to 9360 total width
    // Adjusted widths: slightly narrower first content column to free space for Notes
    const RA_COL_WIDTHS = [2600, 1200, 1200, 4360];
    const RA_TOTAL_WIDTH = RA_COL_WIDTHS.reduce((a, b) => a + b, 0);
    const computeWidthsNoNotes = () => {
      const base = [RA_COL_WIDTHS[0], RA_COL_WIDTHS[1], RA_COL_WIDTHS[2]]; // description, left, right
      const totalBase = base.reduce((a, b) => a + b, 0);
      const scale = RA_TOTAL_WIDTH / totalBase; // scale up to occupy full printable width
      let scaled = base.map((w) => Math.round(w * scale));
      // Adjust rounding difference if any
      const diff = RA_TOTAL_WIDTH - scaled.reduce((a, b) => a + b, 0);
      if (diff !== 0) scaled[0] += diff; // put any leftover into description column
      return scaled; // returns array of 3 widths summing to RA_TOTAL_WIDTH
    };

    // Web-like table factory: soft borders, dark slate header, roomy padding, zebra rows
    /* eslint-disable complexity */
    function createWebLikeTable(data, headers = [], columnWidths, alignments = [], opts = {}) {
      let effectiveHeaders = headers;
      let effectiveData = data;
      let effectiveWidths = columnWidths;
      let effectiveAlignments = alignments;

      // Simulated indent via leading empty gutter column (preferred when native indent not rendering)
      if (opts && opts.indentLeft && opts.simulateIndent && Array.isArray(columnWidths)) {
        const gutter = opts.simulateIndentWidth || Math.min(opts.indentLeft, 800); // cap gutter size
        effectiveWidths = [...columnWidths];
        if (effectiveWidths.length > 0) {
          effectiveWidths[0] = Math.max(400, effectiveWidths[0] - gutter);
        }
        effectiveWidths.unshift(gutter);
        effectiveHeaders = [''].concat(headers);
        effectiveData = data.map((row) => [''].concat(row));
        effectiveAlignments = ['left'].concat(alignments);
      }

      const rows = [];
      if (effectiveHeaders.length) {
        const headerCells = effectiveHeaders.map((h, i) => {
          const isIndentCol = opts.simulateIndent && effectiveHeaders[0] === '' && i === 0;
          const isFirstContentCol = opts.simulateIndent && effectiveHeaders[0] === '' && i === 1; // remove left border so gutter has no separating rule
          // Build borders: skip all for gutter; suppress left rule for first content column; add top rule (except gutter) when simulating indent
          let headerBorders;
          if (isIndentCol) {
            headerBorders = {
              top: { style: BorderStyle.NONE, size: 0 },
              left: { style: BorderStyle.NONE, size: 0 },
              right: { style: BorderStyle.NONE, size: 0 },
              bottom: { style: BorderStyle.NONE, size: 0 },
            };
          } else {
            const b = {};
            if (isFirstContentCol) b.left = { style: BorderStyle.NONE, size: 0 };
            if (opts.simulateIndent)
              b.top = { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.grid };
            headerBorders = Object.keys(b).length ? b : undefined;
          }
          return new TableCell({
            children: [
              new Paragraph({
                children: isIndentCol
                  ? [createTextRun('')] // keep empty
                  : [
                      createTextRun(h, {
                        bold: true,
                        size: FORMAT.sizes.small,
                        color: FORMAT.colors.white,
                      }),
                    ],
                spacing: { before: 0, after: 0 },
              }),
            ],
            shading: isIndentCol ? undefined : { fill: FORMAT.colors.neutralHeader },
            margins: isIndentCol
              ? { top: 0, bottom: 0, left: 0, right: 0 }
              : { top: 30, bottom: 30, left: 100, right: 100 },
            verticalAlign: typeof VerticalAlign !== 'undefined' ? VerticalAlign.CENTER : undefined,
            borders: headerBorders,
            width:
              Array.isArray(effectiveWidths) && effectiveWidths[i]
                ? { size: effectiveWidths[i], type: WidthType.DXA }
                : undefined,
          });
        });
        rows.push(new TableRow({ children: headerCells, tableHeader: true }));
      }

      effectiveData.forEach((rowData, rIdx) => {
        const cells = rowData.map((cell, cIdx) => {
          const isIndentCol = opts.simulateIndent && effectiveHeaders[0] === '' && cIdx === 0;
          const isFirstContentCol = opts.simulateIndent && effectiveHeaders[0] === '' && cIdx === 1;
          // Determine header label for this column (accounting for indent col if present)
          const headerLabel = effectiveHeaders[cIdx] || '';
          let displayVal = (cell ?? '').toString();
          if (!displayVal && (headerLabel === 'Left' || headerLabel === 'Right')) {
            displayVal = '—'; // em dash placeholder for clarity when no value
          }
          // eslint-disable-next-line no-unused-vars
          const isLastBodyRow = rIdx === effectiveData.length - 1;
          return new TableCell({
            children: [
              new Paragraph({
                children: isIndentCol
                  ? [createTextRun('')]
                  : [
                      createTextRun(displayVal, {
                        size: FORMAT.sizes.small,
                        color: FORMAT.colors.black,
                      }),
                    ],
                spacing: { before: 0, after: 0 },
                alignment:
                  effectiveAlignments[cIdx] === 'right'
                    ? AlignmentType.RIGHT
                    : effectiveAlignments[cIdx] === 'center'
                      ? AlignmentType.CENTER
                      : AlignmentType.LEFT,
              }),
            ],
            margins: isIndentCol
              ? { top: 0, bottom: 0, left: 0, right: 0 }
              : { top: 60, bottom: 60, left: 100, right: 100 },
            verticalAlign: typeof VerticalAlign !== 'undefined' ? VerticalAlign.CENTER : undefined,
            shading: isIndentCol
              ? undefined
              : rIdx % 2 === 1
                ? { fill: FORMAT.colors.zebra }
                : undefined,
            borders: (function () {
              if (isIndentCol) {
                return {
                  top: { style: BorderStyle.NONE, size: 0 },
                  left: { style: BorderStyle.NONE, size: 0 },
                  right: { style: BorderStyle.NONE, size: 0 },
                  bottom: { style: BorderStyle.NONE, size: 0 },
                };
              }
              const base = {};
              if (isFirstContentCol) base.left = { style: BorderStyle.NONE, size: 0 };
              // Provide bottom rule on every row (acts as row separator & final bottom line)
              base.bottom = { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.grid };
              return base;
            })(),
            width:
              Array.isArray(effectiveWidths) && effectiveWidths[cIdx]
                ? { size: effectiveWidths[cIdx], type: WidthType.DXA }
                : undefined,
          });
        });
        rows.push(new TableRow({ children: cells, cantSplit: true }));
      });

      return new Table({
        rows,
        layout: typeof TableLayoutType !== 'undefined' ? TableLayoutType.FIXED : undefined,
        width:
          Array.isArray(effectiveWidths) && effectiveWidths.length
            ? { size: effectiveWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA }
            : { size: 100, type: WidthType.PERCENTAGE },
        // If we simulate an indent with a gutter column, skip native indent to avoid doubling
        indent:
          opts && typeof opts.indentLeft !== 'undefined' && !opts.simulateIndent
            ? { size: opts.indentLeft, type: WidthType.DXA }
            : undefined,
        borders: {
          top: opts.simulateIndent
            ? { style: BorderStyle.NONE, size: 0, color: FORMAT.colors.grid }
            : { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.grid },
          bottom: opts.simulateIndent
            ? { style: BorderStyle.NONE, size: 0, color: FORMAT.colors.grid }
            : { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.grid },
          left: opts.simulateIndent
            ? { style: BorderStyle.NONE, size: 0, color: FORMAT.colors.grid }
            : { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.grid },
          right: { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.grid },
          insideHorizontal: opts.simulateIndent
            ? { style: BorderStyle.NONE, size: 0, color: FORMAT.colors.grid }
            : { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.grid },
          insideVertical: { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.grid },
        },
      });
    }

    // PROM (Passive ROM) export: rebuild rows from canonical definitions + saved values
    const promSaved = ra.prom || {};
    if (selected.length) {
      const promGroups = {};
      selected.forEach((regionKey) => {
        const region = regionalAssessments[regionKey];
        (region?.rom || []).forEach((item) => {
          const baseName = item.name || item.joint || item.muscle;
          if (!promGroups[baseName]) {
            promGroups[baseName] = { normal: item.normal };
          }
        });
      });

      const excluded = new Set(ra.promExcluded || []);
      const promRows = Object.keys(promGroups)
        .map((name) => {
          const rowId = slug(name);
          if (excluded.has(rowId)) return null; // skip excluded items
          const saved = promSaved[rowId] || {};
          const displayName = promGroups[name].normal
            ? `${name} (${promGroups[name].normal})`
            : name;
          return [displayName, saved.left || '', saved.right || ''];
        })
        .filter(Boolean);

      if (promRows.length) {
        let headers = ['Passive Range of Motion (PROM)', 'Left', 'Right'];
        let alignments = ['left', 'right', 'right'];
        let rowsData = promRows.map((r) => [r[0], formatRom(r[1]), formatRom(r[2])]);
        let widths = computeWidthsNoNotes();
        elements.push(
          createWebLikeTable(rowsData, headers, widths, alignments, {
            indentLeft: FORMAT.indent.level2,
            simulateIndent: true,
            simulateIndentWidth: 360,
          }),
        );
        elements.push(createSpacer(0, 160));
      }
    }

    // AROM (Active ROM) export: reconstruct from selected regions and saved indices
    const romSaved = ra.rom || {};
    if (selected.length) {
      // Build groups with left/right index positions and normal values
      const romGroups = {};
      selected.forEach((regionKey) => {
        const region = regionalAssessments[regionKey];
        (region?.rom || []).forEach((item, idx) => {
          const baseName = item.name || item.joint || item.muscle;
          if (!romGroups[baseName])
            romGroups[baseName] = { normal: item.normal, left: null, right: null, bilateral: null };
          if (item.side === 'L') romGroups[baseName].left = idx;
          else if (item.side === 'R') romGroups[baseName].right = idx;
          else romGroups[baseName].bilateral = idx;
        });
      });

      const aromRows = Object.keys(romGroups).map((name) => {
        const g = romGroups[name];
        const leftVal = g.left != null ? romSaved[g.left] || '' : '';
        const rightVal = g.right != null ? romSaved[g.right] || '' : '';
        const displayName = g.normal ? `${name} (${g.normal})` : name;
        return [displayName, leftVal, rightVal];
      });

      if (aromRows.length) {
        let headers = ['Active Range of Motion (AROM)', 'Left', 'Right'];
        let alignments = ['left', 'right', 'right'];
        let rowsData = aromRows.map((r) => [r[0], formatRom(r[1]), formatRom(r[2])]);
        let widths = computeWidthsNoNotes();
        elements.push(
          createWebLikeTable(rowsData, headers, widths, alignments, {
            indentLeft: FORMAT.indent.level2,
            simulateIndent: true,
            simulateIndentWidth: 360,
          }),
        );
        elements.push(createSpacer(0, 160));
      }
    }

    // MMT export: reconstruct from selected regions and saved indices
    const mmtSaved = ra.mmt || {};
    if (selected.length) {
      const mmtGroups = {};
      selected.forEach((regionKey) => {
        const region = regionalAssessments[regionKey];
        (region?.mmt || []).forEach((item, idx) => {
          const baseName = item.name || item.joint || item.muscle;
          if (!mmtGroups[baseName])
            mmtGroups[baseName] = { left: null, right: null, bilateral: null };
          if (item.side === 'L') mmtGroups[baseName].left = idx;
          else if (item.side === 'R') mmtGroups[baseName].right = idx;
          else mmtGroups[baseName].bilateral = idx;
        });
      });

      const mmtRows = Object.keys(mmtGroups).map((name) => {
        const g = mmtGroups[name];
        const leftVal = g.left != null ? mmtSaved[g.left] || '' : '';
        const rightVal = g.right != null ? mmtSaved[g.right] || '' : '';
        return [name, leftVal, rightVal];
      });

      if (mmtRows.length) {
        let headers = ['Manual Muscle Testing', 'Left', 'Right'];
        let alignments = ['left', 'right', 'right'];
        let rowsData = mmtRows.map((r) => [r[0], formatMmt(r[1]), formatMmt(r[2])]);
        let widths = computeWidthsNoNotes();
        elements.push(
          createWebLikeTable(rowsData, headers, widths, alignments, {
            indentLeft: FORMAT.indent.level2,
            simulateIndent: true,
            simulateIndentWidth: 360,
          }),
        );
        elements.push(createSpacer(0, 160));
      }
    }

    // Special Tests export: align by combined list order to recover test name/purpose
    const testsSaved = ra.specialTests || {};
    if (selected.length) {
      const combinedTests = [];
      selected.forEach((regionKey) => {
        const region = regionalAssessments[regionKey];
        (region?.specialTests || []).forEach((test) => combinedTests.push(test));
      });

      // Map saved values to UI display labels to mirror the page
      const labelizeTest = (val) => {
        if (!val) return 'Not performed';
        const map = {
          positive: 'Positive',
          negative: 'Negative',
          inconclusive: 'Inconclusive',
          unable: 'Unable to perform',
        };
        return map[val] || val;
      };

      const testsRows = combinedTests.map((test, idx) => {
        const id = `test-${idx}`;
        const saved = testsSaved[id] || {};
        return [test.name || '', labelizeTest(saved.left), labelizeTest(saved.right)];
      });

      if (testsRows.length) {
        let headers = ['Special Tests', 'Left', 'Right'];
        let alignments = ['left', 'right', 'right'];
        let rowsData = testsRows.map((r) => r.slice(0, 3));
        let widths = computeWidthsNoNotes();
        elements.push(
          createWebLikeTable(rowsData, headers, widths, alignments, {
            indentLeft: FORMAT.indent.level2,
            simulateIndent: true,
            simulateIndentWidth: 360,
          }),
        );
        elements.push(createSpacer(0, 160));
      }
    }

    // Add fallback message if no regional assessment data
    const noRegionalData = !selected.length;
    if (noRegionalData) {
      elements.push(
        createBodyParagraph('No regional assessment data recorded', {
          indentLeft: FORMAT.indent.level1,
        }),
      );
    }

    // (Removed 'Regions Assessed' section per request)

    // Neuro/Functional
    elements.push(createSectionHeader('Neurological Screening', 2));
    elements.push(
      createBodyParagraph(getSafeValue(obj, 'neuro.screening', ''), {
        indentLeft: FORMAT.indent.level1,
      }),
    );
    elements.push(createSectionHeader('Functional Movement Assessment', 2));
    elements.push(
      createBodyParagraph(getSafeValue(obj, 'functional.assessment', ''), {
        indentLeft: FORMAT.indent.level1,
      }),
    );
    // Treatment Performed
    elements.push(createSectionHeader('Treatment Performed', 2));
    const tp = obj.treatmentPerformed || {};
    const tpLines = [];
    if (tp.patientEducation) tpLines.push(`Patient Education: ${tp.patientEducation}`);
    if (tp.modalities) tpLines.push(`Modalities: ${tp.modalities}`);
    if (tp.therapeuticExercise) tpLines.push(`Therapeutic Exercise: ${tp.therapeuticExercise}`);
    if (tp.manualTherapy) tpLines.push(`Manual Therapy: ${tp.manualTherapy}`);
    if (tpLines.length) {
      elements.push(...createBulletedList(tpLines, FORMAT.indent.level1));
    }

    // ASSESSMENT Section (draft-first)
    elements.push(createSectionDivider());
    elements.push(createWebSectionHeader('ASSESSMENT'));
    let assess = (draft && draft.assessment) || {};
    // Assessment data should always be an object
    assess = {
      primaryImpairments: '',
      bodyFunctions: '',
      activityLimitations: '',
      participationRestrictions: '',
      ptDiagnosis: '',
      prognosis: '',
      prognosticFactors: '',
      clinicalReasoning: '',
      ...assess,
    };

    elements.push(createSectionHeader('Primary Impairments', 2));
    if (assess.primaryImpairments) {
      elements.push(
        ...createBulletedList(
          [`Key Physical Impairments Identified: ${assess.primaryImpairments}`],
          FORMAT.indent.level1,
        ),
      );
    } else {
      elements.push(
        createBodyParagraph('— not documented', {
          indentLeft: FORMAT.indent.level1,
          italics: true,
          color: FORMAT.colors.grayText,
        }),
      );
    }
    elements.push(createSectionHeader('ICF Classification', 2));
    const hasIcf = !!(
      assess.bodyFunctions ||
      assess.activityLimitations ||
      assess.participationRestrictions
    );
    if (hasIcf) {
      if (assess.bodyFunctions)
        elements.push(
          createLabelValueLine('Body Functions', assess.bodyFunctions, {
            indentLeft: FORMAT.indent.level1,
          }),
        );
      if (assess.activityLimitations)
        elements.push(
          createLabelValueLine('Activity Limitations', assess.activityLimitations, {
            indentLeft: FORMAT.indent.level1,
          }),
        );
      if (assess.participationRestrictions)
        elements.push(
          createLabelValueLine('Participation Restrictions', assess.participationRestrictions, {
            indentLeft: FORMAT.indent.level1,
          }),
        );
    } else {
      elements.push(
        createBodyParagraph('— not documented', {
          indentLeft: FORMAT.indent.level1,
          italics: true,
          color: FORMAT.colors.grayText,
        }),
      );
    }
    elements.push(createSectionHeader('Physical Therapy Diagnosis & Prognosis', 2));
    const dxProg = [];
    const prognosisMap = {
      excellent: 'Excellent - Full recovery expected',
      good: 'Good - Significant improvement expected',
      fair: 'Fair - Moderate improvement expected',
      poor: 'Poor - Minimal improvement expected',
      guarded: 'Guarded - Uncertain outcome',
    };
    if (assess.ptDiagnosis) dxProg.push(`PT Diagnosis: ${assess.ptDiagnosis}`);
    if (assess.prognosis) {
      const progLabel = prognosisMap[assess.prognosis] || assess.prognosis;
      dxProg.push(`Prognosis: ${progLabel}`);
    }
    if (assess.prognosticFactors) dxProg.push(`Prognostic Factors: ${assess.prognosticFactors}`);
    if (dxProg.length) {
      dxProg.forEach((line) => {
        const [label, ...rest] = line.split(': ');
        const value = rest.join(': ');
        elements.push(
          createLabelValueLine(label, value, { indentLeft: FORMAT.indent.level1, bullet: false }),
        );
      });
    } else {
      elements.push(
        createBodyParagraph('— not documented', {
          indentLeft: FORMAT.indent.level1,
          italics: true,
          color: FORMAT.colors.grayText,
        }),
      );
    }
    elements.push(createSectionHeader('Clinical Reasoning', 2));
    if (assess.clinicalReasoning) {
      elements.push(
        createBodyParagraph(assess.clinicalReasoning, {
          indentLeft: FORMAT.indent.level1,
          keepLines: true,
        }),
      );
    } else {
      elements.push(
        createBodyParagraph('— not documented', {
          indentLeft: FORMAT.indent.level1,
          italics: true,
          color: FORMAT.colors.grayText,
        }),
      );
    }

    // PLAN Section (draft-first)
    elements.push(createSectionDivider());
    elements.push(createWebSectionHeader('PLAN'));
    let plan = (draft && draft.plan) || {};
    // Normalize plan object with defaults
    plan = {
      frequency: '',
      duration: '',
      treatmentPlan: '',
      patientEducation: '',
      exerciseTable: {},
      goalsTable: {},
      shortTermGoals: '',
      longTermGoals: '',
      ...plan,
    };
    // SMART Goals first
    elements.push(createSectionHeader('SMART Goals & Outcomes', 2));
    const goalRows =
      plan.goalsTable && typeof plan.goalsTable === 'object' ? Object.values(plan.goalsTable) : [];
    if (goalRows && goalRows.length) {
      goalRows.forEach((row) => {
        const text = (row.goalText || row.goal || '').toString();
        if (!text) return;
        elements.push(
          createLabelValueLine('', text, {
            indentLeft: FORMAT.indent.level1,
            bullet: true,
          }),
        );
      });
    } else {
      const hadAny = !!(plan.shortTermGoals || plan.longTermGoals);
      if (hadAny) {
        if (plan.shortTermGoals)
          elements.push(
            createLabelValueLine('Short-term Goals', plan.shortTermGoals, {
              indentLeft: FORMAT.indent.level1,
            }),
          );
        if (plan.longTermGoals)
          elements.push(
            createLabelValueLine('Long-term Goals', plan.longTermGoals, {
              indentLeft: FORMAT.indent.level1,
            }),
          );
      } else {
        elements.push(
          createBodyParagraph('No goals documented', { indentLeft: FORMAT.indent.level1 }),
        );
      }
    }
    // Plan of Care next
    elements.push(createSectionHeader('Plan of Care', 2));
    if (plan.treatmentPlan)
      elements.push(
        createLabelValueLine('Treatment Plan & Interventions', plan.treatmentPlan, {
          indentLeft: FORMAT.indent.level1,
          bullet: false,
        }),
      );
    if (plan.patientEducation)
      elements.push(
        createLabelValueLine('Patient Education', plan.patientEducation, {
          indentLeft: FORMAT.indent.level1,
          bullet: false,
        }),
      );
    if (plan.treatmentPlan || plan.patientEducation) {
      // already added above
    } else {
      elements.push(
        createBodyParagraph('— not documented', {
          indentLeft: FORMAT.indent.level1,
          italics: true,
          color: FORMAT.colors.grayText,
        }),
      );
    }
    // In-Clinic Treatment Plan (Frequency/Duration + Exercise table)
    elements.push(createSectionHeader('In-Clinic Treatment Plan', 2));
    const sched = [];
    if (plan.frequency) sched.push(`Frequency: ${plan.frequency}`);
    if (plan.duration) sched.push(`Duration: ${plan.duration}`);
    if (sched.length) {
      sched.forEach((line) => {
        const [label, ...rest] = line.split(': ');
        elements.push(
          createLabelValueLine(label, rest.join(': '), {
            indentLeft: FORMAT.indent.level1,
            bullet: false,
          }),
        );
      });
    } else {
      elements.push(
        createBodyParagraph('— not documented', {
          indentLeft: FORMAT.indent.level1,
          italics: true,
          color: FORMAT.colors.grayText,
        }),
      );
    }
    // Exercise simple table
    const exerciseRows =
      plan.exerciseTable && typeof plan.exerciseTable === 'object'
        ? Object.values(plan.exerciseTable)
        : [];
    if (exerciseRows && exerciseRows.length) {
      exerciseRows.forEach((row) => {
        const text = (row.exerciseText || row.exercise || '').toString();
        if (!text) return;
        elements.push(
          createLabelValueLine('', text, {
            indentLeft: FORMAT.indent.level1,
            bullet: true,
          }),
        );
      });
    } else {
      elements.push(
        createBodyParagraph('No in-clinic exercises documented', {
          indentLeft: FORMAT.indent.level1,
        }),
      );
    }

    // BILLING Section
    elements.push(createSectionDivider());
    elements.push(createWebSectionHeader('BILLING'));
    const billing = (draft && draft.billing) || {};
    // ICD-10 Codes
    elements.push(createSectionHeader('ICD-10 Codes', 2));
    const icdRows = Array.isArray(billing.diagnosisCodes)
      ? billing.diagnosisCodes
      : Array.isArray(billing.icdCodes)
        ? billing.icdCodes
        : [];
    if (icdRows.length) {
      icdRows.forEach((row) => {
        const primaryIndicator = row.isPrimary ? ' (Primary)' : '';
        // Use label if available, otherwise try to reconstruct it from code, finally fall back to description
        let displayText = row.label;
        if (!displayText && row.code) {
          // Try to find the label from the ICD-10 codes list based on the code
          const icdCodesList = [
            { value: 'M54.5', label: 'M54.5 - Low back pain' },
            {
              value: 'M51.36',
              label: 'M51.36 - Other intervertebral disc degeneration, lumbar region',
            },
            { value: 'M54.16', label: 'M54.16 - Radiculopathy, lumbar region' },
            { value: 'M54.2', label: 'M54.2 - Cervicalgia' },
            {
              value: 'M50.30',
              label: 'M50.30 - Other cervical disc degeneration, unspecified cervical region',
            },
            { value: 'M54.12', label: 'M54.12 - Radiculopathy, cervical region' },
            { value: 'M25.511', label: 'M25.511 - Pain in right shoulder' },
            { value: 'M25.512', label: 'M25.512 - Pain in left shoulder' },
            { value: 'M75.30', label: 'M75.30 - Calcific tendinitis of unspecified shoulder' },
            {
              value: 'M75.100',
              label:
                'M75.100 - Unspecified rotator cuff tear or rupture of unspecified shoulder, not specified as traumatic',
            },
            { value: 'M25.561', label: 'M25.561 - Pain in right knee' },
            { value: 'M25.562', label: 'M25.562 - Pain in left knee' },
          ];
          const foundCode = icdCodesList.find((c) => c.value === row.code);
          displayText = foundCode ? foundCode.label : `${row.code}: ${row.description}`;
        }
        if (!displayText) {
          displayText = `${row.code || 'No code'}: ${row.description || 'No description'}`;
        }
        const codeText = `${displayText}${primaryIndicator}`;
        elements.push(
          createLabelValueLine('', codeText, { indentLeft: FORMAT.indent.level1, bullet: true }),
        );
      });
    } else {
      elements.push(
        createBodyParagraph('No ICD-10 codes documented', { indentLeft: FORMAT.indent.level1 }),
      );
    }
    // CPT Codes
    elements.push(createSectionHeader('CPT Codes', 2));
    const cptRows = Array.isArray(billing.billingCodes)
      ? billing.billingCodes
      : Array.isArray(billing.cptCodes)
        ? billing.cptCodes
        : [];
    if (cptRows.length) {
      cptRows.forEach((row) => {
        // Use label if available, otherwise try to reconstruct it from code, finally fall back to description
        let displayText = row.label;
        if (!displayText && row.code) {
          // Try to find the label from the CPT codes list based on the code
          const cptCodesList = [
            { value: '97110', label: '97110 - Therapeutic Exercise' },
            { value: '97112', label: '97112 - Neuromuscular Re-education' },
            { value: '97116', label: '97116 - Gait Training' },
            { value: '97140', label: '97140 - Manual Therapy' },
            { value: '97530', label: '97530 - Therapeutic Activities' },
            { value: '97535', label: '97535 - Self-Care Training' },
            { value: '97012', label: '97012 - Mechanical Traction' },
            { value: '97014', label: '97014 - Electrical Stimulation' },
            { value: '97035', label: '97035 - Ultrasound' },
            { value: '97039', label: '97039 - Unlisted Modality' },
            { value: '97161', label: '97161 - PT Evaluation Low Complexity' },
            { value: '97162', label: '97162 - PT Evaluation Moderate Complexity' },
            { value: '97163', label: '97163 - PT Evaluation High Complexity' },
            { value: '97164', label: '97164 - PT Re-evaluation' },
            { value: '97010', label: '97010 - Hot/Cold Packs' },
            { value: '97018', label: '97018 - Paraffin Bath' },
            { value: '97022', label: '97022 - Whirlpool' },
            { value: '97032', label: '97032 - Electrical Stimulation (Manual)' },
            { value: '97033', label: '97033 - Iontophoresis' },
          ];
          const foundCode = cptCodesList.find((c) => c.value === row.code);
          displayText = foundCode ? foundCode.label : row.description;
        }
        if (!displayText) {
          displayText = row.description || `${row.code || 'No code'}`;
        }
        let codeText = displayText;
        if (row.units != null || row.timeSpent) {
          const unitsText = row.units != null ? `${row.units} units` : '';
          const timeText = row.timeSpent ? `${row.timeSpent}` : '';
          const additionalInfo = [unitsText, timeText].filter(Boolean).join(', ');
          if (additionalInfo) {
            codeText += ` (${additionalInfo})`;
          }
        }
        elements.push(
          createLabelValueLine('', codeText, { indentLeft: FORMAT.indent.level1, bullet: true }),
        );
      });
    } else {
      elements.push(
        createBodyParagraph('No CPT codes documented', { indentLeft: FORMAT.indent.level1 }),
      );
    }
    // Orders & Referrals
    elements.push(createSectionHeader('Orders & Referrals', 2));
    const ordRows = Array.isArray(billing.ordersReferrals) ? billing.ordersReferrals : [];
    if (ordRows.length) {
      ordRows.forEach((row) => {
        const orderText = `${row.type || 'No type'}: ${row.details || 'No details'}`;
        elements.push(
          createLabelValueLine('', orderText, { indentLeft: FORMAT.indent.level1, bullet: true }),
        );
      });
    } else {
      elements.push(
        createBodyParagraph('No orders or referrals documented', {
          indentLeft: FORMAT.indent.level1,
        }),
      );
    }

    // Create the document
    // Footer with patient identifiers and page numbers
    let footer = null;
    const footerSupported =
      typeof Footer !== 'undefined' &&
      typeof PageNumber !== 'undefined' &&
      typeof NumberOfTotalPages !== 'undefined';
    if (footerSupported) {
      const patientName = getSafeValue(
        caseData,
        'snapshot.name',
        getSafeValue(caseData, 'title', 'Patient'),
      );
      const idLeft = new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          createTextRun(`${patientName} | DOB: ${dobValue || ''} | DoS: ${fmtDate(new Date())}`, {
            size: FORMAT.sizes.small,
          }),
        ],
      });
      const pageCenter = new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          createTextRun('Page ', { size: FORMAT.sizes.small }),
          PageNumber.CURRENT,
          createTextRun(' of ', { size: FORMAT.sizes.small }),
          NumberOfTotalPages.CURRENT,
        ],
      });

      const isDraftExport = !!(
        draft &&
        (draft.isDraft === true || draft.__isDraft === true || draft.__exportStatus === 'draft')
      );
      const draftBanner = isDraftExport
        ? new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              createTextRun('DRAFT – for educational use only', {
                size: FORMAT.sizes.small,
                bold: true,
                color: FORMAT.colors.gray,
              }),
            ],
          })
        : null;

      footer = new Footer({
        children: [draftBanner, idLeft, pageCenter].filter(Boolean),
      });
    }

    // Append signature block if present (meta.signature)
    try {
      const sig =
        (caseData && caseData.meta && caseData.meta.signature) ||
        (draft && draft.meta && draft.meta.signature);
      if (sig && sig.name) {
        elements.push(createSectionDivider());
        elements.push(createSectionHeader('Electronic Signature', 2, { indentLeft: 0 }));
        const line = `${sig.name}${sig.title ? ', ' + sig.title : ''}`;
        const ts = (() => {
          try {
            return new Date(sig.signedAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            });
          } catch {
            return sig.signedAt;
          }
        })();
        // Two-line signature display per request
        elements.push(
          new Paragraph({
            children: [createTextRun('Signed by: ', { bold: true }), createTextRun(line, {})],
          }),
        );
        elements.push(
          new Paragraph({
            spacing: { after: FORMAT.spacing.small },
            children: [createTextRun('Date/Time: ', { bold: true }), createTextRun(ts, {})],
          }),
        );
      }
    } catch (e) {
      console.warn('Failed to append signature block', e);
    }

    const sectionDef = {
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
            header: 720,
            footer: 720,
            gutter: 0,
          },
        },
      },
      children: elements,
      headers:
        typeof Header !== 'undefined'
          ? {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                      createTextRun(
                        'PT Evaluation — University of North Dakota Physical Therapy Program',
                        { size: FORMAT.sizes.small, color: FORMAT.colors.gray },
                      ),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
    };
    if (footer) {
      sectionDef.footers = { default: footer };
    }

    const doc = new Document({
      creator: 'UND PT Program',
      title: 'Physical Therapy Evaluation',
      description: 'Educational EMR simulation export',
      sections: [sectionDef],
      styles: {
        default: {
          document: {
            run: {
              font: FORMAT.font,
              size: FORMAT.sizes.body,
            },
            paragraph: {
              spacing: {
                line: FORMAT.spacing.lineSpacing,
              },
            },
          },
        },
        // Additional style definitions for better typography
        paragraphStyles: [
          {
            id: 'Heading1UND',
            name: 'UND Heading 1',
            basedOn: 'Heading1',
            run: {
              font: FORMAT.headingFont,
              size: FORMAT.sizes.heading1,
              color: FORMAT.colors.blue,
              bold: true,
            },
          },
          {
            id: 'Heading2UND',
            name: 'UND Heading 2',
            basedOn: 'Heading2',
            run: {
              font: FORMAT.font,
              size: FORMAT.sizes.heading2,
              color: FORMAT.colors.darkBlue,
              bold: true,
            },
          },
        ],
      },
    });

    // Generate and download the document
    Packer.toBlob(doc)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PT_Evaluation_${getSafeValue(caseData, 'snapshot.name', getSafeValue(caseData, 'title', 'Patient')).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error('Error generating document blob:', error);
        alert('Failed to generate document file. Please try again.');
      });
  } catch (error) {
    console.error('Word document export failed:', error);
    alert(
      'Failed to export Word document. Please check that all required libraries are loaded and try again.',
    );
  }
}
