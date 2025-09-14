/**
 * Regional Assessments Module
 * Unified module for streamlined ROM, MMT, and Special Tests assessment
 */
import { el } from '../../../ui/utils.js';
import { createRomSection } from './RomSection.js';
import { createMmtSection } from './MmtSection.js';
import { createSpecialTestsSection } from './SpecialTestsSection.js';
import { createEditableTable } from './EditableTable.js';

/**
 * Regional assessment data - consolidated and standardized
 */
export const regionalAssessments = {
  'lumbar-spine': {
    name: 'Lumbar Spine',
    rom: [
      { joint: 'Lumbar Flexion', normal: '40-60°', side: '' },
      { joint: 'Lumbar Extension', normal: '20-35°', side: '' },
      { joint: 'Lateral Flexion', normal: '15-20°', side: 'R' },
      { joint: 'Lateral Flexion', normal: '15-20°', side: 'L' },
      { joint: 'Rotation', normal: '3-18°', side: 'R' },
      { joint: 'Rotation', normal: '3-18°', side: 'L' },
    ],
    mmt: [
      { muscle: 'Hip Flexors', side: 'R', normal: '5/5' },
      { muscle: 'Hip Flexors', side: 'L', normal: '5/5' },
      { muscle: 'Quadriceps', side: 'R', normal: '5/5' },
      { muscle: 'Quadriceps', side: 'L', normal: '5/5' },
      { muscle: 'Hamstrings', side: 'R', normal: '5/5' },
      { muscle: 'Hamstrings', side: 'L', normal: '5/5' },
      { muscle: 'Glut Max', side: 'R', normal: '5/5' },
      { muscle: 'Glut Max', side: 'L', normal: '5/5' },
    ],
    specialTests: [
      { name: 'Straight Leg Raise (SLR)', purpose: 'Neural tension/disc pathology' },
      { name: 'Slump Test', purpose: 'Neural tension' },
      { name: 'Prone Instability Test', purpose: 'Lumbar instability' },
      { name: 'Centralization Phenomena', purpose: 'Directional preference' },
      { name: 'FABERE/Patrick Test', purpose: 'Hip/SI joint pathology' },
    ],
  },

  'cervical-spine': {
    name: 'Cervical Spine',
    rom: [
      { joint: 'Cervical Flexion', normal: '45-50°', side: '' },
      { joint: 'Cervical Extension', normal: '45-75°', side: '' },
      { joint: 'Lateral Flexion', normal: '45°', side: 'R' },
      { joint: 'Lateral Flexion', normal: '45°', side: 'L' },
      { joint: 'Rotation', normal: '60-80°', side: 'R' },
      { joint: 'Rotation', normal: '60-80°', side: 'L' },
    ],
    mmt: [
      { muscle: 'Neck Flexors', side: '', normal: '5/5' },
      { muscle: 'Neck Extensors', side: '', normal: '5/5' },
      { muscle: 'Upper Trap', side: 'R', normal: '5/5' },
      { muscle: 'Upper Trap', side: 'L', normal: '5/5' },
      { muscle: 'Levator Scapulae', side: 'R', normal: '5/5' },
      { muscle: 'Levator Scapulae', side: 'L', normal: '5/5' },
    ],
    specialTests: [
      { name: 'Spurling Test', purpose: 'Cervical radiculopathy' },
      { name: 'Upper Limb Tension Test', purpose: 'Neural tension' },
      { name: 'Cervical Distraction Test', purpose: 'Cervical radiculopathy' },
      { name: 'Vertebral Artery Test', purpose: 'Vertebrobasilar insufficiency' },
    ],
  },

  shoulder: {
    name: 'Shoulder',
    rom: [
      { joint: 'Shoulder Flexion', normal: '180°', side: 'R' },
      { joint: 'Shoulder Flexion', normal: '180°', side: 'L' },
      { joint: 'Shoulder Extension', normal: '60°', side: 'R' },
      { joint: 'Shoulder Extension', normal: '60°', side: 'L' },
      { joint: 'Shoulder Abduction', normal: '180°', side: 'R' },
      { joint: 'Shoulder Abduction', normal: '180°', side: 'L' },
      { joint: 'Internal Rotation', normal: '70°', side: 'R' },
      { joint: 'Internal Rotation', normal: '70°', side: 'L' },
      { joint: 'External Rotation', normal: '90°', side: 'R' },
      { joint: 'External Rotation', normal: '90°', side: 'L' },
    ],
    mmt: [
      { muscle: 'Deltoid Anterior', side: 'R', normal: '5/5' },
      { muscle: 'Deltoid Anterior', side: 'L', normal: '5/5' },
      { muscle: 'Deltoid Middle', side: 'R', normal: '5/5' },
      { muscle: 'Deltoid Middle', side: 'L', normal: '5/5' },
      { muscle: 'Deltoid Posterior', side: 'R', normal: '5/5' },
      { muscle: 'Deltoid Posterior', side: 'L', normal: '5/5' },
      { muscle: 'Rotator Cuff', side: 'R', normal: '5/5' },
      { muscle: 'Rotator Cuff', side: 'L', normal: '5/5' },
    ],
    specialTests: [
      { name: 'Neer Impingement Sign', purpose: 'Subacromial impingement' },
      { name: 'Hawkins-Kennedy Test', purpose: 'Subacromial impingement' },
      { name: 'Empty Can Test', purpose: 'Supraspinatus pathology' },
      { name: 'Apprehension Test', purpose: 'Anterior shoulder instability' },
    ],
  },

  knee: {
    name: 'Knee',
    rom: [
      { joint: 'Knee Flexion', normal: '135°', side: 'R' },
      { joint: 'Knee Flexion', normal: '135°', side: 'L' },
      { joint: 'Knee Extension', normal: '0°', side: 'R' },
      { joint: 'Knee Extension', normal: '0°', side: 'L' },
    ],
    mmt: [
      { muscle: 'Quadriceps', side: 'R', normal: '5/5' },
      { muscle: 'Quadriceps', side: 'L', normal: '5/5' },
      { muscle: 'Hamstrings', side: 'R', normal: '5/5' },
      { muscle: 'Hamstrings', side: 'L', normal: '5/5' },
    ],
    specialTests: [
      { name: 'Lachman Test', purpose: 'ACL integrity' },
      { name: 'Anterior Drawer Test', purpose: 'ACL integrity' },
      { name: 'Posterior Drawer Test', purpose: 'PCL integrity' },
      { name: 'McMurray Test', purpose: 'Meniscal tear' },
      { name: 'Valgus Stress Test', purpose: 'MCL integrity' },
      { name: 'Varus Stress Test', purpose: 'LCL integrity' },
    ],
  },

  // Added regions
  hip: {
    name: 'Hip',
    rom: [
      { joint: 'Hip Flexion', normal: '120°', side: 'R' },
      { joint: 'Hip Flexion', normal: '120°', side: 'L' },
      { joint: 'Hip Extension', normal: '30°', side: 'R' },
      { joint: 'Hip Extension', normal: '30°', side: 'L' },
      { joint: 'Hip Abduction', normal: '45°', side: 'R' },
      { joint: 'Hip Abduction', normal: '45°', side: 'L' },
      { joint: 'Hip Adduction', normal: '30°', side: 'R' },
      { joint: 'Hip Adduction', normal: '30°', side: 'L' },
      { joint: 'Hip Internal Rotation', normal: '45°', side: 'R' },
      { joint: 'Hip Internal Rotation', normal: '45°', side: 'L' },
      { joint: 'Hip External Rotation', normal: '45°', side: 'R' },
      { joint: 'Hip External Rotation', normal: '45°', side: 'L' },
    ],
    mmt: [
      { muscle: 'Hip Flexors', side: 'R', normal: '5/5' },
      { muscle: 'Hip Flexors', side: 'L', normal: '5/5' },
      { muscle: 'Glut Max (Hip Extensors)', side: 'R', normal: '5/5' },
      { muscle: 'Glut Max (Hip Extensors)', side: 'L', normal: '5/5' },
      { muscle: 'Glut Med (Abductors)', side: 'R', normal: '5/5' },
      { muscle: 'Glut Med (Abductors)', side: 'L', normal: '5/5' },
      { muscle: 'Hip Adductors', side: 'R', normal: '5/5' },
      { muscle: 'Hip Adductors', side: 'L', normal: '5/5' },
      { muscle: 'Hip Internal Rotators', side: 'R', normal: '5/5' },
      { muscle: 'Hip Internal Rotators', side: 'L', normal: '5/5' },
      { muscle: 'Hip External Rotators', side: 'R', normal: '5/5' },
      { muscle: 'Hip External Rotators', side: 'L', normal: '5/5' },
    ],
    specialTests: [
      { name: 'FABER (Patrick)', purpose: 'Hip/SI joint pathology' },
      { name: 'FADIR', purpose: 'Femoroacetabular impingement' },
      { name: 'Scour Test', purpose: 'Hip intra-articular pathology' },
      { name: 'Thomas Test', purpose: 'Hip flexor tightness' },
      { name: 'Ober Test', purpose: 'IT band tightness' },
    ],
  },

  ankle: {
    name: 'Foot & Ankle',
    rom: [
      { joint: 'Ankle Dorsiflexion', normal: '20°', side: 'R' },
      { joint: 'Ankle Dorsiflexion', normal: '20°', side: 'L' },
      { joint: 'Ankle Plantarflexion', normal: '50°', side: 'R' },
      { joint: 'Ankle Plantarflexion', normal: '50°', side: 'L' },
      { joint: 'Ankle Inversion', normal: '35°', side: 'R' },
      { joint: 'Ankle Inversion', normal: '35°', side: 'L' },
      { joint: 'Ankle Eversion', normal: '15°', side: 'R' },
      { joint: 'Ankle Eversion', normal: '15°', side: 'L' },
    ],
    mmt: [
      { muscle: 'Dorsiflexors (Tibialis Anterior)', side: 'R', normal: '5/5' },
      { muscle: 'Dorsiflexors (Tibialis Anterior)', side: 'L', normal: '5/5' },
      { muscle: 'Plantarflexors (Gastrocnemius/Soleus)', side: 'R', normal: '5/5' },
      { muscle: 'Plantarflexors (Gastrocnemius/Soleus)', side: 'L', normal: '5/5' },
      { muscle: 'Invertors (Tibialis Posterior)', side: 'R', normal: '5/5' },
      { muscle: 'Invertors (Tibialis Posterior)', side: 'L', normal: '5/5' },
      { muscle: 'Evertors (Peroneals)', side: 'R', normal: '5/5' },
      { muscle: 'Evertors (Peroneals)', side: 'L', normal: '5/5' },
    ],
    specialTests: [
      { name: 'Anterior Drawer Test', purpose: 'ATFL integrity' },
      { name: 'Talar Tilt Test', purpose: 'CFL integrity' },
      { name: 'Thompson Test', purpose: 'Achilles tendon rupture' },
      { name: 'Kleiger Test', purpose: 'Deltoid ligament/syndesmosis' },
      { name: 'Squeeze Test', purpose: 'Syndesmosis injury' },
    ],
  },

  elbow: {
    name: 'Elbow',
    rom: [
      { joint: 'Elbow Flexion', normal: '145°', side: 'R' },
      { joint: 'Elbow Flexion', normal: '145°', side: 'L' },
      { joint: 'Elbow Extension', normal: '0°', side: 'R' },
      { joint: 'Elbow Extension', normal: '0°', side: 'L' },
      { joint: 'Forearm Pronation', normal: '80°', side: 'R' },
      { joint: 'Forearm Pronation', normal: '80°', side: 'L' },
      { joint: 'Forearm Supination', normal: '80°', side: 'R' },
      { joint: 'Forearm Supination', normal: '80°', side: 'L' },
    ],
    mmt: [
      { muscle: 'Biceps (Elbow Flexion)', side: 'R', normal: '5/5' },
      { muscle: 'Biceps (Elbow Flexion)', side: 'L', normal: '5/5' },
      { muscle: 'Triceps (Elbow Extension)', side: 'R', normal: '5/5' },
      { muscle: 'Triceps (Elbow Extension)', side: 'L', normal: '5/5' },
      { muscle: 'Pronators', side: 'R', normal: '5/5' },
      { muscle: 'Pronators', side: 'L', normal: '5/5' },
      { muscle: 'Supinators', side: 'R', normal: '5/5' },
      { muscle: 'Supinators', side: 'L', normal: '5/5' },
    ],
    specialTests: [
      { name: "Cozen's Test", purpose: 'Lateral epicondylitis' },
      { name: "Mill's Test", purpose: 'Lateral epicondylitis' },
      { name: "Golfer's Elbow Test", purpose: 'Medial epicondylitis' },
      { name: 'Valgus Stress Test', purpose: 'UCL integrity' },
      { name: 'Varus Stress Test', purpose: 'RCL integrity' },
    ],
  },

  'wrist-hand': {
    name: 'Wrist & Hand',
    rom: [
      { joint: 'Wrist Flexion', normal: '80°', side: 'R' },
      { joint: 'Wrist Flexion', normal: '80°', side: 'L' },
      { joint: 'Wrist Extension', normal: '70°', side: 'R' },
      { joint: 'Wrist Extension', normal: '70°', side: 'L' },
      { joint: 'Radial Deviation', normal: '20°', side: 'R' },
      { joint: 'Radial Deviation', normal: '20°', side: 'L' },
      { joint: 'Ulnar Deviation', normal: '35°', side: 'R' },
      { joint: 'Ulnar Deviation', normal: '35°', side: 'L' },
    ],
    mmt: [
      { muscle: 'Wrist Flexors', side: 'R', normal: '5/5' },
      { muscle: 'Wrist Flexors', side: 'L', normal: '5/5' },
      { muscle: 'Wrist Extensors', side: 'R', normal: '5/5' },
      { muscle: 'Wrist Extensors', side: 'L', normal: '5/5' },
      { muscle: 'Radial Deviators', side: 'R', normal: '5/5' },
      { muscle: 'Radial Deviators', side: 'L', normal: '5/5' },
      { muscle: 'Ulnar Deviators', side: 'R', normal: '5/5' },
      { muscle: 'Ulnar Deviators', side: 'L', normal: '5/5' },
    ],
    specialTests: [
      { name: "Finkelstein's Test", purpose: 'De Quervain tenosynovitis' },
      { name: "Phalen's Test", purpose: 'Carpal tunnel syndrome' },
      { name: "Tinel's Sign (Wrist)", purpose: 'Median nerve irritation' },
      { name: 'TFCC Load Test', purpose: 'TFCC pathology' },
    ],
  },

  'thoracic-spine': {
    name: 'Thoracic Spine',
    rom: [
      { joint: 'Thoracic Flexion', normal: '20-45°', side: '' },
      { joint: 'Thoracic Extension', normal: '25-45°', side: '' },
      { joint: 'Lateral Flexion', normal: '20-40°', side: 'R' },
      { joint: 'Lateral Flexion', normal: '20-40°', side: 'L' },
      { joint: 'Rotation', normal: '30-45°', side: 'R' },
      { joint: 'Rotation', normal: '30-45°', side: 'L' },
    ],
    mmt: [
      { muscle: 'Thoracic Extensors', side: '', normal: '5/5' },
      { muscle: 'Scapular Retractors', side: 'R', normal: '5/5' },
      { muscle: 'Scapular Retractors', side: 'L', normal: '5/5' },
    ],
    specialTests: [
      { name: 'PA Spring Test', purpose: 'Facet/rib dysfunction' },
      { name: 'Rib Spring Test', purpose: 'Rib hypomobility' },
      { name: 'Thoracic Rotation Test', purpose: 'Segmental restriction' },
    ],
  },
};

