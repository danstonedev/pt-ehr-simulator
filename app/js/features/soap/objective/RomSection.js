/**
 * ROM Section Module
 * Range of Motion assessment component
 */
import { el } from '../../../ui/utils.js';
import { createBilateralTable } from './EditableTable.js';

/**
 * Creates a Range of Motion assessment section
 * @param {string} regionKey - Region identifier
 * @param {object} region - Region configuration data
 * @param {object} romData - Current ROM data
 * @param {function} onChange - Change handler
 */
export function createRomSection(regionKey, region, romData, onChange) {
  const container = el('div', {
    class: 'assessment-section rom-section',
    style: 'margin-bottom: 24px;',
  });

  const table = createBilateralTable({
    title: 'Active Range of Motion (AROM)',
    items: region.rom,
    data: romData,
    onChange,
    valueType: 'text',
    normalValues: true,
    embedNormalInName: true,
    notesColumn: true,
    nameColumnLabel: 'Active Range of Motion (AROM)',
    showTitle: false,
  });

  container.appendChild(table.element);

  return {
    element: container,
    rebuild: table.rebuild,
    getData: () => romData,
    updateData: onChange,
  };
}

/**
 * Standard ROM normal values reference
 */
export const romNormals = {
  // Spine
  'cervical-flexion': '45-50°',
  'cervical-extension': '45-75°',
  'cervical-lateral-flexion': '45°',
  'cervical-rotation': '60-80°',
  'lumbar-flexion': '40-60°',
  'lumbar-extension': '20-35°',
  'lumbar-lateral-flexion': '15-20°',
  'lumbar-rotation': '3-18°',

  // Shoulder
  'shoulder-flexion': '180°',
  'shoulder-extension': '60°',
  'shoulder-abduction': '180°',
  'shoulder-adduction': '30°',
  'shoulder-internal-rotation': '70°',
  'shoulder-external-rotation': '90°',

  // Elbow
  'elbow-flexion': '145°',
  'elbow-extension': '0°',
  'forearm-pronation': '80°',
  'forearm-supination': '80°',

  // Wrist
  'wrist-flexion': '80°',
  'wrist-extension': '70°',
  'wrist-radial-deviation': '20°',
  'wrist-ulnar-deviation': '35°',

  // Hip
  'hip-flexion': '120°',
  'hip-extension': '30°',
  'hip-abduction': '45°',
  'hip-adduction': '30°',
  'hip-internal-rotation': '45°',
  'hip-external-rotation': '45°',

  // Knee
  'knee-flexion': '135°',
  'knee-extension': '0°',

  // Ankle
  'ankle-dorsiflexion': '20°',
  'ankle-plantarflexion': '50°',
  'ankle-inversion': '35°',
  'ankle-eversion': '15°',
};

/**
 * Helper function to get normal ROM value by movement
 */
export function getRomNormal(movement, region = '') {
  const key = `${region}-${movement}`.toLowerCase().replace(/\s+/g, '-');
  return romNormals[key] || 'Variable';
}
