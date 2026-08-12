import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const catalog = [
  {
    name: "Hostile — Rifle",
    kind: "hostile",
    modelRef: "targets/hostile_rifle",
    defaultAppearance: { skinVariant: "default", outfitVariant: "tac_black", weaponVariant: "rifle" },
  },
  {
    name: "Hostile — Handgun",
    kind: "hostile",
    modelRef: "targets/hostile_handgun",
    defaultAppearance: { skinVariant: "default", outfitVariant: "civilian_dark", weaponVariant: "handgun" },
  },
  {
    name: "Hostile — Concealed (draws on trigger)",
    kind: "hostile",
    modelRef: "targets/hostile_concealed",
    defaultAppearance: { skinVariant: "default", outfitVariant: "civilian_jacket", weaponVariant: null },
  },
  {
    name: "Hostage",
    kind: "hostage",
    modelRef: "targets/hostage",
    defaultAppearance: { skinVariant: "default", outfitVariant: "civilian_light", weaponVariant: null },
  },
  {
    name: "Non-threat — Bystander",
    kind: "nonThreat",
    modelRef: "targets/bystander",
    defaultAppearance: { skinVariant: "default", outfitVariant: "civilian_casual", weaponVariant: null },
  },
];

async function main() {
  for (const entry of catalog) {
    const existing = await prisma.targetDefinition.findFirst({ where: { name: entry.name } });
    if (existing) continue;
    await prisma.targetDefinition.create({
      data: {
        name: entry.name,
        kind: entry.kind,
        modelRef: entry.modelRef,
        defaultAppearanceJson: JSON.stringify(entry.defaultAppearance),
      },
    });
  }
  console.log(`Seeded ${catalog.length} target definitions (idempotent).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