/**
 * Creates a complete regional assessment section with ROM, MMT, and Special Tests
 * @param {string} regionKey - Region identifier
 * @param {object} assessmentData - Current assessment data
 * @param {function} onChange - Change handler
 */
export function createRegionalAssessment(regionKey, assessmentData, onChange) {
  const region = regionalAssessments[regionKey];
  if (!region) {
    console.error(`Unknown region: ${regionKey}`);
    return el('div', {}, `Unknown region: ${regionKey}`);
  }

  const container = el('div', {
    class: 'regional-assessment',
    'data-region': regionKey,
    style: 'margin-bottom: 32px;',
  });

  // Regional header
  const header = el(
    'div',
    {
      class: 'regional-assessment__header',
      style: 'margin-bottom: 20px; padding-bottom: 8px; border-bottom: 2px solid var(--accent2);',
    },
    [
      el(
        'h4',
        {
          class: 'regional-assessment__title',
          style: 'margin: 0; color: var(--accent2); font-size: 18px;',
        },
        region.name,
      ),
      el(
        'p',
        {
          class: 'regional-assessment__description',
          style: 'margin: 4px 0 0 0; color: var(--text-muted); font-size: 14px;',
        },
        `Comprehensive assessment including range of motion, manual muscle testing, and special tests.`,
      ),
    ],
  );

  container.appendChild(header);

  // Initialize data structure if needed
  if (!assessmentData.rom) assessmentData.rom = {};
  if (!assessmentData.mmt) assessmentData.mmt = {};
  if (!assessmentData.specialTests) assessmentData.specialTests = {};

  // ROM Section
  const romSection = createRomSection(regionKey, region, assessmentData.rom, (romData) => {
    assessmentData.rom = romData;
    onChange(assessmentData);
  });
  container.appendChild(romSection.element);

  // MMT Section
  const mmtSection = createMmtSection(regionKey, region, assessmentData.mmt, (mmtData) => {
    assessmentData.mmt = mmtData;
    onChange(assessmentData);
  });
  container.appendChild(mmtSection.element);

  // Special Tests Section
  const specialTestsSection = createSpecialTestsSection(
    regionKey,
    region,
    assessmentData.specialTests,
    (testData) => {
      assessmentData.specialTests = testData;
      onChange(assessmentData);
    },
  );
  container.appendChild(specialTestsSection.element);

  return {
    element: container,
    rom: romSection,
    mmt: mmtSection,
    specialTests: specialTestsSection,
    getData: () => assessmentData,
    updateData: onChange,
  };
}

