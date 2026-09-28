import { ZONES, Zone, ZoneOrCenter } from "./grid";

export const ROOM_TYPES = ["entrance", "living", "dining", "kitchen", "masterBedroom", "bedroom", "toilet", "pooja", "study", "staircase", "store"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

//                        N  NNE NE ENE  E ESE SE SSE  S SSW SW WSW  W WNW NW NNW   C
const TABLE: Record<RoomType, number[]> = {
  entrance:      [ 2,  2,  1,  1,  2, -1, -1,  0, -1, -2, -2, -1,  1, -1,  0,  1, -2],
  living:        [ 2,  1,  2,  1,  2,  0,  0,  0,  0, -1, -1,  0,  1,  1,  2,  1,  1],
  dining:        [ 0,  0,  0,  1,  1,  0,  1,  1,  0,  0, -1,  1,  2,  1,  1,  0,  0],
  kitchen:       [-2, -2, -2, -1,  0,  1,  2,  2,  1, -1, -2, -1,  0,  0,  1, -1, -2],
  masterBedroom: [ 0, -1, -2, -1,  0, -1, -1,  0,  1,  0,  2,  1,  1, -1,  0,  1, -2],
  bedroom:       [ 1,  0, -1,  0,  1, -1, -1,  0,  1,  0,  1,  2,  2,  1,  2,  1, -2],
  toilet:        [-1, -2, -2, -1, -1,  2, -1, -1, -1,  2, -2,  1,  0,  2,  0, -1, -2],
  pooja:         [ 1,  2,  2,  2,  2,  0, -1, -1, -1, -2, -2, -1,  0, -1, -1,  0,  1],
  study:         [ 1,  1,  1,  1,  2,  0,  0,  0,  0, -1,  0,  2,  2,  0,  0,  0, -1],
  staircase:     [-2, -2, -2, -1, -1,  0,  0,  1,  2,  2,  2,  1,  2,  0,  0, -1, -2],
  store:         [-1, -1, -2, -1, -1,  0,  0,  0,  1,  1,  2,  1,  1,  1,  1,  0, -1],
};

export type Rating = "excellent" | "good" | "neutral" | "avoid" | "bad";
const RATING: Record<number, Rating> = { 2: "excellent", 1: "good", 0: "neutral", [-1]: "avoid", [-2]: "bad" };

export function scoreFor(room: RoomType, zone: ZoneOrCenter): number {
  const idx = zone === "C" ? 16 : ZONES.indexOf(zone);
  return TABLE[room][idx];
}

export const ratingFor = (score: number): Rating => RATING[score];

export function idealZones(room: RoomType): Zone[] {
  return ZONES.filter((_, i) => TABLE[room][i] === 2);
}

/** Rooms whose placement matters most for the overall score. */
export const ROOM_WEIGHT: Record<RoomType, number> = {
  entrance: 1.5, kitchen: 1.5, masterBedroom: 1.5, toilet: 1.5, pooja: 1.25,
  living: 1, dining: 0.75, bedroom: 1, study: 1, staircase: 1, store: 0.5,
};
