// Test case generation with regional assessment integration
import { generateCase } from './case-generator.js';



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







Object.entries(shoulderCase.encounters.eval.objective.regionalAssessments.rom).forEach(([key, value]) => {

});

Object.entries(shoulderCase.encounters.eval.objective.regionalAssessments.mmt).forEach(([key, value]) => {

});



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






