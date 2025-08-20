// Document export functionality for PT EMR Sim
// Handles Word document generation with professional formatting

export function exportToWord(caseData, draft) {
  try {
    // Check if docx library is available
    if (typeof docx === 'undefined') {
      console.error('Docx library not found. Available globals:', Object.keys(window || {}).filter(k => k.toLowerCase().includes('docx')));
      alert('Word export library not loaded. Please refresh the page and try again.');
      return;
    }
    
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, WidthType, Footer, PageNumber, NumberOfTotalPages, UnderlineType, VerticalAlign } = docx;
    
    // Centralized formatting configuration with accessibility enhancements
    const FORMAT = {
      // Font settings - Calibri is highly accessible
      font: "Calibri",
      
      // Text sizes (minimum 11pt for accessibility)
      sizes: {
        title: 28,      // 14pt - Main document title
        heading1: 24,   // 12pt - Major sections (SUBJECTIVE, OBJECTIVE, etc.)
        heading2: 22,   // 11pt - Subsections (Pain Assessment, etc.)
        body: 22,       // 11pt - Body text (minimum accessible size)
        small: 20       // 10pt - Table text, hints
      },
      
      // Colors with WCAG AA contrast compliance
      colors: {
        black: "000000",       // Pure black for maximum contrast
  blue: "0B4F6C",        // High-contrast UND-adjacent blue for headers
  darkBlue: "0B3A53",    // Darker blue for title emphasis
        red: "B22222",         // Accessible red for missing content
        green: "006400",       // Dark green for success
        orange: "FF8C00",      // Orange for warnings
        gray: "4A4A4A",        // Dark gray for better contrast
  lightGray: "F2F2F2",   // Light gray for table headers
  zebra: "FAFAFA"        // Alternate row shading
      },
      
      // Spacing (in points)
      spacing: {
        beforeSection: 240,    // 12pt space before major sections
        afterSection: 120,     // 6pt space after major sections
        beforeSubsection: 120, // 6pt space before subsections
        afterSubsection: 60,   // 3pt space after subsections
        beforeParagraph: 60,   // 3pt space before paragraphs
        afterParagraph: 60,    // 3pt space after paragraphs
        lineSpacing: 240       // 1.2x line spacing for readability
      },
      
      // Table formatting
      table: {
        borderSize: 4,
        cellPadding: 100  // 5pt in twentieths of a point
      },
      // Indentation levels (in twips; 1 inch = 1440)
      indent: {
        level1: 720,   // 0.5"
        level2: 1080   // 0.75"
      }
    };

    // Helper function to create a subtle divider between main sections
    const createSectionDivider = () => {
      // Single, pronounced rule for wide compatibility
      const cell = new TableCell({
        children: [new Paragraph('')],
        shading: undefined,
        margins: { top: 80, bottom: 80, left: 0, right: 0 }
      });
      return new Table({
        rows: [new TableRow({ children: [cell] })],
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.SINGLE, size: 12, color: '8A8A8A' },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
        }
      });
    };

    // Helper function to safely access nested object properties
    const getSafeValue = (obj, path, defaultValue = '') => {
      try {
        return path.split('.').reduce((curr, prop) => curr?.[prop], obj) || defaultValue;
      } catch (error) {
        return defaultValue;
      }
    };

    // Helper function to format arrays
    const formatArray = (arr, defaultValue = '') => {
      if (!Array.isArray(arr) || arr.length === 0) return defaultValue;
      return arr.join(', ');
    };

    // Helper function to create styled text runs
  const createTextRun = (text, options = {}) => {
      return new TextRun({
        text: text?.toString() || '',
        font: FORMAT.font,
        size: options.size || FORMAT.sizes.body,
        color: options.color || FORMAT.colors.black,
        bold: options.bold || false,
    italics: options.italics || false,
    underline: options.underline
      });
    };

    // Helper function to create section headers
    const createSectionHeader = (text, level = 1) => {
      const spacing = level === 1 ? 
        { before: FORMAT.spacing.beforeSection, after: FORMAT.spacing.afterSection } :
        { before: FORMAT.spacing.beforeSubsection, after: FORMAT.spacing.afterSubsection };
        
    return new Paragraph({
        children: [createTextRun(text, { 
          size: level === 1 ? FORMAT.sizes.heading1 : FORMAT.sizes.heading2,
          color: FORMAT.colors.blue,
      bold: true,
      underline: { type: (typeof UnderlineType !== 'undefined' ? UnderlineType.NONE : 'none') }
        })],
        heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        spacing: spacing
      });
    };

    // Helper function to create body paragraphs
  const createBodyParagraph = (text, options = {}) => {
      if (!text || text.trim() === '') {
        return new Paragraph({
          children: [createTextRun('[Content not provided]', { 
            color: FORMAT.colors.red, 
            italics: true 
          })],
          spacing: { 
            before: FORMAT.spacing.beforeParagraph, 
            after: FORMAT.spacing.afterParagraph,
            line: FORMAT.spacing.lineSpacing
      },
      indent: options.indentLeft ? { left: options.indentLeft } : undefined
        });
      }

      const textRuns = text.split('\n').map((line, index, array) => {
        const runs = [createTextRun(line, options)];
        if (index < array.length - 1) {
          runs.push(new TextRun({ break: 1 }));
        }
        return runs;
      }).flat();

      return new Paragraph({
        children: textRuns,
        spacing: { 
          before: FORMAT.spacing.beforeParagraph, 
          after: FORMAT.spacing.afterParagraph,
          line: FORMAT.spacing.lineSpacing
        },
        indent: options.indentLeft ? { left: options.indentLeft } : undefined,
        ...options
      });
    };

    // Helper: create a simple bulleted list from lines with indentation
    const createBulletedList = (lines, indentLeft) => {
      if (!Array.isArray(lines) || lines.length === 0) return [];
      return lines.map(line => new Paragraph({
        children: [createTextRun(`• ${line}`, { size: FORMAT.sizes.body })],
        spacing: { before: 20, after: 20, line: FORMAT.spacing.lineSpacing },
        indent: indentLeft ? { left: indentLeft } : undefined
      }));
    };

  // Helper function to create tables with proper formatting (zebra rows)
    const createFormattedTable = (data, headers = []) => {
      const rows = [];
      
      // Add header row if provided
      if (headers.length > 0) {
        const headerCells = headers.map(header => 
          new TableCell({
            children: [new Paragraph({
              children: [createTextRun(header, { 
                bold: true, 
                size: FORMAT.sizes.small,
                color: FORMAT.colors.darkBlue
              })]
            })],
            shading: { fill: FORMAT.colors.lightGray },
            verticalAlign: (typeof VerticalAlign !== 'undefined' ? VerticalAlign.CENTER : undefined),
            margins: { top: FORMAT.table.cellPadding, bottom: FORMAT.table.cellPadding, left: FORMAT.table.cellPadding, right: FORMAT.table.cellPadding }
          })
        );
        rows.push(new TableRow({ children: headerCells }));
      }
      
      // Add data rows
      data.forEach((rowData, idx) => {
        const cells = rowData.map(cellData => 
          new TableCell({
            children: [new Paragraph({
              children: [createTextRun(cellData?.toString() || '', { size: FORMAT.sizes.small })]
            })],
            margins: { top: FORMAT.table.cellPadding, bottom: FORMAT.table.cellPadding, left: FORMAT.table.cellPadding, right: FORMAT.table.cellPadding },
            verticalAlign: (typeof VerticalAlign !== 'undefined' ? VerticalAlign.CENTER : undefined),
            shading: (idx % 2 === 0) ? undefined : { fill: FORMAT.colors.zebra }
          })
        );
        rows.push(new TableRow({ children: cells }));
      });

      return new Table({
        rows: rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: FORMAT.table.borderSize },
          bottom: { style: BorderStyle.SINGLE, size: FORMAT.table.borderSize },
          left: { style: BorderStyle.SINGLE, size: FORMAT.table.borderSize },
          right: { style: BorderStyle.SINGLE, size: FORMAT.table.borderSize },
          insideHorizontal: { style: BorderStyle.SINGLE, size: FORMAT.table.borderSize },
          insideVertical: { style: BorderStyle.SINGLE, size: FORMAT.table.borderSize }
        }
      });
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

    // Helper function to format ROM data
    const formatRomData = (romData) => {
      if (!romData || typeof romData !== 'object') return 'No ROM data available';
      
      const entries = [];
      Object.entries(romData).forEach(([joint, measurements]) => {
        if (measurements && typeof measurements === 'object') {
          Object.entries(measurements).forEach(([movement, value]) => {
            if (value) entries.push(`${joint} ${movement}: ${value}`);
          });
        }
      });
      
      return entries.length > 0 ? entries.join(', ') : 'No ROM measurements recorded';
    };

    // Helper function to format MMT data
    const formatMmtData = (mmtData) => {
      if (!mmtData || typeof mmtData !== 'object') return 'No MMT data available';
      
      const entries = [];
      Object.entries(mmtData).forEach(([muscle, data]) => {
        if (data && typeof data === 'object') {
          Object.entries(data).forEach(([side, grade]) => {
            if (grade) entries.push(`${muscle} (${side}): ${grade}`);
          });
        }
      });
      
      return entries.length > 0 ? entries.join(', ') : 'No MMT measurements recorded';
    };

    // Helper function to format special tests (Left/Right)
    const formatSpecialTests = (testsData) => {
      if (!testsData || typeof testsData !== 'object') return 'No special tests performed';
      const entries = [];
      Object.entries(testsData).forEach(([key, val]) => {
        if (!val) return;
        if (typeof val === 'object') {
          const name = val.name || key;
          const l = val.left ? `L: ${val.left}` : '';
          const r = val.right ? `R: ${val.right}` : '';
          const n = val.notes ? `Notes: ${val.notes}` : '';
          const parts = [l, r, n].filter(Boolean).join(' | ');
          if (parts) entries.push(`${name} — ${parts}`);
        } else if (val) {
          entries.push(`${key}: ${val}`);
        }
      });
      return entries.length > 0 ? entries.join(', ') : 'No special tests recorded';
    };

    // Main document content creation
    const elements = [];

    // Document Title with enhanced formatting
    elements.push(new Paragraph({
      children: [createTextRun('Physical Therapy Evaluation Report', { 
        size: FORMAT.sizes.title, 
        color: FORMAT.colors.darkBlue,
        bold: true,
        underline: { type: (typeof UnderlineType !== 'undefined' ? UnderlineType.NONE : 'none') }
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: FORMAT.spacing.beforeSection }
    }));
    elements.push(new Paragraph({
      children: [createTextRun('Patient Evaluation Summary', { size: FORMAT.sizes.small, color: FORMAT.colors.gray })],
      alignment: AlignmentType.CENTER,
      spacing: { after: FORMAT.spacing.afterSection }
    }));

  // Patient Information Section
  elements.push(createSectionHeader('PATIENT INFORMATION'));
    
    // Prefer snapshot.dob, then top-level patientDOB, then meta.patientDOB
    const dobValue = getSafeValue(caseData, 'snapshot.dob') || getSafeValue(caseData, 'patientDOB') || getSafeValue(caseData, 'meta.patientDOB', '');
    const computedAge = computeAgeFromDob(dobValue);
    const ageValue = computedAge || getSafeValue(caseData, 'snapshot.age', getSafeValue(caseData, 'patientAge', 'Not specified'));
    const genderValue = getSafeValue(caseData, 'snapshot.sex', getSafeValue(caseData, 'patientGender', 'Not specified'));

    const subjQuick = (draft && draft.subjective) || {};
    const patientInfo = [
      ['Patient Name:', getSafeValue(caseData, 'snapshot.name', getSafeValue(caseData, 'title', 'Not specified'))],
      ['DOB:', dobValue || 'Not specified'],
      ['Age:', ageValue || 'Not specified'],
      ['Gender:', genderValue || 'Not specified'],
      ['Primary Complaint:', subjQuick.chiefComplaint || getSafeValue(caseData, 'history.chief_complaint', 'Not specified')],
      ['Date of Evaluation:', new Date().toLocaleDateString()]
    ];
    
    elements.push(createFormattedTable(patientInfo));

  // SUBJECTIVE Section (draft-first mapping)
  elements.push(createSectionDivider());
  elements.push(createSectionHeader('SUBJECTIVE'));
    const subj = (draft && draft.subjective) || {};
    elements.push(createSectionHeader('History of Present Illness', 2));
  elements.push(createBodyParagraph(subj.historyOfPresentIllness || getSafeValue(caseData, 'history.hpi') || '', { indentLeft: FORMAT.indent.level1 }));
    elements.push(createSectionHeader('Chief Concern', 2));
  elements.push(createBodyParagraph(subj.chiefComplaint || getSafeValue(caseData, 'history.chief_complaint') || '', { indentLeft: FORMAT.indent.level1 }));
    elements.push(createSectionHeader('Symptom Assessment', 2));
    const painLines = [];
    if (subj.painLocation) painLines.push(`Location: ${subj.painLocation}`);
    if (subj.painScale) painLines.push(`Pain Scale: ${subj.painScale}/10`);
    if (subj.painQuality) painLines.push(`Quality: ${subj.painQuality}`);
    if (subj.painPattern) painLines.push(`Pattern: ${subj.painPattern}`);
    if (subj.aggravatingFactors) painLines.push(`Aggravating: ${subj.aggravatingFactors}`);
    if (subj.easingFactors) painLines.push(`Easing: ${subj.easingFactors}`);
    if (painLines.length) {
      elements.push(...createBulletedList(painLines, FORMAT.indent.level1));
    } else {
      elements.push(createBodyParagraph('Pain assessment not completed', { indentLeft: FORMAT.indent.level1 }));
    }
    elements.push(createSectionHeader('Functional Status', 2));
    const funcLines = [];
    if (subj.functionalLimitations) funcLines.push(`Current Limitations: ${subj.functionalLimitations}`);
    if (subj.priorLevel) funcLines.push(`Prior Level of Function: ${subj.priorLevel}`);
    if (subj.patientGoals) funcLines.push(`Patient Goals: ${subj.patientGoals}`);
    if (funcLines.length) {
      elements.push(...createBulletedList(funcLines, FORMAT.indent.level1));
    } else {
      elements.push(createBodyParagraph('Functional status not documented', { indentLeft: FORMAT.indent.level1 }));
    }
    elements.push(createSectionHeader('Additional History', 2));
    const addLines = [];
    if (subj.medicationsCurrent) addLines.push(`Current Medications: ${subj.medicationsCurrent}`);
    if (subj.redFlags) addLines.push(`Red Flags/Screening: ${subj.redFlags}`);
    if (subj.additionalHistory) addLines.push(`Additional Relevant History: ${subj.additionalHistory}`);
    if (addLines.length) {
      elements.push(...createBulletedList(addLines, FORMAT.indent.level1));
    } else {
      elements.push(createBodyParagraph('No additional history provided', { indentLeft: FORMAT.indent.level1 }));
    }

  // OBJECTIVE Section (draft-first)
  elements.push(createSectionDivider());
  elements.push(createSectionHeader('OBJECTIVE'));
    const obj = (draft && draft.objective) || {};
    // General observations & vitals
    elements.push(createSectionHeader('General Observations & Vital Signs', 2));
  elements.push(createBodyParagraph(obj.text || '', { indentLeft: FORMAT.indent.level1 }));
    // Inspection/Palpation
    elements.push(createSectionHeader('Inspection', 2));
  elements.push(createBodyParagraph(getSafeValue(obj, 'inspection.visual', ''), { indentLeft: FORMAT.indent.level1 }));
    elements.push(createSectionHeader('Palpation', 2));
  elements.push(createBodyParagraph(getSafeValue(obj, 'palpation.findings', ''), { indentLeft: FORMAT.indent.level1 }));
    // Regional Assessment
    elements.push(createSectionHeader('Regional Assessment', 2));
    const ra = obj.regionalAssessments || {};
    const romObj = ra.rom || ra.romData || {};
    const mmtObj = ra.mmt || ra.mmtData || {};
  const testsObj = ra.specialTests || ra.testData || {};
    const describeTableLike = (dataObj, labelL = 'Left', labelR = 'Right') => {
      if (!dataObj || typeof dataObj !== 'object') return [];
      const lines = [];
      Object.entries(dataObj).forEach(([name, row]) => {
        if (row && typeof row === 'object') {
          const l = row.left ? `${labelL}: ${row.left}` : '';
          const r = row.right ? `${labelR}: ${row.right}` : '';
          const n = row.notes ? `Notes: ${row.notes}` : '';
          const parts = [l, r, n].filter(Boolean).join(' | ');
          const base = row.normal ? `${name} (Normal: ${row.normal})` : name;
          if (parts) lines.push(`${base} — ${parts}`); else if (base) lines.push(base);
        }
      });
      return lines;
    };
    const romLines = describeTableLike(romObj);
    const mmtLines = describeTableLike(mmtObj);
    const testLines = [];
    if (testsObj && typeof testsObj === 'object') {
      Object.entries(testsObj).forEach(([testId, value]) => {
        if (!value) return;
        if (typeof value === 'object') {
          const name = value.name || testId;
          const l = value.left ? `L: ${value.left}` : '';
          const r = value.right ? `R: ${value.right}` : '';
          const n = value.notes ? ` (${value.notes})` : '';
          const parts = [l, r].filter(Boolean).join(' | ');
          if (parts || n) testLines.push(`${name}: ${parts}${n}`);
        } else {
          testLines.push(`${testId}: ${value}`);
        }
      });
    }
  elements.push(createBodyParagraph(romLines.join('\n') || 'No ROM measurements recorded', { indentLeft: FORMAT.indent.level1 }));
  elements.push(createBodyParagraph(mmtLines.join('\n') || 'No MMT measurements recorded', { indentLeft: FORMAT.indent.level1 }));
    if (testLines.length) {
      elements.push(...createBulletedList(testLines, FORMAT.indent.level1));
    } else {
      elements.push(createBodyParagraph('No special tests recorded', { indentLeft: FORMAT.indent.level1 }));
    }
    // Neuro/Functional
    elements.push(createSectionHeader('Neurological Screening', 2));
  elements.push(createBodyParagraph(getSafeValue(obj, 'neuro.screening', ''), { indentLeft: FORMAT.indent.level1 }));
    elements.push(createSectionHeader('Functional Movement Assessment', 2));
  elements.push(createBodyParagraph(getSafeValue(obj, 'functional.assessment', ''), { indentLeft: FORMAT.indent.level1 }));
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
  elements.push(createSectionHeader('ASSESSMENT'));
    const assess = (draft && draft.assessment) || {};
    elements.push(createSectionHeader('Primary Impairments', 2));
  elements.push(createBodyParagraph(assess.primaryImpairments || '', { indentLeft: FORMAT.indent.level1 }));
    elements.push(createSectionHeader('ICF Classification', 2));
    const icfLines = [];
    if (assess.bodyFunctions) icfLines.push(`Body Functions: ${assess.bodyFunctions}`);
    if (assess.activityLimitations) icfLines.push(`Activity Limitations: ${assess.activityLimitations}`);
    if (assess.participationRestrictions) icfLines.push(`Participation Restrictions: ${assess.participationRestrictions}`);
    if (icfLines.length) {
      elements.push(...createBulletedList(icfLines, FORMAT.indent.level1));
    }
    elements.push(createSectionHeader('Physical Therapy Diagnosis & Prognosis', 2));
    const dxProg = [];
    if (assess.ptDiagnosis) dxProg.push(`PT Diagnosis: ${assess.ptDiagnosis}`);
    if (assess.prognosis) dxProg.push(`Prognosis: ${assess.prognosis}`);
    if (dxProg.length) {
      elements.push(...createBulletedList(dxProg, FORMAT.indent.level1));
    }
    elements.push(createSectionHeader('Clinical Reasoning', 2));
  elements.push(createBodyParagraph(assess.clinicalReasoning || '', { indentLeft: FORMAT.indent.level1 }));

  // PLAN Section (draft-first)
  elements.push(createSectionDivider());
  elements.push(createSectionHeader('PLAN'));
    const plan = (draft && draft.plan) || {};
    // SMART Goals first
    elements.push(createSectionHeader('SMART Goals & Outcomes', 2));
    const goalRows = plan.goalsTable && typeof plan.goalsTable === 'object' ? Object.values(plan.goalsTable) : [];
    if (goalRows && goalRows.length) {
      const goalsData = goalRows.map((row, i) => [String(i + 1), (row.goalText || row.goal || '').toString()]);
      elements.push(createFormattedTable(goalsData, ['#', 'Goal']));
    } else {
      elements.push(createBodyParagraph('No goals documented'));
    }
    // Plan of Care next
    elements.push(createSectionHeader('Plan of Care', 2));
    const pocLines = [];
    if (plan.treatmentPlan) pocLines.push(`Treatment Plan & Interventions: ${plan.treatmentPlan}`);
    if (plan.patientEducation) pocLines.push(`Patient Education: ${plan.patientEducation}`);
    elements.push(createBodyParagraph(pocLines.join('\n') || '', { indentLeft: FORMAT.indent.level1 }));
    // In-Clinic Treatment Plan (Frequency/Duration + Exercise table)
    elements.push(createSectionHeader('In-Clinic Treatment Plan', 2));
    const sched = [];
    if (plan.frequency) sched.push(`Frequency: ${plan.frequency}`);
    if (plan.duration) sched.push(`Duration: ${plan.duration}`);
    if (sched.length) {
      elements.push(...createBulletedList(sched, FORMAT.indent.level1));
    }
    // Exercise simple table
    const exerciseRows = plan.exerciseTable && typeof plan.exerciseTable === 'object' ? Object.values(plan.exerciseTable) : [];
    if (exerciseRows && exerciseRows.length) {
      const exerciseData = exerciseRows.map((row, i) => [String(i + 1), (row.exerciseText || row.exercise || '').toString()]);
      elements.push(createFormattedTable(exerciseData, ['#', 'In-Clinic Exercises / Interventions']));
    }

  // BILLING Section
  elements.push(createSectionDivider());
  elements.push(createSectionHeader('BILLING'));
    const billing = (draft && draft.billing) || {};
    // ICD-10 Codes
    elements.push(createSectionHeader('ICD-10 Codes', 2));
    const icdRows = Array.isArray(billing.diagnosisCodes) ? billing.diagnosisCodes : (Array.isArray(billing.icdCodes) ? billing.icdCodes : []);
    if (icdRows.length) {
      const icdData = icdRows.map((row, i) => [
        String(i + 1),
        row.code || '',
        row.description || '',
        row.isPrimary ? 'Primary' : ''
      ]);
      elements.push(createFormattedTable(icdData, ['#', 'Code', 'Description', '']));
    } else {
      elements.push(createBodyParagraph('No ICD-10 codes documented'));
    }
    // CPT Codes
    elements.push(createSectionHeader('CPT Codes', 2));
    const cptRows = Array.isArray(billing.billingCodes) ? billing.billingCodes : (Array.isArray(billing.cptCodes) ? billing.cptCodes : []);
    if (cptRows.length) {
      const cptData = cptRows.map((row, i) => [
        String(i + 1),
        row.code || '',
        row.description || '',
        (row.units != null ? String(row.units) : ''),
        row.timeSpent || ''
      ]);
      elements.push(createFormattedTable(cptData, ['#', 'Code', 'Description', 'Units', 'Time Spent']));
    } else {
      elements.push(createBodyParagraph('No CPT codes documented'));
    }
    // Orders & Referrals
    elements.push(createSectionHeader('Orders & Referrals', 2));
    const ordRows = Array.isArray(billing.ordersReferrals) ? billing.ordersReferrals : [];
    if (ordRows.length) {
      const ordData = ordRows.map((row, i) => [String(i + 1), row.type || '', row.details || '']);
      elements.push(createFormattedTable(ordData, ['#', 'Type', 'Details']));
    } else {
      elements.push(createBodyParagraph('No orders or referrals documented'));
    }

    // Create the document
    // Footer with page numbers (Page X of Y)
    let footer = null;
    const footerSupported = typeof Footer !== 'undefined' && typeof PageNumber !== 'undefined' && typeof NumberOfTotalPages !== 'undefined';
    if (footerSupported) {
      footer = new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              createTextRun('Page ', { size: FORMAT.sizes.small }),
              PageNumber.CURRENT,
              createTextRun(' of ', { size: FORMAT.sizes.small }),
              NumberOfTotalPages.CURRENT
            ]
          })
        ]
      });
    }

    const sectionDef = {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 720, footer: 720, gutter: 0 }
        }
      },
      children: elements
    };
    if (footer) {
      sectionDef.footers = { default: footer };
    }

    const doc = new Document({
      sections: [sectionDef],
      styles: {
        default: {
          document: {
            run: {
              font: FORMAT.font
            },
            paragraph: {
              spacing: {
                line: FORMAT.spacing.lineSpacing
              }
            }
          }
        }
      }
    });

    // Generate and download the document
    Packer.toBlob(doc).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PT_Evaluation_${getSafeValue(caseData, 'snapshot.name', getSafeValue(caseData, 'title', 'Patient')).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }).catch(error => {
      console.error('Error generating document blob:', error);
      alert('Failed to generate document file. Please try again.');
    });

  } catch (error) {
    console.error('Word document export failed:', error);
    alert('Failed to export Word document. Please check that all required libraries are loaded and try again.');
  }
}