/**
 * Creates multi-regional assessment with permanently visible tables
 * Users can select multiple regions which populate the ROM, MMT, and Special Tests tables
 */
export function createMultiRegionalAssessment(allAssessmentData, onChange) {
  const container = el('div', { class: 'multi-regional-assessment' });

  // Normalize and restore state
  allAssessmentData = normalizeAllAssessmentData(allAssessmentData, onChange);
  let selectedRegions = new Set(
    filterInvalidRegions(allAssessmentData.selectedRegions, onChange, allAssessmentData),
  );

  // Region selector
  const { selectorEl, buttonsMap } = makeRegionSelector(
    getRegionOrder(),
    selectedRegions,
    (regionKey) => {
      // Toggle selection and update UI classes
      const button = buttonsMap[regionKey];
      if (!button) return;
      if (selectedRegions.has(regionKey)) {
        selectedRegions.delete(regionKey);
        button.classList.remove('primary');
        button.classList.add('secondary');
      } else {
        selectedRegions.add(regionKey);
        button.classList.remove('secondary');
        button.classList.add('primary');
      }
      allAssessmentData.selectedRegions = Array.from(selectedRegions);
      refreshTables();
      onChange(allAssessmentData);
    },
  );
  container.appendChild(selectorEl);

  // Tables containers
  const promContainer = el('div', { class: 'prom-container', style: 'margin-bottom: 30px;' });
  const romContainer = el('div', { class: 'rom-container', style: 'margin-bottom: 30px;' });
  const mmtContainer = el('div', { class: 'mmt-container', style: 'margin-bottom: 30px;' });
  const specialTestsContainer = el('div', {
    class: 'special-tests-container',
    style: 'margin-bottom: 30px;',
  });
  const tablesContainer = el('div', { class: 'tables-container' }, [
    promContainer,
    romContainer,
    mmtContainer,
    specialTestsContainer,
  ]);
  container.appendChild(tablesContainer);

  // Build refresh function
  const refreshTables = makeRefreshTables({
    getSelectedRegions: () => selectedRegions,
    allAssessmentData,
    onChange,
    promContainer,
    romContainer,
    mmtContainer,
    specialTestsContainer,
  });

  // Initial render
  refreshTables();

  return {
    element: container,
    getSelectedRegions: () => Array.from(selectedRegions),
    getData: () => allAssessmentData,
    updateData: onChange,
    refreshTables,
  };
}

