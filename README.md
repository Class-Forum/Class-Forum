# 班级论坛系统

这是一个使用Next.js构建的班级论坛系统，部署在Vercel上，使用Supabase作为数据库服务。

## 功能特性

- 用户注册和登录
- 发布帖子
- 回复帖子
- 帖子分类
- 帖子搜索
- 响应式设计

## 技术栈

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- Supabase PostgreSQL数据库

## 本地开发环境搭建

1. 克隆项目代码
2. 安装依赖:
   ```bash
   npm install
   ```
3. 配置Supabase数据库:
   - 在Supabase上创建一个新的项目
   - 获取数据库连接信息
   - 在项目根目录创建 `.env.local` 文件，添加以下内容:
     ```
     DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE_NAME]?schema=public
     ```
4. 生成Prisma客户端:
   ```bash
   npx prisma generate
   ```
5. 运行数据库迁移:
   ```bash
   npx prisma migrate dev --name init
   ```
6. 启动开发服务器:
   ```bash
   npm run dev
   ```

## 部署到Vercel

1. 将代码推送到GitHub仓库
2. 在Vercel上连接您的GitHub账户
3. 选择要部署的仓库
4. 在项目设置的Environment Variables中添加 `DATABASE_URL`
5. 触发部署

## 数据库设计

数据库包含以下表:
- User (用户)
- Category (分类)
- Post (帖子)
- Reply (回复)

## API接口

- `GET /api/posts` - 获取所有帖子
- `POST /api/posts` - 创建新帖子
- `GET /api/posts/[id]/replies` - 获取特定帖子的回复
- `POST /api/posts/[id]/replies` - 为特定帖子添加回复
- `POST /api/auth/register` - 用户注册

## 学习资源

- [Next.js文档](https://nextjs.org/docs)
- [Prisma文档](https://www.prisma.io/docs/)
- [Supabase文档](https://supabase.com/docs)