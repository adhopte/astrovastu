import type { Zone } from "../grid";
import type { RoomType, Rating } from "../rules";

export interface VastuContent {
  zoneNames: Record<Zone | "C", string>;
  zoneAttr: Record<Zone | "C", string>; // what the zone governs
  elements: Record<"water" | "air" | "fire" | "earth" | "space", string>;
  rooms: Record<RoomType, string>;
  ratings: Record<Rating, string>;
  finding: Record<Rating, (room: string, zone: string, attr: string) => string>;
  ideal: (room: string, zones: string) => string;
  roomRemedies: Record<RoomType, string>;
  elementRemedy: Record<"water" | "air" | "fire" | "earth" | "space", string>;
  centerRemedy: string;
  missing: (room: string) => string;
  verdict: { excellent: string; good: string; fair: string; poor: string };
  generalTips: string[];
  disclaimer: string;
  combined: {
    title: string;
    lagnaLordDir: (lord: string, dir: string) => string;
    dashaLordDir: (lord: string, dir: string) => string;
    elementDirs: (element: string, dirs: string) => string;
    sleepHead: (dir: string) => string;
    workFacing: (dir: string) => string;
    afflicted: (room: string, zone: string, lord: string) => string;
    supported: (room: string, zone: string, lord: string) => string;
    colorTip: (zone: string, color: string) => string;
    signElements: Record<"fire" | "earth" | "air" | "water", string>;
  };
}