function normalizeAllAssessmentData(data, onChange) {
  const d = data || {};
  d.selectedRegions = d.selectedRegions || [];
  d.rom = d.rom || {};
  d.prom = d.prom || {};
  d.mmt = d.mmt || {};
  d.specialTests = d.specialTests || {};
  d.promExcluded = d.promExcluded || [];
  if (!d._promEndfeelMigrated) {
    try {
      const promKeys = Object.keys(d.prom || {});
      let changed = false;
      promKeys.forEach((k) => {
        const row = d.prom[k];
        if (row && typeof row === 'object') {
          const isCapsular =
            typeof row.endfeel === 'string' && row.endfeel.toLowerCase() === 'capsular';
          if (isCapsular) {
            row.endfeel = '';
            changed = true;
          }
        }
      });
      d._promEndfeelMigrated = true;
      if (changed) onChange(d);
    } catch {
      d._promEndfeelMigrated = true;
    }
  }
  return d;
}

function filterInvalidRegions(regions, onChange, dataRef) {
  const valid = (regions || []).filter((regionKey) => {
    const exists = Object.prototype.hasOwnProperty.call(regionalAssessments, regionKey);
    if (!exists && regionKey) {
      try {
        const isDev =
          typeof window !== 'undefined' &&
          window.location &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isDev) console.warn(`Regional assessment: Invalid region "${regionKey}" filtered out.`);
      } catch {}
    }
    return exists;
  });
  if (valid.length !== (regions || []).length) {
    dataRef.selectedRegions = valid;
    onChange(dataRef);
  }
  return valid;
}

