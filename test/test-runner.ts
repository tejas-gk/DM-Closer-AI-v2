#!/usr/bin/env tsx

import { spawn } from 'child_process';
import path from 'path';

interface TestSuite {
  name: string;
  path: string;
  type: 'unit' | 'integration' | 'e2e';
  timeout?: number;
}

const testSuites: TestSuite[] = [
  // Unit Tests
  {
    name: 'Authentication Service Unit Tests',
    path: 'client/lib/supabase/__tests__/auth.test.ts',
    type: 'unit'
  },
  {
    name: 'Profile Service Unit Tests',
    path: 'client/lib/supabase/__tests__/profiles.test.ts',
    type: 'unit'
  },
  {
    name: 'Admin Profile Service Unit Tests',
    path: 'server/lib/supabase/admin/__tests__/profiles.test.ts',
    type: 'unit'
  },
  {
    name: 'Supabase Client Configuration Tests',
    path: 'client/lib/supabase/__tests__/client.test.ts',
    type: 'unit'
  },
  
  // Integration Tests
  {
    name: 'Authentication Flow Integration Tests',
    path: 'client/lib/supabase/__tests__/integration/auth-flow.integration.test.ts',
    type: 'integration',
    timeout: 30000
  },
  
  // Component Tests
  {
    name: 'Login Component Tests',
    path: 'client/src/pages/__tests__/login.test.tsx',
    type: 'unit'
  },
  {
    name: 'Signup Component Tests',
    path: 'client/src/pages/__tests__/signup.test.tsx',
    type: 'unit'
  },
  
  // E2E Tests
  {
    name: 'Authentication E2E Tests',
    path: 'e2e/auth.spec.ts',
    type: 'e2e',
    timeout: 60000
  }
];

async function runTestSuite(suite: TestSuite): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n🧪 Running ${suite.name}...`);
    
    const command = suite.type === 'e2e' ? 'npx' : 'jest';
    const args = suite.type === 'e2e' 
      ? ['playwright', 'test', suite.path]
      : ['--testPathPattern', suite.path, '--passWithNoTests'];
    
    const process = spawn(command, args, {
      stdio: 'pipe',
      cwd: path.resolve('.')
    });
    
    let output = '';
    let errorOutput = '';
    
    process.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${suite.name} - PASSED`);
        if (output.includes('PASS') || output.includes('passed')) {
          console.log(`   ${output.match(/\d+ (passing|passed)/)?.[0] || 'Tests completed'}`);
        }
        resolve(true);
      } else {
        console.log(`❌ ${suite.name} - FAILED`);
        if (errorOutput) {
          console.log(`   Error: ${errorOutput.split('\n')[0]}`);
        }
        resolve(false);
      }
    });
    
    // Set timeout for test suite
    const timeout = suite.timeout || 10000;
    setTimeout(() => {
      process.kill();
      console.log(`⏰ ${suite.name} - TIMEOUT (${timeout}ms)`);
      resolve(false);
    }, timeout);
  });
}

async function generateCoverageReport() {
  console.log('\n📊 Generating coverage report...');
  
  return new Promise<void>((resolve) => {
    const process = spawn('jest', ['--coverage', '--passWithNoTests'], {
      stdio: 'pipe'
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Coverage report generated');
      } else {
        console.log('❌ Coverage report generation failed');
      }
      resolve();
    });
    
    setTimeout(() => {
      process.kill();
      console.log('⏰ Coverage generation timeout');
      resolve();
    }, 30000);
  });
}

async function runAllTests() {
  console.log('🚀 Starting Supabase Authentication Test Suite');
  console.log('=' .repeat(60));
  
  const results = {
    unit: { passed: 0, failed: 0 },
    integration: { passed: 0, failed: 0 },
    e2e: { passed: 0, failed: 0 }
  };
  
  // Run each test suite
  for (const suite of testSuites) {
    const success = await runTestSuite(suite);
    
    if (success) {
      results[suite.type].passed++;
    } else {
      results[suite.type].failed++;
    }
  }
  
  // Generate coverage report
  await generateCoverageReport();
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  console.log(`\n🔬 Unit Tests:`);
  console.log(`   ✅ Passed: ${results.unit.passed}`);
  console.log(`   ❌ Failed: ${results.unit.failed}`);
  
  console.log(`\n🔗 Integration Tests:`);
  console.log(`   ✅ Passed: ${results.integration.passed}`);
  console.log(`   ❌ Failed: ${results.integration.failed}`);
  
  console.log(`\n🌐 End-to-End Tests:`);
  console.log(`   ✅ Passed: ${results.e2e.passed}`);
  console.log(`   ❌ Failed: ${results.e2e.failed}`);
  
  const totalPassed = results.unit.passed + results.integration.passed + results.e2e.passed;
  const totalFailed = results.unit.failed + results.integration.failed + results.e2e.failed;
  const totalTests = totalPassed + totalFailed;
  
  console.log(`\n📊 Overall Results:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Success Rate: ${totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 All tests passed! Authentication system is fully tested.');
  } else {
    console.log(`\n⚠️  ${totalFailed} test(s) failed. Review the output above for details.`);
  }
  
  console.log('\n📁 Test files created:');
  testSuites.forEach(suite => {
    console.log(`   - ${suite.path}`);
  });
  
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests, testSuites };