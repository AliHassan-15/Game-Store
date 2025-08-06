import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState, User, LoginCredentials, RegisterData } from '@/types/auth/auth'
import authService from '@/services/api/auth/authApi'

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshTokenAction: () => Promise<void>
  getProfile: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
  setUser: (user: User | null) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accessToken: null,
  refreshToken: null,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Login user
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await authService.login(credentials)
          
          if (response.success) {
            const { user, accessToken, refreshToken } = response.data
            
            // Store tokens
            authService.setTokens(accessToken, refreshToken)
            
            set({
              user,
              isAuthenticated: true,
              accessToken,
              refreshToken,
              isLoading: false,
              error: null,
            })
          } else {
            set({
              isLoading: false,
              error: response.message,
            })
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Login failed',
          })
        }
      },

      // Register user
      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await authService.register(data)
          
          if (response.success) {
            const { user, accessToken, refreshToken } = response.data
            
            // Store tokens
            authService.setTokens(accessToken, refreshToken)
            
            set({
              user,
              isAuthenticated: true,
              accessToken,
              refreshToken,
              isLoading: false,
              error: null,
            })
          } else {
            set({
              isLoading: false,
              error: response.message,
            })
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Registration failed',
          })
        }
      },

      // Logout user
      logout: async () => {
        try {
          set({ isLoading: true })
          
          await authService.logout()
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout API error:', error)
        } finally {
          // Clear local storage and state
          authService.clearTokens()
          set({
            ...initialState,
            isLoading: false,
          })
        }
      },

      // Refresh token
      refreshTokenAction: async () => {
        try {
          const response = await authService.refreshToken()
          
          if (response.success) {
            const { accessToken, refreshToken } = response.data
            
            // Store tokens
            authService.setTokens(accessToken, refreshToken)
            
            set({
              accessToken,
              refreshToken,
            })
          } else {
            // Refresh failed, logout user
            get().logout()
          }
        } catch (error) {
          // Refresh failed, logout user
          get().logout()
        }
      },

      // Get user profile
      getProfile: async () => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await authService.getProfile()
          
          if (response.success) {
            set({
              user: response.data.user,
              isLoading: false,
            })
          } else {
            set({
              isLoading: false,
              error: 'Failed to get profile',
            })
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to get profile',
          })
        }
      },

      // Check authentication status
      checkAuth: async () => {
        try {
          const tokens = authService.getTokens()
          
          if (!tokens.accessToken) {
            set({ isAuthenticated: false })
            return
          }

          const response = await authService.checkAuth()
          
          if (response.success) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
            })
          } else {
            // Auth check failed, clear tokens
            authService.clearTokens()
            set({ isAuthenticated: false })
          }
        } catch (error) {
          // Auth check failed, clear tokens
          authService.clearTokens()
          set({ isAuthenticated: false })
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // Set user
      setUser: (user: User | null) => {
        set({ user })
      },

      // Set tokens
      setTokens: (accessToken: string, refreshToken: string) => {
        authService.setTokens(accessToken, refreshToken)
        set({ accessToken, refreshToken })
      },

      // Clear auth state
      clearAuth: () => {
        authService.clearTokens()
        set(initialState)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
) 