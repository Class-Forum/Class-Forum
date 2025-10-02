# 数据库初始化指南

## 问题描述
当前出现错误：`users表不存在`，需要初始化数据库。

## 解决方案

### 1. 配置环境变量
在项目根目录创建 `.env` 文件，包含以下内容：

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SECRET_KEY=你的Supabase服务密钥

# 数据库配置
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 2. 运行数据库迁移
在项目根目录执行以下命令：

```bash
npx prisma db push
```

这个命令会根据 `prisma/schema.prisma` 文件创建数据库表结构。

### 3. 验证数据库连接
运行以下命令检查数据库连接：

```bash
npx prisma db pull
```

### 4. 启动应用
数据库初始化完成后，重新启动应用：

```bash
npm run dev
```

## 数据库表结构
初始化后将创建以下表：
- `users` - 用户表
- `posts` - 帖子表  
- `categories` - 分类表
- `replies` - 回复表

## 故障排除

### 如果数据库连接失败：
1. 检查 `.env` 文件中的数据库URL是否正确
2. 确认Supabase项目状态正常
3. 检查网络连接

### 如果迁移失败：
1. 检查 `prisma/schema.prisma` 文件语法
2. 确认数据库用户有足够的权限
3. 查看详细的错误信息进行调试

## 注意事项
- 确保Supabase项目已正确配置
- 数据库操作会影响到生产数据，请谨慎操作
- 建议在开发环境先测试