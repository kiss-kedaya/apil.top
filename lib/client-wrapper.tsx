'use client'

import React, { Suspense } from 'react'

// 加载指示器组件
function LoadingFallback() {
  return <div className="w-full h-12 flex items-center justify-center">加载中...</div>
}

// 用于包装使用useSearchParams的组件
export function ClientOnly({ 
  children, 
  fallback = <LoadingFallback /> 
}: { 
  children: React.ReactNode 
  fallback?: React.ReactNode 
}) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}

// 使用示例:
// import { useSearchParams } from 'next/navigation'
// import { ClientOnly } from '@/lib/client-wrapper'
//
// export function MyComponent() {
//   return (
//     <ClientOnly>
//       <SearchParamsContent />
//     </ClientOnly>
//   )
// }
//
// function SearchParamsContent() {
//   const searchParams = useSearchParams()
//   // 使用searchParams...
//   return <div>...</div>
// } 