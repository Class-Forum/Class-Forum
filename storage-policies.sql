-- Supabase存储桶权限策略配置
-- 在Supabase SQL编辑器中执行以下语句

-- 1. 允许认证用户上传文件到files存储桶
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'files' AND auth.role() = 'authenticated');

-- 2. 允许所有人读取files存储桶中的文件
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'files');

-- 3. 允许用户更新自己上传的文件
CREATE POLICY "Allow users to update own files" ON storage.objects
FOR UPDATE USING (bucket_id = 'files' AND auth.uid() = owner);

-- 4. 允许用户删除自己上传的文件
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (bucket_id = 'files' AND auth.uid() = owner);

-- 检查策略是否生效
SELECT * FROM pg_policies WHERE tablename = 'objects';