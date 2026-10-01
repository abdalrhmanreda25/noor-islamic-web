"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MutashabihatTabs({ labels, groups, all }: { labels: [string, string]; groups: ReactNode; all: ReactNode }) {
  return (
    <Tabs defaultValue="groups">
      <TabsList className="mb-4 w-full sm:w-fit">
        <TabsTrigger value="groups" className="px-4">{labels[0]}</TabsTrigger>
        <TabsTrigger value="all" className="px-4">{labels[1]}</TabsTrigger>
      </TabsList>
      <TabsContent value="groups">{groups}</TabsContent>
      <TabsContent value="all">{all}</TabsContent>
    </Tabs>
  );
}
