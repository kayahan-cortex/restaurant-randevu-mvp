import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.table.count();
  if (count > 0) return;

  await prisma.table.createMany({
    data: [
      { name: "Masa 1", capacity: 2 },
      { name: "Masa 2", capacity: 2 },
      { name: "Masa 3", capacity: 4 },
      { name: "Masa 4", capacity: 4 },
      { name: "Masa 5", capacity: 6 },
    ],
  });

  console.log("Seed tamamlandı");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
