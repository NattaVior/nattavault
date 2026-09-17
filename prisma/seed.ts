import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured before seeding.');
  }
  if (password.length < 8) throw new Error('ADMIN_PASSWORD must contain at least 8 characters.');

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, active: true, role: 'ADMIN' },
    create: { email, passwordHash: hash, active: true, role: 'ADMIN' },
  });
  const tags = await Promise.all(['archive', 'featured', 'experimental'].map((name) =>
    prisma.tag.upsert({ where: { name }, update: {}, create: { name } }),
  ));
  const collection = await prisma.collection.upsert({
    where: { slug: 'selected-works' },
    update: {},
    create: { name: 'Selected Works', slug: 'selected-works', description: 'A small selection from the archive.', visibility: 'PUBLIC' },
  });
  console.log(`Seeded ${email}; collection ${collection.slug}; tags ${tags.length}.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
