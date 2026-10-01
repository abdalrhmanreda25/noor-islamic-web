"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Two server-rendered panels behind tabs; the open tab is kept in the hash. */
export function AsbabTabs({ labels, topics, surahs }: { labels: [string, string]; topics: ReactNode; surahs: ReactNode }) {
  return (
    <Tabs defaultValue="topics">
      <TabsList className="mb-4 w-full sm:w-fit">
        <TabsTrigger value="topics" className="px-4">{labels[0]}</TabsTrigger>
        <TabsTrigger value="surahs" className="px-4">{labels[1]}</TabsTrigger>
      </TabsList>
      <TabsContent value="topics">{topics}</TabsContent>
      <TabsContent value="surahs">{surahs}</TabsContent>
    </Tabs>
  );
}
