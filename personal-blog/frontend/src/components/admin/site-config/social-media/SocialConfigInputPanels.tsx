/**
 * 社交媒体配置输入面板组件
 * 使用模块化组件结构，提高代码可维护性
 */

'use client'

import { SocialConfigInputPanelsRefactored } from './SocialConfigInputPanelsRefactored'
import { SocialConfigInputPanelsProps } from './types'

export function SocialConfigInputPanels(props: SocialConfigInputPanelsProps) {
  return <SocialConfigInputPanelsRefactored {...props} />
}
