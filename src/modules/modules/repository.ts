import { prisma } from "@/shared/db/prisma";
import type { ModuleDTO } from "@/shared/types";

export class ModuleRepository {
  async findAll(): Promise<ModuleDTO[]> {
    const rows = await prisma.module.findMany({ orderBy: { order: "asc" } });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      icon: r.icon,
      order: r.order,
    }));
  }

  async findBySlug(slug: string): Promise<ModuleDTO | null> {
    const r = await prisma.module.findUnique({ where: { slug } });
    if (!r) return null;
    return { id: r.id, slug: r.slug, name: r.name, description: r.description, icon: r.icon, order: r.order };
  }
}
