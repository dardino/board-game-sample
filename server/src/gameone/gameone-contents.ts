export interface Abilities {
  intelligence: number;
  strenght: number;
  agility: number;
}
export interface WeaponBonus {
  phisic: number;
  magic: number;
}
export interface Weapon {
  ability: keyof Abilities;
  range: number;
  dice: number;
  damageType: keyof WeaponBonus;
}
export interface Wearables {
  attacks: Weapon[];
  armor: Armor | null;
  charm: Array<Armor | WeaponBonus>;
}
export interface Armor {
  magic: number;
  phisic: number;
}
export const Connections = ["TL", "TR", "R", "BR", "BL", "L"] as const;
export type Connections = (typeof Connections)[number];

export interface Tile {
  id: number;
  description: string;
  type: "Room" | "Boss" | "Start";
  enemies: null | Array<Enemy["enemyClass"]>;
  ring: 0 | 1 | 2 | 3;
  conections: Connections[];
}

export interface Character extends Abilities, Wearables {
  characterId: number;
  characterClass: string;

  lifeMax: number;
  energyMax: number;
  startingLife: number;
  startingEnergy: number;

  movementSpeed: number;
  defence: number;

  spells: Weapon[];
}

export const WEAPONS = {
  FIST: {
    ability: "strenght",
    damageType: "phisic",
    dice: 4,
    range: 0,
  },
  DAGGER: {
    ability: "strenght",
    damageType: "phisic",
    dice: 6,
    range: 0,
  },
  SWORD: {
    ability: "strenght",
    damageType: "phisic",
    dice: 8,
    range: 0,
  },
  AXE: {
    ability: "strenght",
    damageType: "phisic",
    dice: 8,
    range: 0,
  },
  ARC: {
    ability: "agility",
    damageType: "phisic",
    dice: 6,
    range: 2,
  },
  FIREBALL: {
    ability: "intelligence",
    damageType: "magic",
    dice: 6,
    range: 1,
  },
} as const satisfies { [key: string]: Weapon };

export const CHARACTERS: Character[] = [
  {
    characterId: 1,
    characterClass: "Chierico",

    lifeMax: 7,
    energyMax: 10,
    startingLife: 7,
    startingEnergy: 5,

    movementSpeed: 2,
    defence: 1,

    intelligence: 3,
    strenght: 2,
    agility: 1,

    armor: { magic: 2, phisic: 0 },
    attacks: [WEAPONS.FIST, WEAPONS.FIST],
    charm: [],
    spells: [WEAPONS.FIREBALL],
  },
  {
    characterId: 2,
    characterClass: "Barbaro",

    lifeMax: 8,
    energyMax: 10,
    startingLife: 8,
    startingEnergy: 5,

    movementSpeed: 2,
    defence: 1,

    intelligence: 1,
    strenght: 3,
    agility: 2,

    armor: { magic: 0, phisic: 2 },
    attacks: [WEAPONS.FIST, WEAPONS.FIST],
    charm: [],
    spells: [WEAPONS.FIREBALL],
  },
  {
    characterId: 3,
    characterClass: "Mago",

    lifeMax: 7,
    energyMax: 10,
    startingLife: 7,
    startingEnergy: 5,

    movementSpeed: 2,
    defence: 1,

    intelligence: 3,
    strenght: 1,
    agility: 2,

    armor: { magic: 0, phisic: 2 },
    attacks: [WEAPONS.FIST, WEAPONS.FIST],
    charm: [],
    spells: [WEAPONS.FIREBALL],
  },
  {
    characterId: 4,
    characterClass: "Ladro",

    lifeMax: 7,
    energyMax: 10,
    startingLife: 7,
    startingEnergy: 5,

    movementSpeed: 2,
    defence: 1,

    intelligence: 2,
    strenght: 1,
    agility: 3,

    armor: { magic: 0, phisic: 2 },
    attacks: [WEAPONS.FIST, WEAPONS.FIST],
    charm: [],
    spells: [WEAPONS.FIREBALL],
  },
] as const;

