import type { Metadata } from "next";
import { Schedule } from "@/components/schedule";
import { getCategories, getEvents } from "@/lib/data";

export const metadata: Metadata = { title: "Cronograma" };

export default async function SchedulePage() {
  const [events, categories] = await Promise.all([getEvents(), getCategories()]);
  return <Schedule events={events} categories={categories.filter((c) => c.kind === "evento")} />;
}
