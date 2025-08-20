// test-case-generator.js - Dev utility; not loaded by the app in production
import { generateCase } from './case-generator.js';

// Test cases for different regions and conditions
const testCases = [
  {
    title: 'Shoulder Impingement Test',
    region: 'shoulder',
    condition: 'rotator cuff tendinopathy', 
    acuity: 'subacute',
    age: 45,
    sex: 'female',
    pain: 6,
    goal: 'return to overhead reaching activities'
  },
  {
    title: 'Knee Pain Test',
    region: 'knee',
    condition: 'meniscus tear',
    acuity: 'chronic', 
    age: 55,
    sex: 'male',
    pain: 4,
    goal: 'walk without limping'
  },
  {
    title: 'Lower Back Test',
    region: 'lumbar-spine',
    condition: 'disc herniation',
    acuity: 'acute',
    age: 35,
    sex: 'male', 
    pain: 8,
    goal: 'return to work lifting'
  }
];

function runTests() {
  console.log('🧪 Testing Enhanced Case Generator with Template Integration');
  
  testCases.forEach((testCase, index) => {
    console.log(`\n--- Test ${index + 1}: ${testCase.title} ---`);
    
    try {
      const generatedCase = generateCase(testCase);
      
      // Verify basic structure
      console.log('✅ Case generated successfully');
      console.log('📋 ROM Data Keys:', Object.keys(generatedCase.findings.rom));
      console.log('💪 MMT Data Keys:', Object.keys(generatedCase.findings.mmt));
      console.log('🔬 Special Tests Count:', generatedCase.findings.special_tests.length);
      console.log('📊 Outcome Measure:', generatedCase.findings.outcome_options[0]?.tool);
      console.log('🎯 Interventions:', generatedCase.encounters.eval.plan.interventions.length);
      
      // Check if we have realistic ROM values
      const romValues = Object.values(generatedCase.findings.rom);
      const hasRealisticRom = romValues.some(val => val && val.includes('°'));
      console.log('📐 Realistic ROM Values:', hasRealisticRom ? '✅' : '❌');
      
      // Check condition-specific tests
      const hasConditionTests = generatedCase.findings.special_tests.some(test => 
        test.result === 'positive' || test.result.includes('positive')
      );
      console.log('🎯 Condition-Specific Tests:', hasConditionTests ? '✅' : '❌');
      
    } catch (error) {
      console.error('❌ Error generating case:', error);
    }
  });
}

// Export for use in browser console
window.testCaseGenerator = runTests;

console.log('🚀 Case Generator Test Ready! Run window.testCaseGenerator() in console');