const connectionSchemas = {
  // 6 connections:
  AllConnections: ["TL", "TR", "R", "L", "BR", "BL"],
  // 5 connections:
  AllButOneConnections: ["TL", "TR", "R", "L", "BR"],
  // 4 connections:
  XConnections: ["TL", "TR", "BR", "BL"],
  ForkConnections: ["TL", "TR", "R", "BR"],
  // 3 connections:
  StarConnections: ["TL", "R", "BR"],
  YLConnections: ["TL", "TR", "L"],
  YRConnections: ["TL", "TR", "R"],
  // 2 connections:
  Near: ["TL", "TR"],
  Jump1: ["TL", "R"],
  Opposite: ["L", "R"],
  // 1 connections:
  OneConnection: ["TL"],
} as const satisfies { [key: string]: Array<Connections> };
export const STARTING_TILES: Tile[] = [
  {
    description: "Partenza",
    id: 0,
    type: "Start",
    enemies: null,
    ring: 0,
    conections: connectionSchemas.AllConnections.slice(),
  },
];
export const BOSS_TILES: Tile[] = [
  {
    description: "Boss Tile",
    id: 9999,
    type: "Boss",
    enemies: ["Boss"],
    ring: 3,
    conections: ["L"],
  },
];
export const OTHER_TILES: Tile[] = [
  {
    id: 1,
    description: "Corridoio",
    type: "Room",
    enemies: null,
    ring: 1,
    conections: ["TL", "R", "BR"],
  },
  {
    id: 2,
    description: "Stanza",
    type: "Room",
    enemies: null,
    ring: 1,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 3,
    description: "Stanza",
    type: "Room",
    enemies: null,
    ring: 1,
    conections: ["TL", "TR", "BR", "BL"],
  },
  {
    id: 4,
    description: "Corridoio",
    type: "Room",
    enemies: null,
    ring: 1,
    conections: ["TL", "R", "BR"],
  },
  {
    id: 5,
    description: "Corridoio",
    type: "Room",
    enemies: null,
    ring: 1,
    conections: ["TL"],
  },
  {
    id: 6,
    description: "Stanza",
    type: "Room",
    enemies: null,
    ring: 1,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 7,
    description: "Stanza",
    type: "Room",
    enemies: null,
    ring: 1,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 8,
    description: "Corridoio",
    type: "Room",
    enemies: ["Base"],
    ring: 1,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 9,
    description: "Corridoio",
    type: "Room",
    enemies: ["Base", "Base"],
    ring: 1,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 10,
    description: "Stanza",
    type: "Room",
    enemies: ["Base"],
    ring: 1,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 11,
    description: "Stanza",
    type: "Room",
    enemies: ["Base"],
    ring: 1,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 12,
    description: "Corridoio",
    type: "Room",
    enemies: ["Base", "Base"],
    ring: 1,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 13,
    description: "Corridoio",
    type: "Room",
    enemies: ["Base"],
    ring: 1,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 14,
    description: "Stanza",
    type: "Room",
    enemies: ["Base"],
    ring: 1,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 15,
    description: "Stanza",
    type: "Room",
    enemies: null,
    ring: 1,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 16,
    description: "Corridoio",
    type: "Room",
    enemies: null,
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 17,
    description: "Corridoio",
    type: "Room",
    enemies: null,
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 18,
    description: "Stanza",
    type: "Room",
    enemies: null,
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 19,
    description: "Stanza",
    type: "Room",
    enemies: null,
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 20,
    description: "Stanza",
    type: "Room",
    enemies: null,
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 21,
    description: "Stanza",
    type: "Room",
    enemies: null,
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 22,
    description: "Corridoio",
    type: "Room",
    enemies: ["Base", "Base"],
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 23,
    description: "Corridoio",
    type: "Room",
    enemies: ["Base", "Base"],
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 24,
    description: "Stanza",
    type: "Room",
    enemies: ["Base"],
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 25,
    description: "Stanza",
    type: "Room",
    enemies: ["Base"],
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 26,
    description: "Corridoio",
    type: "Room",
    enemies: ["Base"],
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 27,
    description: "Corridoio",
    type: "Room",
    enemies: ["Base", "Base"],
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 28,
    description: "Stanza",
    type: "Room",
    enemies: ["Base"],
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 29,
    description: "Stanza",
    type: "Room",
    enemies: ["Advanced", "Base"],
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 30,
    description: "Stanza",
    type: "Room",
    enemies: ["Advanced", "Advanced"],
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 31,
    description: "Stanza",
    type: "Room",
    enemies: ["Advanced"],
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 32,
    description: "Corridoio",
    enemies: ["Advanced"],
    type: "Room",
    ring: 2,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 33,
    description: "Corridoio",
    type: "Room",
    enemies: null,
    ring: 3,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 34,
    description: "Stanza",
    type: "Room",
    enemies: null,
    ring: 3,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 35,
    description: "Stanza",
    type: "Room",
    enemies: null,
    ring: 3,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 36,
    description: "Corridoio",
    type: "Room",
    enemies: ["Advanced"],
    ring: 3,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 37,
    description: "Corridoio",
    type: "Room",
    enemies: ["Advanced", "Base"],
    ring: 3,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 38,
    description: "Stanza",
    type: "Room",
    enemies: ["Advanced", "Advanced"],
    ring: 3,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
  {
    id: 39,
    description: "Stanza",
    type: "Room",
    enemies: ["Advanced"],
    ring: 3,
    conections: ["TL", "TR", "R", "L", "BR", "BL"],
  },
];

export interface Enemy extends Wearables {
  enemyClass: "Base" | "Advanced" | "Boss";

  name: string;

  life: number;
  movementSpeed: number;
}

export const BASE_ENEMIES: Enemy[] = [
  {
    name: "Goblin 1",
    armor: null,
    attacks: [WEAPONS.SWORD],
    charm: [],
    enemyClass: "Base",
    life: 4,
    movementSpeed: 2,
  },
  {
    name: "Goblin 2",
    armor: {
      magic: 0,
      phisic: 2,
    },
    attacks: [WEAPONS.SWORD],
    charm: [],
    enemyClass: "Base",
    life: 4,
    movementSpeed: 1,
  },
  {
    name: "Goblin 3",
    armor: {
      magic: 1,
      phisic: 1,
    },
    attacks: [WEAPONS.SWORD],
    charm: [],
    enemyClass: "Base",
    life: 5,
    movementSpeed: 1,
  },
];

export const ADVANCED_ENEMIES: Enemy[] = [
  {
    name: "Undead 1",
    armor: null,
    attacks: [WEAPONS.AXE],
    charm: [],
    enemyClass: "Advanced",
    life: 7,
    movementSpeed: 2,
  },
  {
    name: "Undead 2",
    armor: {
      magic: 0,
      phisic: 2,
    },
    attacks: [WEAPONS.AXE],
    charm: [],
    enemyClass: "Advanced",
    life: 7,
    movementSpeed: 1,
  },
  {
    name: "Undead 3",
    armor: {
      magic: 1,
      phisic: 1,
    },
    attacks: [WEAPONS.AXE],
    charm: [],
    enemyClass: "Advanced",
    life: 8,
    movementSpeed: 1,
  },
];

export const BOSS_ENEMIES: Enemy[] = [
  {
    name: "BigBoss",
    enemyClass: "Boss",
    movementSpeed: 3,
    armor: {
      magic: 4,
      phisic: 4,
    },
    attacks: [WEAPONS.SWORD, WEAPONS.FIREBALL],
    charm: [],
    life: 15,
  },
];
