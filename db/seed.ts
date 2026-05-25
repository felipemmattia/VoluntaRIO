import { getDb } from "../api/queries/connection";
import { categories, platformStats } from "./schema";

const db = getDb();

async function seed() {
  console.log("Seeding VoluntaRIO database...");

  // Seed marine cause categories (parent categories)
  const parentCategories = [
    { name: "Limpeza de Oceanos", description: "Ações de remoção de lixo e poluentes dos oceanos, praias e costas", icon: "waves", color: "#0EA5E9" },
    { name: "Restauração de Recifes de Coral", description: "Projetos de cultivo, transplantio e monitoramento de corais", icon: "shell", color: "#F97316" },
    { name: "Proteção da Vida Marinha", description: "Conservação de espécies marinhas ameaçadas e seus habitats", icon: "fish", color: "#10B981" },
    { name: "Conservação Costeira", description: "Preservação de ecossistemas costeiros como manguezais e dunas", icon: "umbrella", color: "#8B5CF6" },
    { name: "Monitoramento de Poluição", description: "Vigilância e análise da qualidade da água e poluentes marinhos", icon: "eye", color: "#EF4444" },
  ];

  for (const cat of parentCategories) {
    await db.insert(categories).values(cat).onDuplicateKeyUpdate({
      set: { name: cat.name, description: cat.description },
    });
  }

  // Get inserted categories to create subcategories
  const insertedCategories = await db.select().from(categories);

  // Subcategories for each parent
  const subcategoriesData: Record<string, string[]> = {
    "Limpeza de Oceanos": [
      "Limpeza de Praias",
      "Limpeza de Fundo do Mar",
      "Coleta de Dejetos Plásticos",
      "Remoção de Redes Fantasmas",
    ],
    "Restauração de Recifes de Coral": [
      "Cultivo de Corais",
      "Transplante de Corais",
      "Monitoramento de Recifes",
      "Jardins de Corais",
    ],
    "Proteção da Vida Marinha": [
      "Proteção de Tartarugas",
      "Conservação de Golfinhos",
      "Preservação de Baleias",
      "Proteção de Peixes",
    ],
    "Conservação Costeira": [
      "Preservação de Manguezais",
      "Proteção de Dunas",
      "Restauração de Pauis",
      "Conservação de Lagoas Costeiras",
    ],
    "Monitoramento de Poluição": [
      "Análise de Qualidade da Água",
      "Monitoramento de Microplásticos",
      "Detecção de Derramamentos",
      "Avaliação de Impacto Ambiental",
    ],
  };

  for (const parent of insertedCategories) {
    const subs = subcategoriesData[parent.name];
    if (subs) {
      for (const subName of subs) {
        await db.insert(categories).values({
          name: subName,
          description: `${subName} - ação vinculada à categoria ${parent.name}`,
          parentId: parent.id,
          icon: parent.icon,
          color: parent.color,
        }).onDuplicateKeyUpdate({
          set: { name: subName },
        });
      }
    }
  }

  // Initialize platform stats
  await db.insert(platformStats).values({
    totalVolunteers: 0,
    totalOngs: 0,
    totalEvents: 0,
    totalEnrollments: 0,
  }).onDuplicateKeyUpdate({
    set: { totalVolunteers: 0 },
  });

  console.log("Seed completed successfully!");
}

seed().catch(console.error);
