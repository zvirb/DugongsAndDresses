export interface CharacterWithState {
    id: string;
    name: string;
    type: string;
    race: string | null;
    class: string | null;
    level: number;
    hp: number;
    maxHp: number;
    armorClass: number;
    speed: number;
    initiative: number;
    attributes: string;
    conditions: string;
    campaignId: string;
    activeTurn: boolean;
    initiativeRoll: number;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface LogEntry {
    id: string;
    content: string;
    type: string;
    timestamp: Date;
    campaignId: string;
}

export interface Campaign {
    id: string;
    name: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Encounter {
    id: string;
    name: string;
    status: string;
    participants: string;
    campaignId: string;
    createdAt: Date;
    updatedAt: Date;
}