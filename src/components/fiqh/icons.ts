import { createElement } from "react";
import {
  BookOpen, HandHeart, Handshake, House, Landmark, Moon, Mosque, ScrollText, Sparkles, Star, Users, Utensils,
  type LucideIcon,
} from "lucide-react";

/** Category icon by JSON id (the app draws icons instead of the JSON emoji). */
const ICONS: Record<string, LucideIcon> = {
  aqeedah: Sparkles,
  "islam-pillars": Landmark,
  siyam: Moon,
  zakah: HandHeart,
  hajj: Mosque,
  muamalat: Handshake,
  atimah: Utensils,
  usrah: House,
  adab: Users,
  prophets: ScrollText,
  companions: Star,
};

export function FiqhIcon({ id, className }: { id: string; className?: string }) {
  return createElement(ICONS[id] ?? BookOpen, { className });
}
