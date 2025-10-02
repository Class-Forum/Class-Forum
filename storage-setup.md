# 文件上传配置指南

## 存储桶设置
需要在Supabase中创建存储桶来存储文件

## 创建存储桶步骤
1. 登录Supabase控制台 (supabase.com/dashboard)
2. 选择你的项目
3. 左侧菜单 → Storage → Buckets
4. 点击"New Bucket"
5. 名称: `files` （必须完全匹配）
6. 权限: Public
7. 点击"Create Bucket"

## 文件夹结构
在`files`存储桶中，文件将按类型存储到不同文件夹：
- **图片文件** → `photo/` 文件夹
- **音乐文件** → `music/` 文件夹

## 配置权限策略（重要！）
创建存储桶后，必须在"Policies"标签中配置以下策略：

### 必需策略：
1. **允许认证用户上传文件**
   ```sql
   CREATE POLICY "Allow authenticated uploads" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'files' AND auth.role() = 'authenticated');
   ```

2. **允许公开读取文件**
   ```sql
   CREATE POLICY "Allow public read access" ON storage.objects
   FOR SELECT USING (bucket_id = 'files');
   ```

### 可选策略：
3. **允许用户更新自己的文件**
4. **允许用户删除自己的文件**

**注意**：如果没有配置上传策略，会出现"row-level security policy"错误

## 测试上传
配置完成后，确保用户已登录，图片和音乐上传功能即可正常工作。