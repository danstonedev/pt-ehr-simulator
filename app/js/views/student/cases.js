import { route, navigate } from '../../core/router.js';
import { getCase, listCases } from '../../core/store.js';
import { el } from '../../ui/utils.js';
route('#/student/cases', async (app) => {
  app.innerHTML = ''; // Clear previous content
  
  // No separate header container; everything lives in the main panel below

  try {
    // Get all available cases
  const cases = await listCases();
    
    // Ensure cases is an array
    if (!Array.isArray(cases)) {
      app.append(el('div', {class:'panel error'}, 'Could not load cases. Please check the console for details.'));
      return;
    }

    if (cases.length === 0) {
      app.append(el('div', {class:'panel'}, [
        el('p', {}, 'No cases are currently available.'),
        el('p', {}, 'Please contact your instructor if you believe this is an error.')
      ]));
      return;
    }

    // Scan localStorage for existing drafts
    const drafts = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('draft_')) {
        try {
          const draftData = JSON.parse(localStorage.getItem(key));
          const draftPrefix = 'draft_';
          const keyWithoutPrefix = key.substring(draftPrefix.length);
          const lastUnderscoreIndex = keyWithoutPrefix.lastIndexOf('_');
          
          if (lastUnderscoreIndex === -1) continue;
          
          const caseId = keyWithoutPrefix.substring(0, lastUnderscoreIndex);
          const encounter = keyWithoutPrefix.substring(lastUnderscoreIndex + 1);
          
          // Calculate completion percentage - handle both old and new data formats
          const sections = ['subjective', 'assessment', 'goals', 'plan', 'billing'];
          
          // Count completed sections, handling both string and object formats
          let completedSections = 0;
          
          sections.forEach(section => {
            const sectionData = draftData[section];
            if (!sectionData) return;
            
            if (typeof sectionData === 'string') {
              // Old format - string
              if (sectionData.trim().length > 0) completedSections++;
            } else if (typeof sectionData === 'object') {
              // New format - object with multiple fields
              if (section === 'subjective') {
                // Check if any subjective fields have content
                const hasSubjectiveContent = Object.values(sectionData).some(value => 
                  value && typeof value === 'string' && value.trim().length > 0
                );
                if (hasSubjectiveContent) completedSections++;
              } else if (section === 'assessment') {
                // Check if any assessment fields have content
                const hasAssessmentContent = Object.values(sectionData).some(value => 
                  value && typeof value === 'string' && value.trim().length > 0
                );
                if (hasAssessmentContent) completedSections++;
              }
            }
          });
          
          // Check objective section completion (could have text or regional data)
          const objectiveData = draftData.objective;
          let hasObjectiveContent = false;
          if (objectiveData) {
            // Check traditional text content
            if (objectiveData.text && objectiveData.text.trim().length > 0) {
              hasObjectiveContent = true;
            }
            // Check regional assessment data
            else if (objectiveData.selectedRegions && objectiveData.selectedRegions.length > 0) {
              hasObjectiveContent = true;
            }
          }
          
          if (hasObjectiveContent) completedSections++;
          
          const totalSections = sections.length + 1; // +1 for objective
          const completionPercent = Math.round((completedSections / totalSections) * 100);
          
          if (!drafts[caseId]) drafts[caseId] = {};
          drafts[caseId][encounter] = {
            completionPercent,
            hasContent: completedSections > 0
          };
        } catch (error) {
          console.warn('Could not parse draft data for key:', key, error);
          // Remove corrupted draft data to prevent future errors
          localStorage.removeItem(key);

        }
      }
    }

    // Panel container for the list + table (to match faculty layout)
    let searchTerm = '';
    const casesPanel = el('div', { class: 'panel' }, [
      el('div', { class: 'flex-between', style: 'margin-bottom: 16px; align-items:center; gap:12px;' }, [
        el('div', {}, [
          el('h2', {}, 'Student Dashboard'),
          el('p', { class: 'small' }, 'Select a case to begin or continue working on your documentation.')
        ])
      ]),
      el('input', {
        type: 'text',
        placeholder: 'Search cases by title, setting, diagnosis, or acuity...',
        style: 'width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 14px; margin-bottom: 16px;',
        onInput: (e) => { searchTerm = (e.target.value || '').toLowerCase(); renderTable(); }
      })
    ]);
    app.append(casesPanel);

    function openCreateNoteModal() {
      const overlay = el('div', {
        style: 'position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000;',
        onclick: (e) => { if (e.target === overlay) document.body.removeChild(overlay); }
      });
      const defaultTitle = `Blank SOAP Note — ${new Date().toLocaleDateString()}`;
      const content = el('div', {
        style: 'background:var(--bg); color:var(--text); padding:24px; border-radius:12px; width:92%; max-width:520px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);'
      }, [
        el('h3', { style: 'margin-top:0;' }, 'Create SOAP Note'),
  el('p', { class: 'small', style: 'margin-top:4px; color:var(--text-secondary);' }, 'Give your note a title so you can find it later.'),
        el('label', { class: 'form-label-standard', style: 'margin-top:12px;' }, 'Note Title'),
        el('input', {
          id: 'student-note-title-input',
          type: 'text',
          class: 'form-input-standard',
          value: defaultTitle,
          placeholder: 'e.g., Shoulder Pain Eval - Aug 2025',
          style: 'width:100%; box-sizing:border-box;'
        }),
        el('div', { style: 'display:flex; gap:8px; justify-content:flex-end; margin-top:18px;' }, [
          el('button', { class: 'btn secondary', onClick: () => document.body.removeChild(overlay) }, 'Cancel'),
          el('button', { class: 'btn primary', onClick: () => {
            const input = content.querySelector('#student-note-title-input');
            const title = (input && input.value ? input.value : '').trim() || 'Blank SOAP Note';
            const id = `blank-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
            try {
              // Initialize minimal draft so it appears in the list with the chosen title
              const draftKey = `draft_${id}_eval`;
              const initialDraft = { noteTitle: title, __savedAt: Date.now() };
              localStorage.setItem(draftKey, JSON.stringify(initialDraft));
            } catch (e) { console.warn('Could not pre-save blank note draft:', e); }
            document.body.removeChild(overlay);
            navigate(`#/student/editor?case=${id}&v=0&encounter=eval`);
          } }, 'Create')
        ])
      ]);
      overlay.append(content);
      document.body.append(overlay);
      setTimeout(() => content.querySelector('#student-note-title-input')?.focus(), 0);
    }

    function renderTable() {
      const filtered = cases.filter(c => {
        const title = c.title || c.caseObj?.meta?.title || '';
        const setting = c.caseObj?.meta?.setting || '';
        const diagnosis = c.caseObj?.meta?.diagnosis || '';
        const acuity = c.caseObj?.meta?.acuity || '';
        return `${title} ${setting} ${diagnosis} ${acuity}`.toLowerCase().includes(searchTerm);
      });

      const table = el('table', {class:'table cases-table'}, [
        el('thead', {}, el('tr', {}, [
          el('th', {}, 'Case Title'),
          el('th', {}, 'Setting'),
          el('th', {}, 'Diagnosis'),
          el('th', {}, 'Draft Status'),
          el('th', {}, ''),
        ])),
        el('tbody', {}, filtered.map(c => {
        const draftInfo = drafts[c.id];
        const evalDraft = draftInfo?.eval;
        
        let statusContent;
        if (evalDraft && evalDraft.hasContent) {
          const isComplete = evalDraft.completionPercent === 100;
          const statusText = isComplete ? 'Complete' : 'In-Progress';
          const statusClass = isComplete ? 'status--complete' : 'status--in-progress';
          statusContent = el('span', { class: `status ${statusClass}` }, statusText);
        } else {
          statusContent = el('span', { class: 'status status--not-started' }, 'Not Started');
        }
        
  const buttonText = evalDraft && evalDraft.hasContent ? 'Continue Working' : 'Start Case';
  const buttonClass = 'btn primary small';
        
        // Create action buttons
        const actionButtons = [
          el('button', {
            class: buttonClass,
            onClick: () => navigate(`#/student/editor?case=${c.id}&v=0&encounter=eval`)
          }, buttonText)
        ];

        // Add Reset for faculty-created case drafts and Remove for student blank notes
        const isBlankNote = String(c.id || '').startsWith('blank');
        const localStorageKey = `draft_${c.id}_eval`;
        if (isBlankNote) {
          actionButtons.push(' ');
          actionButtons.push(el('button', {
            class: 'btn subtle-danger small',
            title: 'Delete this blank note',
            onClick: () => {
              if (confirm('Delete this blank SOAP note? This cannot be undone.')) {
                localStorage.removeItem(localStorageKey);
                // Also remove from listing cache by reloading route
                navigate('#/student/cases');
              }
            }
          }, 'Remove'));
        } else {
          actionButtons.push(' ');
          actionButtons.push(el('button', {
            class: 'btn subtle-danger small',
            title: 'Reset your draft work for this case',
            onClick: () => {
              if (confirm('Reset your draft for this case? This will clear your local work.')) {
                localStorage.removeItem(localStorageKey);
                navigate('#/student/cases');
              }
            }
          }, 'Reset'));
        }
        
        // Add download button if case is 100% complete
        if (evalDraft && evalDraft.completionPercent === 100) {
          actionButtons.push(' ');
          actionButtons.push(
            el('button', {
              class: 'btn success small',
              onClick: async () => {
                try {
                  // Load the draft data for Word export
                  const draftKey = `draft_${c.id}_eval`;
                  const savedDraft = localStorage.getItem(draftKey);
                  if (!savedDraft) {
                    alert('Could not find draft data for export.');
                    return;
                  }
                  
                  const draft = JSON.parse(savedDraft);
                  const currentDate = new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  });
                  
                  // Generate Word document content
                  // Use inline fallback styles (export-doc.css removed)
                  const exportStyles = `body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.5;margin:0;padding:0;color:#000;text-align:left}h1{font-size:14pt;font-weight:bold;text-align:center;margin:0 0 18pt 0;text-decoration:underline}h2{font-size:13pt;font-weight:bold;margin:18pt 0 8pt 0;color:#2c5aa0;border-bottom:1px solid #ccc;padding-bottom:3pt}h3{font-size:12pt;font-weight:bold;margin:12pt 0 6pt 0;color:#444}p{margin:0 0 8pt 0}.section{margin-bottom:20pt;page-break-inside:avoid}table{border-collapse:collapse;width:100%;font-size:10pt}th,td{border:1px solid #000;padding:4pt 8pt}th{font-weight:bold;background-color:#f5f5f5}.signature-line{border-bottom:1px solid #000;width:300pt;margin:24pt 0 6pt 0}.footer{margin-top:36pt;font-size:9pt;color:#666;text-align:center;border-top:1px solid #ccc;padding-top:12pt}`;
          let content = `
                    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
                    <head>
                      <meta charset="utf-8">
                      <meta name="ProgId" content="Word.Document">
                      <meta name="Generator" content="Microsoft Word">
                      <meta name="Originator" content="Microsoft Word">
            <style> ${exportStyles} </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="clinic-name">Physical Therapy Clinic</div>
                        <div class="clinic-info">Student Clinical Documentation | Academic Exercise</div>
                      </div>
                      
                      <div class="patient-info">
                        <div class="info-row">
                          <span class="info-label">Case:</span>
                          <span>${c.title}</span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Encounter Type:</span>
                          <span>EVAL</span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Date of Service:</span>
                          <span>${currentDate}</span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Student:</span>
                          <span>_________________________________</span>
                        </div>
                      </div>
                      
                      <h1>PHYSICAL THERAPY EVAL NOTE</h1>
                      
                      <div class="section">
                        <h2>SUBJECTIVE</h2>
                        <p>${(() => {
                          if (!draft.subjective || typeof draft.subjective === 'string') {
                            return (draft.subjective || 'Patient subjective findings not documented at this time.').replace(/\n/g, '<br>');
                          }
                          
                          // Handle object structure
                          const subjectiveContent = [];
                          if (draft.subjective.chiefComplaint) {
                            subjectiveContent.push(`<strong>Chief Concern:</strong> ${draft.subjective.chiefComplaint}`);
                          }
                          if (draft.subjective.historyOfPresentIllness) {
                            subjectiveContent.push(`<strong>History of Present Illness:</strong> ${draft.subjective.historyOfPresentIllness}`);
                          }
                          if (draft.subjective.painLocation) {
                            subjectiveContent.push(`<strong>Pain Location:</strong> ${draft.subjective.painLocation}`);
                          }
                          if (draft.subjective.painScale) {
                            subjectiveContent.push(`<strong>Pain Scale:</strong> ${draft.subjective.painScale}/10`);
                          }
                          if (draft.subjective.painQuality) {
                            subjectiveContent.push(`<strong>Pain Quality:</strong> ${draft.subjective.painQuality}`);
                          }
                          if (draft.subjective.aggravatingFactors) {
                            subjectiveContent.push(`<strong>Aggravating Factors:</strong> ${draft.subjective.aggravatingFactors}`);
                          }
                          if (draft.subjective.easingFactors) {
                            subjectiveContent.push(`<strong>Easing Factors:</strong> ${draft.subjective.easingFactors}`);
                          }
                          if (draft.subjective.functionalLimitations) {
                            subjectiveContent.push(`<strong>Functional Limitations:</strong> ${draft.subjective.functionalLimitations}`);
                          }
                          if (draft.subjective.priorLevel) {
                            subjectiveContent.push(`<strong>Prior Level of Function:</strong> ${draft.subjective.priorLevel}`);
                          }
                          if (draft.subjective.patientGoals) {
                            subjectiveContent.push(`<strong>Patient Goals:</strong> ${draft.subjective.patientGoals}`);
                          }
                          if (draft.subjective.medicationsCurrent) {
                            subjectiveContent.push(`<strong>Current Medications:</strong> ${draft.subjective.medicationsCurrent}`);
                          }
                          if (draft.subjective.redFlags) {
                            subjectiveContent.push(`<strong>Red Flags/Screening:</strong> ${draft.subjective.redFlags}`);
                          }
                          if (draft.subjective.additionalHistory) {
                            subjectiveContent.push(`<strong>Additional History:</strong> ${draft.subjective.additionalHistory}`);
                          }
                          
                          return subjectiveContent.length > 0 ? subjectiveContent.join('<br><br>') : 'Patient subjective findings not documented at this time.';
                        })()}</p>
                      </div>
                      
                      <div class="section">
                        <h2>OBJECTIVE</h2>
                        
                        <h3>Observations & Vital Signs</h3>
                        <p>${(draft.objective?.text || 'Clinical observations not documented at this time.').replace(/\n/g, '<br>')}</p>
                  `;
                  
                  // Add ROM table if present
                  if (draft.objective?.rom && Object.keys(draft.objective.rom).length > 0) {
                    content += `
                      <h3>Range of Motion Assessment</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>Joint/Movement</th>
                            <th>AROM (°)</th>
                            <th>PROM (°)</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                    `;
                    Object.entries(draft.objective.rom).forEach(([joint, movements]) => {
                      Object.entries(movements).forEach(([movement, values]) => {
                        content += `
                          <tr>
                            <td>${joint} ${movement}</td>
                            <td>${values.arom || '-'}</td>
                            <td>${values.prom || '-'}</td>
                            <td>${values.notes || ''}</td>
                          </tr>
                        `;
                      });
                    });
                    content += `</tbody></table>`;
                  }
                  
                  // Add MMT table if present
                  if (draft.objective?.mmt?.rows?.length > 0) {
                    content += `
                      <h3>Manual Muscle Testing</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>Muscle Group</th>
                            <th>Side</th>
                            <th>Grade (0-5)</th>
                            <th>Comments</th>
                          </tr>
                        </thead>
                        <tbody>
                    `;
                    draft.objective.mmt.rows.forEach(r => {
                      content += `
                        <tr>
                          <td>${r.muscle}</td>
                          <td>${r.side}</td>
                          <td>${r.grade || '-'}</td>
                          <td></td>
                        </tr>
                      `;
                    });
                    content += `</tbody></table>`;
                  }
                  
                  content += `</div>`;
                  
                  // Add remaining sections
                  const sections = [
                    { 
                      name: 'ASSESSMENT', 
                      content: draft.assessment,
                      placeholder: 'Clinical assessment and diagnostic reasoning not documented at this time.'
                    },
                    { 
                      name: 'GOALS', 
                      content: draft.goals,
                      placeholder: 'Treatment goals not established at this time.'
                    },
                    { 
                      name: 'PLAN', 
                      content: draft.plan,
                      placeholder: 'Treatment plan not documented at this time.'
                    },
                    { 
                      name: 'BILLING & CODING', 
                      content: draft.billing,
                      placeholder: 'Billing codes not documented.'
                    }
                  ];
                  
                  sections.forEach(section => {
                    let contentText = section.content;
                    
                    // Handle assessment object structure
                    if (section.name === 'ASSESSMENT' && section.content && typeof section.content === 'object') {
                      const assessmentContent = [];
                      if (section.content.primaryImpairments) {
                        assessmentContent.push(`<strong>Primary Impairments:</strong> ${section.content.primaryImpairments}`);
                      }
                      if (section.content.bodyFunctions) {
                        assessmentContent.push(`<strong>Body Functions & Structures:</strong> ${section.content.bodyFunctions}`);
                      }
                      if (section.content.activityLimitations) {
                        assessmentContent.push(`<strong>Activity Limitations:</strong> ${section.content.activityLimitations}`);
                      }
                      if (section.content.participationRestrictions) {
                        assessmentContent.push(`<strong>Participation Restrictions:</strong> ${section.content.participationRestrictions}`);
                      }
                      if (section.content.ptDiagnosis) {
                        assessmentContent.push(`<strong>PT Diagnosis:</strong> ${section.content.ptDiagnosis}`);
                      }
                      if (section.content.clinicalReasoning) {
                        assessmentContent.push(`<strong>Clinical Reasoning:</strong> ${section.content.clinicalReasoning}`);
                      }
                      contentText = assessmentContent.length > 0 ? assessmentContent.join('<br><br>') : null;
                    }
                    
                    content += `
                      <div class="section">
                        <h2>${section.name}</h2>
                        <p>${(contentText || section.placeholder).replace(/\n/g, '<br>')}</p>
                      </div>
                    `;
                  });
                  
                  // Add signature section
                  content += `
                    <div class="signature-section">
                      <div class="info-row">
                        <span class="info-label">Student Signature:</span>
                        <span class="signature-line"></span>
                        <span style="margin-left: 12pt;">Date: ___________</span>
                      </div>
                      <br>
                      <div class="info-row">
                        <span class="info-label">Clinical Instructor:</span>
                        <span class="signature-line"></span>
                        <span style="margin-left: 12pt;">Date: ___________</span>
                      </div>
                    </div>
                    
                    <div class="footer">
                      <p><strong>CONFIDENTIAL PATIENT INFORMATION</strong></p>
                      <p>This document contains confidential patient information protected by HIPAA and FERPA regulations.</p>
                      <p>Generated by PT-EMR Simulation System | Academic Use Only</p>
                    </div>
                    
                    </body></html>
                  `;
                  
                  // Create and download the document
                  const blob = new Blob([content], {
                    type: 'application/msword'
                  });
                  
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${c.title.replace(/[^a-zA-Z0-9]/g, '_')}_eval_SOAP_Note_${new Date().toISOString().split('T')[0]}.doc`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  

                } catch (error) {
                  console.error('Document generation failed:', error);
                  alert('Document generation failed. Please check the console for details.');
                }
              }
            }, 'Download Word Doc')
          );
        }
        
        return el('tr', {}, [
          el('td', {}, c.title || 'Untitled Case'),
          el('td', {}, c.caseObj?.meta?.setting || 'Not specified'),
          el('td', {}, c.caseObj?.meta?.diagnosis || 'Not specified'),
          el('td', {}, statusContent),
          el('td', {}, actionButtons)
        ]);
        }))
      ]);
      // Render
    const existing = casesPanel.querySelector('.table-responsive'); 
    if (existing) existing.remove(); 
    const wrapper = el('div', { class: 'table-responsive' }, table); 
    casesPanel.append(wrapper); 
    }

    // Initial render
    renderTable();

    // Show list of your blank notes with remove buttons and a Create button
    try {
      const blankItems = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('draft_blank')) {
          try {
            const raw = localStorage.getItem(key);
            const data = raw ? JSON.parse(raw) : {};
            const ts = data && data.__savedAt ? data.__savedAt : null;
            const title = (data && data.noteTitle && data.noteTitle.trim()) || key.replace('draft_', '').replace('_eval','');
            blankItems.push({ key, title, ts: ts || 0 });
          } catch {}
        }
      }

      // Sort newest first
      blankItems.sort((a, b) => (b.ts - a.ts) || a.title.localeCompare(b.title));

      const headerRow = el('div', { class: 'flex-between', style: 'align-items:center; gap:12px; margin-bottom: 8px;' }, [
        el('h3', { style: 'margin: 0;' }, 'My Blank Notes'),
        el('div', {}, [
          el('button', {
            class: 'btn primary',
            title: 'Create a blank SOAP note not attached to a case',
            onClick: () => openCreateNoteModal()
          }, 'Create SOAP Note')
        ])
      ]);

      const panelChildren = [
        headerRow,
        el('p', { class: 'small', style: 'margin-top:0;' }, 'Manage scratch SOAP notes not tied to a case.')
      ];

      if (blankItems.length > 0) {
        const list = el('ul', { style: 'margin: 8px 0 0 0; padding-left: 18px;' });
        blankItems.forEach(({ key, title }) => {
          const noteId = key.replace('draft_', '').replace('_eval','');
          const li = el('li', { style: 'margin-bottom: 6px;' }, [
            el('span', { style: 'margin-right: 12px; font-weight: 500;' }, title),
            el('button', {
              class: 'btn primary small',
              style: 'margin-right: 6px;',
              onClick: () => navigate(`#/student/editor?case=${noteId}&v=0&encounter=eval`)
            }, 'Open'),
            el('button', {
              class: 'btn subtle-danger small',
              onClick: () => { if (confirm('Delete this blank note?')) { localStorage.removeItem(key); navigate('#/student/cases'); } }
            }, 'Remove')
          ]);
          list.append(li);
        });
        panelChildren.push(list);
      } else {
        panelChildren.push(el('p', { class: 'small', style: 'color: var(--text-muted); margin-top: 8px;' }, 'No blank notes yet. Create one to get started.'));
      }

      app.append(el('div', { class: 'panel' }, panelChildren));
    } catch {}

  } catch (error) {
    console.error("Failed to render student cases:", error);
    app.append(el('div', {class: 'panel error'}, 'Error loading cases. Please check the console for details.'));
  }
});
