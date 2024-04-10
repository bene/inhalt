import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

await prisma.project.create({
  data: {
    id: "eb9b2f94-88f0-4531-9103-209baba21c93",
    name: "hello-world",
  },
});
