import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() { const email = process.env.ADMIN_EMAIL || 'admin@example.com'; const password = process.env.ADMIN_PASSWORD || 'change-me-now'; const hash = await bcrypt.hash(password, 12); await prisma.user.upsert({ where:{email}, update:{passwordHash:hash}, create:{email,passwordHash:hash} }); const tags = await Promise.all(['archive','featured','experimental'].map(name=>prisma.tag.upsert({where:{name},update:{},create:{name}}))); const collection = await prisma.collection.upsert({where:{slug:'selected-works'},update:{},create:{name:'Selected Works',slug:'selected-works',description:'A small selection from the archive.',visibility:'PUBLIC'}}); console.log(`Seeded ${email}; collection ${collection.slug}; tags ${tags.length}. Change the default password before production.`); }
main().finally(()=>prisma.$disconnect());
