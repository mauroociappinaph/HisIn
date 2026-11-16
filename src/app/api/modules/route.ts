import { NextResponse } from "next/server";
import { ModuleRepository } from "@/modules/modules/repository";

export async function GET() {
  const repo = new ModuleRepository();
  const modules = await repo.findAll();
  return NextResponse.json(modules);
}
