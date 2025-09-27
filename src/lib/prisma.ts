import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  console.log('DATABASE_URL from process.env:', process.env.DATABASE_URL)
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

// 检查环境变量是否存在
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL environment variable is not set')
  console.log('Available env vars:', Object.keys(process.env))
} else {
  console.log('DATABASE_URL found in environment variables')
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma