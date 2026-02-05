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
}

export interface LogEntry {
    id: string;
    content: string;
    type: string;
    timestamp: Date;
    campaignId: string;
}
