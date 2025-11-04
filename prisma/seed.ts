import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')
  
  // Hash password for admin user
  const adminPassword = await bcrypt.hash('admin123', 12)

  // Only create the admin user - remove all fake supervisors and students
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@university.edu' },
    update: {},
    create: {
      id: 'admin-1',
      name: 'CIS Admin',
      email: 'admin@university.edu',
      role: 'ADMIN',
      passwordHash: adminPassword,
    },
  })

  // Create Admin profile
  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
    },
  })

  console.log('✅ Admin user created:', adminUser.email)
  console.log('🎉 Database seeded successfully!')
  console.log('')
  console.log('📋 Login credentials:')
  console.log('   Admin: admin@university.edu / admin123')
  console.log('')
  console.log('💡 Register real supervisors and students using the signup form')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })