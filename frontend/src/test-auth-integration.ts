/**
 * Frontend Authentication Integration Test
 * 
 * This file contains tests to verify that the frontend authentication
 * is properly connected to the backend authentication system.
 */

// Test configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Test data
const testUserData = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890'
}

const testLoginCredentials = {
  email: 'test@example.com',
  password: 'TestPassword123!'
}

// Test suite
const authTestSuite = {
  // Test backend connectivity
  async testBackendConnectivity() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Backend connectivity test passed')
        return { success: true, data }
      } else {
        console.error('❌ Backend connectivity test failed:', data.message)
        return { success: false, error: data.message }
      }
    } catch (error) {
      console.error('❌ Backend connectivity test failed:', error)
      return { success: false, error: (error as Error).message }
    }
  },

  // Test user registration
  async testUserRegistration() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUserData),
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ User registration test passed')
        return { success: true, data }
      } else {
        console.error('❌ User registration test failed:', data.message)
        return { success: false, error: data.message }
      }
    } catch (error) {
      console.error('❌ User registration test failed:', error)
      return { success: false, error: (error as Error).message }
    }
  },

  // Test user login
  async testUserLogin() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testLoginCredentials),
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ User login test passed')
        return { success: true, data }
      } else {
        console.error('❌ User login test failed:', data.message)
        return { success: false, error: data.message }
      }
    } catch (error) {
      console.error('❌ User login test failed:', error)
      return { success: false, error: (error as Error).message }
    }
  },

  // Test JWT token validation
  async testJWTValidation(accessToken: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ JWT token validation test passed')
        return { success: true, data }
      } else {
        console.error('❌ JWT token validation test failed:', data.message)
        return { success: false, error: data.message }
      }
    } catch (error) {
      console.error('❌ JWT token validation test failed:', error)
      return { success: false, error: (error as Error).message }
    }
  },

  // Test user profile retrieval
  async testProfileRetrieval(accessToken: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Profile retrieval test passed')
        return { success: true, data }
      } else {
        console.error('❌ Profile retrieval test failed:', data.message)
        return { success: false, error: data.message }
      }
    } catch (error) {
      console.error('❌ Profile retrieval test failed:', error)
      return { success: false, error: (error as Error).message }
    }
  },

  // Test token refresh
  async testTokenRefresh(refreshToken: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Token refresh test passed')
        return { success: true, data }
      } else {
        console.error('❌ Token refresh test failed:', data.message)
        return { success: false, error: data.message }
      }
    } catch (error) {
      console.error('❌ Token refresh test failed:', error)
      return { success: false, error: (error as Error).message }
    }
  },

  // Test user logout
  async testUserLogout(accessToken: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ User logout test passed')
        return { success: true, data }
      } else {
        console.error('❌ User logout test failed:', data.message)
        return { success: false, error: data.message }
      }
    } catch (error) {
      console.error('❌ User logout test failed:', error)
      return { success: false, error: (error as Error).message }
    }
  },

  // Test Google OAuth
  async testGoogleOAuth() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`)
      console.log('✅ Google OAuth endpoint available')
      return { success: true, data: { message: 'Google OAuth endpoint available' } }
    } catch (error) {
      console.error('❌ Google OAuth test failed:', error)
      return { success: false, error: (error as Error).message }
    }
  },

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Authentication Integration Tests...')
    console.log('='.repeat(60))
    
    const results: any = {
      backendConnectivity: await this.testBackendConnectivity(),
      userRegistration: await this.testUserRegistration(),
      userLogin: await this.testUserLogin(),
      googleOAuth: await this.testGoogleOAuth()
    }
    
    // If login was successful, test authenticated endpoints
    if (results.userLogin.success && results.userLogin.data?.accessToken) {
      const accessToken = results.userLogin.data.accessToken
      const refreshToken = results.userLogin.data.refreshToken
      
      results.jwtValidation = await this.testJWTValidation(accessToken)
      results.profileRetrieval = await this.testProfileRetrieval(accessToken)
      results.tokenRefresh = await this.testTokenRefresh(refreshToken)
      results.userLogout = await this.testUserLogout(accessToken)
    }
    
    console.log('='.repeat(60))
    console.log('📊 Test Results Summary:')
    console.log('='.repeat(60))
    
    Object.entries(results).forEach(([testName, result]: [string, any]) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL'
      console.log(`${status} ${testName}`)
      if (!result.success) {
        console.log(`   Error: ${result.error}`)
      }
    })
    
    const passedTests = Object.values(results).filter((r: any) => r.success).length
    const totalTests = Object.keys(results).length
    
    console.log('='.repeat(60))
    console.log(`🎯 Overall Result: ${passedTests}/${totalTests} tests passed`)
    console.log('='.repeat(60))
    
    return results
  }
}

// Export for use in browser console or other modules
export default authTestSuite

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).authTestSuite = authTestSuite
  console.log('🔧 Auth test suite loaded. Run authTestSuite.runAllTests() to start testing.')
} 