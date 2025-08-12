/**
 * 网站公共布局
 * 包含Header和Footer的标准布局
 */

'use client'

import React, { ReactNode } from 'react'
import { DynamicHeader } from '../../components/layout/DynamicHeader'
import { DynamicFooter } from '../../components/layout/DynamicFooter'

export interface PublicLayoutProps {
  children: ReactNode
  showHeader?: boolean
  showFooter?: boolean
}

export function PublicLayout({ 
  children, 
  showHeader = true, 
  showFooter = true 
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <DynamicHeader />}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <DynamicFooter />}
    </div>
  )
}