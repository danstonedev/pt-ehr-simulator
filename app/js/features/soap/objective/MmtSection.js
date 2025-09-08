/**
 * MMT Section Module
 * Manual Muscle Testing assessment component
 */
import { el } from '../../../ui/utils.js';
import { createBilateralTable } from './EditableTable.js';

/**
 * Creates a Manual Muscle Testing assessment section
 * @param {string} regionKey - Region identifier
 * @param {object} region - Region configuration data
 * @param {object} mmtData - Current MMT data
 * @param {function} onChange - Change handler
 */
export function createMmtSection(regionKey, region, mmtData, onChange) {
  const container = el('div', {
    class: 'assessment-section mmt-section',
    style: 'margin-bottom: 24px;',
  });

  const mmtGrades = [
    { value: '0/5', label: '0/5 - No contraction' },
    { value: '1/5', label: '1/5 - Trace contraction' },
    { value: '2/5', label: '2/5 - Full ROM gravity eliminated' },
    { value: '3/5', label: '3/5 - Full ROM against gravity' },
    { value: '4-/5', label: '4-/5 - Less than normal resistance' },
    { value: '4/5', label: '4/5 - Moderate resistance' },
    { value: '4+/5', label: '4+/5 - Nearly normal resistance' },
    { value: '5/5', label: '5/5 - Normal strength' },
  ];

  const table = createBilateralTable({
    title: 'Manual Muscle Testing',
    items: region.mmt,
    data: mmtData,
    onChange,
    valueType: 'select',
    options: mmtGrades,
    normalValues: false, // remove Normal column entirely
    // Notes column removed per latest requirements
    notesColumn: false,
    nameColumnLabel: 'Manual Muscle Testing', // use green title as first column header
    showTitle: false, // hide green band title
    // notesWidth no longer needed
  });

  container.appendChild(table.element);

  return {
    element: container,
    rebuild: table.rebuild,
    getData: () => mmtData,
    updateData: onChange,
  };
}

/**
 * Standard MMT muscle groups by region
 */
export const mmtMuscleGroups = {
  'cervical-spine': [
    { muscle: 'Neck Flexors', side: '', normal: '5/5' },
    { muscle: 'Neck Extensors', side: '', normal: '5/5' },
    { muscle: 'Upper Trap', side: 'R', normal: '5/5' },
    { muscle: 'Upper Trap', side: 'L', normal: '5/5' },
    { muscle: 'Levator Scapulae', side: 'R', normal: '5/5' },
    { muscle: 'Levator Scapulae', side: 'L', normal: '5/5' },
  ],

  'lumbar-spine': [
    { muscle: 'Hip Flexors', side: 'R', normal: '5/5' },
    { muscle: 'Hip Flexors', side: 'L', normal: '5/5' },
    { muscle: 'Quadriceps', side: 'R', normal: '5/5' },
    { muscle: 'Quadriceps', side: 'L', normal: '5/5' },
    { muscle: 'Hamstrings', side: 'R', normal: '5/5' },
    { muscle: 'Hamstrings', side: 'L', normal: '5/5' },
    { muscle: 'Glut Max', side: 'R', normal: '5/5' },
    { muscle: 'Glut Max', side: 'L', normal: '5/5' },
    { muscle: 'Glut Med', side: 'R', normal: '5/5' },
    { muscle: 'Glut Med', side: 'L', normal: '5/5' },
  ],

  shoulder: [
    { muscle: 'Deltoid Anterior', side: 'R', normal: '5/5' },
    { muscle: 'Deltoid Anterior', side: 'L', normal: '5/5' },
    { muscle: 'Deltoid Middle', side: 'R', normal: '5/5' },
    { muscle: 'Deltoid Middle', side: 'L', normal: '5/5' },
    { muscle: 'Deltoid Posterior', side: 'R', normal: '5/5' },
    { muscle: 'Deltoid Posterior', side: 'L', normal: '5/5' },
    { muscle: 'Rotator Cuff', side: 'R', normal: '5/5' },
    { muscle: 'Rotator Cuff', side: 'L', normal: '5/5' },
  ],

  knee: [
    { muscle: 'Quadriceps', side: 'R', normal: '5/5' },
    { muscle: 'Quadriceps', side: 'L', normal: '5/5' },
    { muscle: 'Hamstrings', side: 'R', normal: '5/5' },
    { muscle: 'Hamstrings', side: 'L', normal: '5/5' },
  ],
};

/**
 * Helper function to get MMT muscle groups by region
 */
export function getMmtMuscles(region) {
  return mmtMuscleGroups[region] || [];
}