function getRegionOrder() {
  const desiredOrder = [
    'hip',
    'knee',
    'ankle',
    'shoulder',
    'elbow',
    'wrist-hand',
    'cervical-spine',
    'thoracic-spine',
    'lumbar-spine',
  ];
  const availableKeys = Object.keys(regionalAssessments);
  const remaining = availableKeys.filter((k) => !desiredOrder.includes(k));
  return [...desiredOrder.filter((k) => availableKeys.includes(k)), ...remaining];
}

function makeRegionSelector(regionOrder, selectedRegions, onToggle) {
  const regionSelector = el('div', { class: 'region-selector' });
  const regionLabel = el('p', { class: 'region-selector__label' }, 'Select regions to assess:');
  const regionButtons = el('div', { class: 'region-buttons' });
  const buttonsMap = {};
  regionOrder.forEach((regionKey) => {
    const region = regionalAssessments[regionKey];
    const isSelected = selectedRegions.has(regionKey);
    const button = el(
      'button',
      {
        type: 'button',
        class: `btn pill-btn region-toggle-btn ${isSelected ? 'primary' : 'secondary'}`,
        onclick: () => onToggle(regionKey),
      },
      region.name,
    );
    buttonsMap[regionKey] = button;
    regionButtons.appendChild(button);
  });
  regionSelector.appendChild(regionLabel);
  regionSelector.appendChild(regionButtons);
  return { selectorEl: regionSelector, buttonsMap, toggleRegion: onToggle };
}

