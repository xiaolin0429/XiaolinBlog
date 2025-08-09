/**
 * 用户实体
 * 领域模型定义
 */

export interface UserRole {
  id: number
  name: string
  permissions: string[]
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
  notifications?: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

export interface UserProfile {
  avatar?: string
  bio?: string
  website?: string
  location?: string
  social_links?: {
    twitter?: string
    github?: string
    linkedin?: string
  }
}

export interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  last_login?: string
  roles?: UserRole[]
  preferences?: UserPreferences
  profile?: UserProfile
}

export class UserEntity implements User {
  constructor(
    public id: number,
    public username: string,
    public email: string,
    public is_active: boolean = true,
    public is_staff: boolean = false,
    public is_superuser: boolean = false,
    public date_joined: string = new Date().toISOString(),
    public first_name?: string,
    public last_name?: string,
    public last_login?: string,
    public roles?: UserRole[],
    public preferences?: UserPreferences,
    public profile?: UserProfile
  ) {}

  get full_name(): string {
    if (this.first_name && this.last_name) {
      return `${this.first_name} ${this.last_name}`.trim()
    }
    return this.username
  }

  get display_name(): string {
    return this.full_name || this.username
  }

  hasRole(roleName: string): boolean {
    return this.roles?.some(role => role.name === roleName) ?? false
  }

  hasPermission(permission: string): boolean {
    if (this.is_superuser) return true
    return this.roles?.some(role => 
      role.permissions.includes(permission)
    ) ?? false
  }

  isAdmin(): boolean {
    return this.is_superuser || this.is_staff
  }

  toJSON(): User {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      full_name: this.full_name,
      is_active: this.is_active,
      is_staff: this.is_staff,
      is_superuser: this.is_superuser,
      date_joined: this.date_joined,
      last_login: this.last_login,
      roles: this.roles,
      preferences: this.preferences,
      profile: this.profile
    }
  }

  static fromJSON(data: User): UserEntity {
    return new UserEntity(
      data.id,
      data.username,
      data.email,
      data.is_active,
      data.is_staff,
      data.is_superuser,
      data.date_joined,
      data.first_name,
      data.last_name,
      data.last_login,
      data.roles,
      data.preferences,
      data.profile
    )
  }
}