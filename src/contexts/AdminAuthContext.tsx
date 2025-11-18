'use client'

import { createContext, useContext, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'

export interface UserData {
  id: string
  name: string
  email: string
  role: string
}

interface AdminAuthContextType {
  user: User | null
  userData: UserData | null
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({
  children,
  initialUser,
  initialUserData
}: {
  children: ReactNode
  initialUser: User | null
  initialUserData: UserData | null
}) {
  return (
    <AdminAuthContext.Provider value={{ user: initialUser, userData: initialUserData }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}
