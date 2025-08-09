/**
 * 认证状态管理Store
 * 基于Zustand的认证状态管理
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { User } from '../../core/entities/User'
import { SessionDetails } from '../../core/contracts/IAuthService'

export interface AuthState {
  // 用户信息
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // 认证信息
  token: string | null
  sessionId: string | null
  sessionDetails: SessionDetails | null
  
  // 状态标识
  authStatus: 'idle' | 'checking' | 'authenticated' | 'unauthenticated' | 'error'
  error: string | null
  lastCheck: number
  
  // 权限相关
  permissions: string[]
  roles: string[]
}

export interface AuthActions {
  // 状态更新
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setAuthStatus: (status: AuthState['authStatus']) => void
  setToken: (token: string | null) => void
  setSessionId: (sessionId: string | null) => void
  setSessionDetails: (details: SessionDetails | null) => void
  
  // 权限管理
  setPermissions: (permissions: string[]) => void
  setRoles: (roles: string[]) => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasAllRoles: (roles: string[]) => boolean
  
  // 复合操作
  updateAuthData: (data: {
    user?: User | null
    token?: string | null
    sessionId?: string | null
    sessionDetails?: SessionDetails | null
  }) => void
  
  // 重置状态
  reset: () => void
  clearError: () => void
  
  // 工具方法
  isAdmin: () => boolean
  isStaff: () => boolean
  getUserDisplayName: () => string
  getAuthStatusText: () => string
}

// 初始状态
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  token: null,
  sessionId: null,
  sessionDetails: null,
  authStatus: 'idle',
  error: null,
  lastCheck: 0,
  permissions: [],
  roles: []
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 状态
      ...initialState,

      // Actions
      setUser: (user: User | null) => {
        set((state) => {
          const newState: Partial<AuthState> = {
            user,
            isAuthenticated: !!user,
            lastCheck: Date.now()
          }

          // 更新权限和角色
          if (user) {
            newState.permissions = user.roles?.flatMap(role => role.permissions) || []
            newState.roles = user.roles?.map(role => role.name) || []
            newState.authStatus = 'authenticated'
            newState.error = null
          } else {
            newState.permissions = []
            newState.roles = []
            newState.authStatus = 'unauthenticated'
            newState.token = null
            newState.sessionId = null
            newState.sessionDetails = null
          }

          return newState
        })
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      setAuthStatus: (authStatus: AuthState['authStatus']) => {
        set({ authStatus })
      },

      setToken: (token: string | null) => {
        set({ token, lastCheck: Date.now() })
      },

      setSessionId: (sessionId: string | null) => {
        set({ sessionId })
      },

      setSessionDetails: (sessionDetails: SessionDetails | null) => {
        set({ sessionDetails })
      },

      setPermissions: (permissions: string[]) => {
        set({ permissions })
      },

      setRoles: (roles: string[]) => {
        set({ roles })
      },

      hasPermission: (permission: string) => {
        const state = get()
        if (state.user?.is_superuser) return true
        return state.permissions.includes(permission)
      },

      hasRole: (role: string) => {
        const state = get()
        if (state.user?.is_superuser) return true
        return state.roles.includes(role)
      },

      hasAnyRole: (roles: string[]) => {
        const state = get()
        if (state.user?.is_superuser) return true
        return roles.some(role => state.roles.includes(role))
      },

      hasAllRoles: (roles: string[]) => {
        const state = get()
        if (state.user?.is_superuser) return true
        return roles.every(role => state.roles.includes(role))
      },

      updateAuthData: (data) => {
        set((state) => ({
          ...state,
          ...data,
          lastCheck: Date.now(),
          isAuthenticated: !!data.user || (data.user === undefined && state.isAuthenticated)
        }))
      },

      reset: () => {
        set({ ...initialState })
      },

      clearError: () => {
        set({ error: null })
      },

      isAdmin: () => {
        const state = get()
        return state.user?.is_superuser || state.user?.is_staff || false
      },

      isStaff: () => {
        const state = get()
        return state.user?.is_staff || false
      },

      getUserDisplayName: () => {
        const state = get()
        if (!state.user) return '游客'
        return state.user.full_name || state.user.username
      },

      getAuthStatusText: () => {
        const state = get()
        switch (state.authStatus) {
          case 'idle': return '未知'
          case 'checking': return '验证中'
          case 'authenticated': return '已登录'
          case 'unauthenticated': return '未登录'
          case 'error': return '认证错误'
          default: return '未知'
        }
      }
    })),
    { name: 'auth-store' }
  )
)

// 便捷的选择器hooks
export const useAuthUser = () => useAuthStore(state => state.user)
export const useAuthStatus = () => useAuthStore(state => ({
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  authStatus: state.authStatus,
  error: state.error
}))

export const useAuthActions = () => useAuthStore(state => ({
  setUser: state.setUser,
  setLoading: state.setLoading,
  setError: state.setError,
  setAuthStatus: state.setAuthStatus,
  updateAuthData: state.updateAuthData,
  reset: state.reset,
  clearError: state.clearError
}))

export const useAuthPermissions = () => useAuthStore(state => ({
  permissions: state.permissions,
  roles: state.roles,
  hasPermission: state.hasPermission,
  hasRole: state.hasRole,
  hasAnyRole: state.hasAnyRole,
  hasAllRoles: state.hasAllRoles,
  isAdmin: state.isAdmin,
  isStaff: state.isStaff
}))

export const useAuthInfo = () => useAuthStore(state => ({
  user: state.user,
  token: state.token,
  sessionId: state.sessionId,
  sessionDetails: state.sessionDetails,
  displayName: state.getUserDisplayName(),
  statusText: state.getAuthStatusText(),
  lastCheck: state.lastCheck
}))

// 订阅状态变化的hook
export const useAuthStateSubscription = (
  callback: (state: AuthState) => void,
  deps: (keyof AuthState)[] = ['isAuthenticated', 'user', 'authStatus']
) => {
  return useAuthStore.subscribe(
    state => deps.reduce((obj, key) => ({ ...obj, [key]: state[key] }), {} as AuthState),
    callback
  )
}