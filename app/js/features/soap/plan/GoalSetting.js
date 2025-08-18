// GoalSetting.js - SMART Goals and Functional Outcomes
// Evidence-based goal setting with measurable outcomes

import { el } from '../../../ui/utils.js';
import { createEditableTable } from '../objective/EditableTable.js';

/**
 * Goal Setting Component - SMART goals for PT outcomes
 */
export const GoalSetting = {
  /**
   * Creates goal setting section with SMART goal framework
   * @param {Object} data - Current plan data
   * @param {Function} updateField - Function to update field values
   * @returns {HTMLElement} Goal setting section
   */
  create(data, updateField) {
    const section = el('div', { 
      id: 'goal-setting',
      class: 'section-anchor goal-setting-subsection' 
    });
    
  section.append(el('h4', { class: 'subsection-title' }, 'SMART Goals & Outcomes'));

        // Backward-compatibility migration: collapse short/long-term into simple goalsTable
        const migrateOldGoals = () => {
          const hasNew = data.goalsTable && Object.keys(data.goalsTable).length > 0;
          const hasOld = (data.shortTermGoalsTable && Object.keys(data.shortTermGoalsTable).length > 0) ||
                         (data.longTermGoalsTable && Object.keys(data.longTermGoalsTable).length > 0);
          if (hasNew || !hasOld) return;
          const collect = (tbl) => {
            const arr = [];
            if (!tbl) return arr;
            Object.values(tbl).forEach(row => {
              if (!row) return;
              const parts = [];
              if (row.goal) parts.push(String(row.goal));
              if (row.measure) parts.push('— ' + String(row.measure));
              const tf = row.timeframe || row.timeFrame;
              if (tf) parts.push('(' + String(tf) + ')');
              if (row.status) parts.push('[' + String(row.status) + ']');
              const text = parts.join(' ').trim();
              if (text) arr.push(text);
            });
            return arr;
          };
          const merged = [
            ...collect(data.shortTermGoalsTable),
            ...collect(data.longTermGoalsTable)
          ];
          if (merged.length) {
            const newData = {};
            merged.forEach(text => {
              const id = Date.now().toString(36) + Math.random().toString(36).slice(2,7);
              newData[id] = { goalText: text };
            });
            updateField('goalsTable', newData);
          }
        };

        migrateOldGoals();

        // Single simple goals table: one text column + remove button, compact footer add, starter row
        const goalsTable = createEditableTable({
          title: '',
          columns: [
            { field: 'goalText', label: 'Goal', width: '100%', type: 'textarea', rows: 1, placeholder: 'Describe a clear, concise goal...' }
          ],
          data: data.goalsTable || {},
          onChange: (newData) => updateField('goalsTable', newData),
          addButtonText: '+ Add Goal',
          compactAddButton: true,
          startWithOneRow: true,
          showHeader: false,
          className: 'goals-table simple-goals'
        });

        section.append(goalsTable.element);

    return section;
  }
};
