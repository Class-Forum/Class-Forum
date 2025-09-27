import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 在服务器端组件中使用环境变量
  serverRuntimeConfig: {
    // 在服务器端组件中可以通过 serverRuntimeConfig.DATABASE_URL 访问
  },
  // 在客户端组件中使用环境变量
  publicRuntimeConfig: {
    // 在客户端组件中可以通过 publicRuntimeConfig.NEXT_PUBLIC_SUPABASE_URL 访问
  }
};

export default nextConfig;