function makeRefreshTables({
  getSelectedRegions,
  allAssessmentData,
  onChange,
  promContainer,
  romContainer,
  mmtContainer,
  specialTestsContainer,
}) {
  let promTable, romSection, mmtSection, specialTestsSection;
  const buildCombined = (key) => {
    const out = [];
    getSelectedRegions().forEach((regionKey) => {
      const region = regionalAssessments[regionKey];
      if (region && region[key]) {
        region[key].forEach((item) => out.push({ ...item, regionKey, regionName: region.name }));
      }
    });
    return out;
  };

  return () => {
    const combinedPromData = buildCombined('rom');
    const combinedRomData = buildCombined('rom');
    const combinedMmtData = buildCombined('mmt');
    const combinedSpecialTestsData = buildCombined('specialTests');

    // PROM
    promContainer.replaceChildren();
    if (combinedPromData.length > 0) {
      const groups = {};
      combinedPromData.forEach((item) => {
        const baseName = item.name || item.joint || item.muscle;
        if (!groups[baseName])
          groups[baseName] = { normal: item.normal, left: null, right: null, bilateral: null };
        if (item.side === 'L') groups[baseName].left = true;
        else if (item.side === 'R') groups[baseName].right = true;
        else groups[baseName].bilateral = true;
      });
      const tableData = {};
      const excludedSet = new Set(allAssessmentData.promExcluded || []);
      Object.keys(groups).forEach((groupName) => {
        const rowId = groupName.toLowerCase().replace(/\s+/g, '-');
        if (excludedSet.has(rowId)) return;
        const saved = allAssessmentData.prom[rowId] || {};
        const displayName = groups[groupName].normal
          ? `${groupName} (${groups[groupName].normal})`
          : groupName;
        tableData[rowId] = { name: displayName, left: saved.left || '', right: saved.right || '' };
      });
      promTable = createEditableTable({
        columns: [
          {
            field: 'name',
            label: 'Passive Range of Motion (PROM)',
            short: 'PROM',
            width: '50%',
            type: 'label',
          },
          { field: 'left', label: 'Left', width: '25%' },
          { field: 'right', label: 'Right', width: '25%' },
        ],
        data: tableData,
        onChange: (newData) => {
          const updated = { ...allAssessmentData.prom };
          Object.keys(newData).forEach((rowId) => {
            const row = newData[rowId];
            updated[rowId] = { left: row.left || '', right: row.right || '' };
          });
          const currentRowIds = Object.keys(groups).map((n) =>
            n.toLowerCase().replace(/\s+/g, '-'),
          );
          const newRowIds = Object.keys(newData);
          const excluded = currentRowIds.filter((id) => !newRowIds.includes(id));
          const existingExcluded = new Set(allAssessmentData.promExcluded || []);
          const prunedExisting = Array.from(existingExcluded).filter((id) =>
            currentRowIds.includes(id),
          );
          const mergedExcluded = Array.from(new Set([...prunedExisting, ...excluded]));
          allAssessmentData.prom = updated;
          allAssessmentData.promExcluded = mergedExcluded;
          onChange(allAssessmentData);
        },
        showAddButton: false,
        showDeleteButton: true,
        actionsHeaderLabel: '',
        className: 'bilateral-table',
      });
      promContainer.appendChild(promTable.element);
    } else {
      promContainer.appendChild(
        el(
          'div',
          {
            style:
              'padding: 20px; text-align: center; color: var(--text-muted); background: var(--surface-secondary); border-radius: 6px;',
          },
          'Select regions above to display Passive Range of Motion (PROM) assessments',
        ),
      );
    }

    // ROM
    romContainer.replaceChildren();
    if (combinedRomData.length > 0) {
      romSection = createRomSection(
        'multi-region',
        { name: 'Range of Motion', rom: combinedRomData },
        allAssessmentData.rom,
        (romData) => {
          allAssessmentData.rom = romData;
          onChange(allAssessmentData);
        },
      );
      romContainer.appendChild(romSection.element);
    } else {
      romContainer.appendChild(
        el(
          'div',
          {
            style:
              'padding: 20px; text-align: center; color: var(--text-muted); background: var(--surface-secondary); border-radius: 6px;',
          },
          'Select regions above to display Range of Motion assessments',
        ),
      );
    }

    // MMT
    mmtContainer.replaceChildren();
    if (combinedMmtData.length > 0) {
      mmtSection = createMmtSection(
        'multi-region',
        { name: 'Manual Muscle Testing', mmt: combinedMmtData },
        allAssessmentData.mmt,
        (mmtData) => {
          allAssessmentData.mmt = mmtData;
          onChange(allAssessmentData);
        },
      );
      mmtContainer.appendChild(mmtSection.element);
    } else {
      mmtContainer.appendChild(
        el(
          'div',
          {
            style:
              'padding: 20px; text-align: center; color: var(--text-muted); background: var(--surface-secondary); border-radius: 6px;',
          },
          'Select regions above to display Manual Muscle Testing assessments',
        ),
      );
    }

    // Special Tests
    specialTestsContainer.replaceChildren();
    if (combinedSpecialTestsData.length > 0) {
      specialTestsSection = createSpecialTestsSection(
        'multi-region',
        { name: 'Special Tests', specialTests: combinedSpecialTestsData },
        allAssessmentData.specialTests,
        (testData) => {
          allAssessmentData.specialTests = testData;
          onChange(allAssessmentData);
        },
      );
      specialTestsContainer.appendChild(specialTestsSection.element);
    } else {
      specialTestsContainer.appendChild(
        el(
          'div',
          {
            style:
              'padding: 20px; text-align: center; color: var(--text-muted); background: var(--surface-secondary); border-radius: 6px;',
          },
          'Select regions above to display Special Tests assessments',
        ),
      );
    }
  };
}
