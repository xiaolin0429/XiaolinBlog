import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { AppProvider } from "../AppProvider";
import { Toaster } from "sonner";

// 默认的静态元数据
export const metadata: Metadata = {
  title: "个人博客系统",
  description: "现代化的个人博客平台，支持文章发布、评论互动、分类标签等功能",
  keywords: "博客,文章,技术分享,个人网站",
  authors: [{ name: "博客作者" }],
  openGraph: {
    title: "个人博客系统",
    description: "现代化的个人博客平台",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AppProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <MainLayout>
              {children}
            </MainLayout>
            <Toaster />
          </ThemeProvider>
        </AppProvider>
      </body>
    </html>
  );
}

// 主布局组件
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {children}
    </div>
  );
}