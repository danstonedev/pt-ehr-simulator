// Test case generation with regional assessment integration
import { generateCase } from './case-generator.js';

console.log('=== Testing Case Generation with Regional Assessment Integration ===');

// Test shoulder case
const shoulderCase = generateCase({
  title: "Test Shoulder Case",
  region: "shoulder", 
  condition: "Rotator cuff tendinopathy",
  age: 42,
  sex: "female",
  pain: 6,
  goal: "Return to overhead lifting",
  acuity: "chronic"
});

console.log('Generated Shoulder Case Structure:');
console.log('- Title:', shoulderCase.title);
console.log('- Selected Regions:', shoulderCase.encounters.eval.objective.regionalAssessments.selectedRegions);
console.log('- ROM Data Keys:', Object.keys(shoulderCase.encounters.eval.objective.regionalAssessments.rom));
console.log('- MMT Data Keys:', Object.keys(shoulderCase.encounters.eval.objective.regionalAssessments.mmt));
console.log('- ROM Sample Values:');
Object.entries(shoulderCase.encounters.eval.objective.regionalAssessments.rom).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});
console.log('- MMT Sample Values:');
Object.entries(shoulderCase.encounters.eval.objective.regionalAssessments.mmt).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

console.log('\n=== Testing Knee Case ===');

// Test knee case
const kneeCase = generateCase({
  title: "Test Knee Case",
  region: "knee", 
  condition: "ACL sprain",
  age: 25,
  sex: "male",
  pain: 7,
  goal: "Return to soccer",
  acuity: "acute"
});

console.log('Generated Knee Case Structure:');
console.log('- Title:', kneeCase.title);
console.log('- Selected Regions:', kneeCase.encounters.eval.objective.regionalAssessments.selectedRegions);
console.log('- ROM Data Keys:', Object.keys(kneeCase.encounters.eval.objective.regionalAssessments.rom));
console.log('- MMT Data Keys:', Object.keys(kneeCase.encounters.eval.objective.regionalAssessments.mmt));
