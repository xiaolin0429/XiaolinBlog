import { Github, Twitter, Mail, MapPin, Calendar, Code, Coffee, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  const skills = [
    "React", "TypeScript", "Next.js", "Node.js", "Python", "FastAPI",
    "PostgreSQL", "Redis", "Docker", "AWS", "Git", "Linux"
  ];

  const timeline = [
    {
      year: "2024",
      title: "高级全栈开发工程师",
      company: "科技公司",
      description: "负责大型Web应用的架构设计和开发，带领团队完成多个重要项目。"
    },
    {
      year: "2022",
      title: "全栈开发工程师",
      company: "互联网公司",
      description: "参与多个产品的前后端开发，积累了丰富的项目经验。"
    },
    {
      year: "2020",
      title: "前端开发工程师",
      company: "创业公司",
      description: "专注于前端技术栈，参与产品从0到1的完整开发过程。"
    },
    {
      year: "2018",
      title: "计算机科学学士",
      company: "某大学",
      description: "主修计算机科学与技术，为编程生涯奠定了坚实的理论基础。"
    }
  ];

  const stats = [
    { label: "编程经验", value: "6+ 年", icon: Code },
    { label: "项目数量", value: "50+", icon: Coffee },
    { label: "博客文章", value: "128", icon: Heart },
    { label: "开源贡献", value: "200+", icon: Github },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          关于我
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          一个热爱编程、乐于分享的全栈开发工程师
        </p>
      </div>

      {/* 个人简介 */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* 头像 */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-6xl font-bold text-white">张</span>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-foreground mb-4">张三</h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              你好！我是一名全栈开发工程师，拥有6年以上的软件开发经验。
              我热衷于学习新技术，喜欢分享技术心得，相信技术能够改变世界。
              在这个博客中，我会分享我的学习经历、项目经验和技术见解。
            </p>

            {/* 联系方式 */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6">
              <Button variant="outline" size="sm" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </a>
              </Button>
            </div>

            {/* 位置信息 */}
            <div className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start">
              <MapPin className="h-4 w-4" />
              <span>中国 · 北京</span>
            </div>
          </div>
        </div>
      </div>

      <Separator className="mb-16" />

      {/* 统计数据 */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">数据统计</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator className="mb-16" />

      {/* 技能栈 */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">技能栈</h2>
        <div className="flex flex-wrap gap-3 justify-center">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="text-sm py-2 px-4">
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      <Separator className="mb-16" />

      {/* 经历时间线 */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">经历时间线</h2>
        <div className="space-y-8">
          {timeline.map((item, index) => (
            <div key={index} className="flex gap-6">
              {/* 时间轴 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold">
                  {item.year}
                </div>
                {index < timeline.length - 1 && (
                  <div className="w-px h-16 bg-border mt-4"></div>
                )}
              </div>

              {/* 内容 */}
              <div className="flex-1 pb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{item.year}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  {item.title}
                </h3>
                <p className="text-primary font-medium mb-3">
                  {item.company}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator className="mb-16" />

      {/* 博客理念 */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">博客理念</h2>
        <div className="bg-muted/50 rounded-lg p-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              "学而时习之，不亦说乎？" 我相信最好的学习方式就是分享和教学。
              通过写博客，我不仅能够巩固自己的知识，还能帮助其他开发者解决问题。
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              在这个快速发展的技术世界中，我希望通过分享我的经验和见解，
              与大家一起成长，一起探索编程的无限可能。
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Heart className="h-5 w-5" />
              <span className="font-medium">用心分享，共同成长</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// 生成元数据
export const metadata = {
  title: '关于我 - 个人博客',
  description: '了解更多关于我的信息，包括我的技能、经历和博客理念。',
};