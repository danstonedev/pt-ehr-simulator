/**
 * Special Tests Section Module
 * Special/Orthopedic tests assessment component
 */
import { el } from '../../../ui/utils.js';
import { createEditableTable } from './EditableTable.js';

/**
 * Creates a Special Tests assessment section
 * @param {string} regionKey - Region identifier
 * @param {object} region - Region configuration data
 * @param {object} testData - Current test data
 * @param {function} onChange - Change handler
 */
export function createSpecialTestsSection(regionKey, region, testData, onChange) {
  const container = el('div', {
    class: 'assessment-section special-tests-section',
    style: 'margin-bottom: 24px;'
  });

  const testResults = [
    { value: '', label: 'Not performed' },
    { value: 'positive', label: 'Positive' },
    { value: 'negative', label: 'Negative' },
    { value: 'inconclusive', label: 'Inconclusive' },
    { value: 'unable', label: 'Unable to perform' }
  ];

  // Convert region special tests to table format
  const tableData = {};
  if (region.specialTests) {
    region.specialTests.forEach((test, index) => {
      const testId = `test-${index}`;
      tableData[testId] = {
        name: test.name,
        purpose: test.purpose,
        result: testData[testId]?.result || '',
        notes: testData[testId]?.notes || ''
      };
    });
  }

  const table = createEditableTable({
  title: 'Special Tests',
    columns: [
      { field: 'name', label: 'Test Name', width: '25%' },
      { field: 'purpose', label: 'Purpose/Target', width: '30%' },
      { field: 'result', label: 'Result', width: '15%', type: 'select', options: testResults },
      { field: 'notes', label: 'Notes/Details', width: '30%' }
    ],
    data: tableData,
    onChange: (newData) => {
      // Convert back to original format
      const updatedData = {};
      Object.keys(newData).forEach(testId => {
        updatedData[testId] = {
          result: newData[testId].result,
          notes: newData[testId].notes
        };
      });
      onChange(updatedData);
  },
  showAddButton: false,
  actionsHeaderLabel: '',
    className: 'special-tests-table'
  });

  container.appendChild(table.element);

  // Removed test interpretation reference per requirements

  return {
    element: container,
    rebuild: table.rebuild,
    getData: () => testData,
    updateData: onChange
  };
}

/**
 * Common special tests by region
 */
export const specialTestsByRegion = {
  'cervical-spine': [
    { name: 'Spurling Test', purpose: 'Cervical radiculopathy' },
    { name: 'Upper Limb Tension Test', purpose: 'Neural tension' },
    { name: 'Cervical Distraction Test', purpose: 'Cervical radiculopathy' },
    { name: 'Vertebral Artery Test', purpose: 'Vertebrobasilar insufficiency' },
    { name: 'Sharp-Purser Test', purpose: 'Atlantoaxial instability' }
  ],

  'lumbar-spine': [
    { name: 'Straight Leg Raise (SLR)', purpose: 'Neural tension/disc pathology' },
    { name: 'Slump Test', purpose: 'Neural tension' },
    { name: 'Prone Instability Test', purpose: 'Lumbar instability' },
    { name: 'Centralization Phenomena', purpose: 'Directional preference' },
    { name: 'FABERE/Patrick Test', purpose: 'Hip/SI joint pathology' },
    { name: 'Posterior Shear Test', purpose: 'SI joint dysfunction' }
  ],

  'shoulder': [
    { name: 'Neer Impingement Sign', purpose: 'Subacromial impingement' },
    { name: 'Hawkins-Kennedy Test', purpose: 'Subacromial impingement' },
    { name: 'Empty Can Test', purpose: 'Supraspinatus pathology' },
    { name: 'External Rotation Lag Sign', purpose: 'Infraspinatus/teres minor pathology' },
    { name: 'Apprehension Test', purpose: 'Anterior shoulder instability' },
    { name: 'Load and Shift Test', purpose: 'Glenohumeral instability' }
  ],

  'knee': [
    { name: 'Lachman Test', purpose: 'ACL integrity' },
    { name: 'Anterior Drawer Test', purpose: 'ACL integrity' },
    { name: 'Posterior Drawer Test', purpose: 'PCL integrity' },
    { name: 'McMurray Test', purpose: 'Meniscal tear' },
    { name: 'Valgus Stress Test', purpose: 'MCL integrity' },
    { name: 'Varus Stress Test', purpose: 'LCL integrity' },
    { name: 'Patellar Apprehension Test', purpose: 'Patellar instability' }
  ],

  'ankle': [
    { name: 'Anterior Drawer Test', purpose: 'ATFL integrity' },
    { name: 'Talar Tilt Test', purpose: 'CFL integrity' },
    { name: 'Thompson Test', purpose: 'Achilles tendon rupture' },
    { name: 'Kleiger Test', purpose: 'Deltoid ligament/syndesmosis' },
    { name: 'Squeeze Test', purpose: 'Syndesmosis injury' }
  ]
};

/**
 * Helper function to get special tests by region
 */
export function getSpecialTests(region) {
  return specialTestsByRegion[region] || [];
}
