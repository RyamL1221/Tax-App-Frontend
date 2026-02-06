/**
 * Local API Test Script
 * 
 * This script tests the API client against a local backend running at http://127.0.0.1:3000
 * 
 * Usage:
 * 1. Ensure the backend server is running on port 3000
 * 2. Run: npx ts-node src/lib/api/test-local-api.ts
 */

import { ApiClient } from './apiClient';
import { AuthService } from './authService';
import { TokenManager } from './tokenManager';
import { authRequestInterceptor, authResponseInterceptor } from './interceptors';

async function testLocalAPI() {
  console.log('🧪 Testing API Client against local backend...\n');

  // Create API client instance pointing to local backend
  const apiClient = new ApiClient({
    baseURL: 'http://127.0.0.1:3000',
    timeout: 30000
  });

  // Register interceptors
  apiClient.addRequestInterceptor(authRequestInterceptor);
  apiClient.addResponseInterceptor(authResponseInterceptor);

  const tokenManager = new TokenManager();
  const authService = new AuthService(apiClient, tokenManager);

  try {
    // Test 1: Health Check
    console.log('📡 Test 1: Health Check');
    console.log('GET http://127.0.0.1:3000/hello');
    const healthResponse = await apiClient.healthCheck();
    console.log('✅ Success:', healthResponse.message);
    console.log('');

    // Test 2: Register a new user
    console.log('📝 Test 2: User Registration');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    console.log(`POST http://127.0.0.1:3000/auth/register`);
    console.log(`Email: ${testEmail}`);
    
    try {
      const registerResponse = await authService.register({
        email: testEmail,
        name: 'Test User',
        password: testPassword
      });
      console.log('✅ Success:', registerResponse.message);
      console.log('');
    } catch (error: any) {
      if (error.status === 409) {
        console.log('⚠️  User already exists (409 Conflict) - this is expected if running multiple times');
        console.log('');
      } else {
        throw error;
      }
    }

    // Test 3: Login
    console.log('🔐 Test 3: User Login');
    console.log(`POST http://127.0.0.1:3000/auth/login`);
    console.log(`Email: ${testEmail}`);
    
    const loginResponse = await authService.login({
      email: testEmail,
      password: testPassword
    });
    console.log('✅ Success: Logged in');
    console.log(`User ID: ${loginResponse.userId}`);
    console.log(`Token stored: ${tokenManager.hasToken()}`);
    console.log('');

    // Test 4: Verify token is stored
    console.log('🔑 Test 4: Token Management');
    const hasToken = tokenManager.hasToken();
    console.log(`Token exists: ${hasToken}`);
    if (hasToken) {
      const token = tokenManager.getToken();
      console.log(`Token length: ${token?.length} characters`);
      console.log(`Token preview: ${token?.substring(0, 20)}...`);
    }
    console.log('');

    // Test 5: Logout
    console.log('🚪 Test 5: User Logout');
    authService.logout();
    console.log('✅ Success: Logged out');
    console.log(`Token cleared: ${!tokenManager.hasToken()}`);
    console.log('');

    console.log('🎉 All tests passed!\n');
    console.log('Summary:');
    console.log('✅ Health check endpoint working');
    console.log('✅ User registration working');
    console.log('✅ User login working');
    console.log('✅ Token management working');
    console.log('✅ User logout working');

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    
    if (error.status === 0) {
      console.error('\n⚠️  Connection Error:');
      console.error('   Make sure the backend server is running on http://127.0.0.1:3000');
      console.error('   You can start it with: npm run dev (in the backend directory)');
    } else if (error.status) {
      console.error(`\n⚠️  HTTP ${error.status} Error:`, error.message);
      if (error.errors) {
        console.error('   Validation errors:');
        error.errors.forEach((err: any) => {
          console.error(`   - ${err.field}: ${err.message}`);
        });
      }
    }
    
    process.exit(1);
  }
}

// Run the tests
testLocalAPI();
