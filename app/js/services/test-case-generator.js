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

  
  testCases.forEach((testCase, index) => {

    
    try {
      const generatedCase = generateCase(testCase);
      
      // Verify basic structure






      
      // Check if we have realistic ROM values
      const romValues = Object.values(generatedCase.findings.rom);
      const hasRealisticRom = romValues.some(val => val && val.includes('°'));

      
      // Check condition-specific tests
      const hasConditionTests = generatedCase.findings.special_tests.some(test => 
        test.result === 'positive' || test.result.includes('positive')
      );

      
    } catch (error) {
      console.error('❌ Error generating case:', error);
    }
  });
}

// Export for use in browser console
window.testCaseGenerator = runTests;


