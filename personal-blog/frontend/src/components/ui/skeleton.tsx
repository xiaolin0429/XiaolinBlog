import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// 文章卡片骨架屏
function PostCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex items-center space-x-4 pt-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

// 表格行骨架屏
function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// 用户头像骨架屏
function AvatarSkeleton() {
  return <Skeleton className="h-10 w-10 rounded-full" />
}

// 标签骨架屏
function TagSkeleton() {
  return <Skeleton className="h-6 w-16 rounded-full" />
}

export { 
  Skeleton, 
  PostCardSkeleton, 
  TableRowSkeleton, 
  AvatarSkeleton, 
  TagSkeleton 
}