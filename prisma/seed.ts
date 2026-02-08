import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import fs from 'fs'
import path from 'path'

// Define a template for character creation
interface CharacterTemplate {
  name: string
  type: 'PLAYER' | 'NPC'
  race: string
  class: string
  imageUrl: string
  hp: number
  maxHp: number
  armorClass: number
  initiative: number // Static bonus
  initiativeRoll: number // Initial roll for fun
  speed: number
  attributes: Record<string, number>
  activeTurn: boolean
  level?: number
}

const libraryCharacters: CharacterTemplate[] = [
  // --- Requested Characters ---
  {
    name: 'Galus Gallow',
    type: 'PLAYER',
    race: 'Human',
    class: 'Ranger',
    imageUrl: '/avatars/human_archer_male_1770268315511.png',
    hp: 11,
    maxHp: 11,
    armorClass: 14,
    initiative: 3,
    initiativeRoll: 0,
    speed: 30,
    attributes: { str: 9, dex: 16, con: 13, int: 11, wis: 14, cha: 14 },
    activeTurn: false,
    level: 1,
  },
  {
    name: 'Commander Samuel Vimes',
    type: 'PLAYER',
    race: 'Human',
    class: 'Fighter',
    imageUrl: '/avatars/fighter_male_1770266290109.png', // Rugged fighter
    hp: 13,
    maxHp: 13,
    armorClass: 18,
    initiative: 0,
    initiativeRoll: 0,
    speed: 30,
    attributes: { str: 16, dex: 10, con: 16, int: 9, wis: 14, cha: 10 },
    activeTurn: false,
    level: 1,
  },
  {
    name: 'Marco The Gallant',
    type: 'PLAYER',
    race: 'Human',
    class: 'Bard',
    imageUrl: '/avatars/bard_male_1770267480087.png',
    hp: 10,
    maxHp: 10,
    armorClass: 13,
    initiative: 2,
    initiativeRoll: 0,
    speed: 30,
    attributes: { str: 9, dex: 15, con: 14, int: 11, wis: 13, cha: 16 },
    activeTurn: false,
    level: 1,
  },
]

const campaignCharacters: CharacterTemplate[] = [
  {
    name: 'Valerius the Brave',
    type: 'PLAYER',
    race: 'Human',
    class: 'Paladin',
    imageUrl: '/avatars/fighter_male_1770266139273.png',
    hp: 28,
    maxHp: 32,
    armorClass: 18,
    initiative: 0,
    initiativeRoll: 15,
    speed: 30,
    attributes: { str: 16, dex: 10, con: 14, int: 10, wis: 12, cha: 15 },
    activeTurn: true,
    level: 3,
  },
  {
    name: 'Lyra Moonwhisper',
    type: 'PLAYER',
    race: 'Elf',
    class: 'Wizard',
    imageUrl: '/avatars/wizard_female_1770266180583.png',
    hp: 12,
    maxHp: 18,
    armorClass: 12,
    initiative: 2,
    initiativeRoll: 22,
    speed: 30,
    attributes: { str: 8, dex: 14, con: 12, int: 17, wis: 13, cha: 10 },
    activeTurn: false,
    level: 3,
  },
  {
    name: 'Goblin Grunt',
    type: 'NPC',
    race: 'Goblin',
    class: 'Scout',
    imageUrl: '/avatars/rogue_male_1770266194878.png',
    hp: 7,
    maxHp: 7,
    armorClass: 13,
    initiative: 2,
    initiativeRoll: 8,
    speed: 30,
    attributes: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    activeTurn: false,
    level: 1,
  },
]

async function main() {
  console.log('🕯️ Summoner: Starting seed process...')

  // Clear existing data
  await prisma.logEntry.deleteMany()
  await prisma.character.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.encounter.deleteMany()

  console.log('🧹 Cleared existing data.')

  // Create Library Campaign (Inactive)
  const library = await prisma.campaign.create({
    data: {
      name: 'Character Library',
      active: false,
      characters: {
        create: libraryCharacters.map(char => ({
          name: char.name,
          type: char.type,
          class: char.class,
          race: char.race,
          hp: char.hp,
          maxHp: char.maxHp,
          armorClass: char.armorClass,
          initiative: char.initiative,
          initiativeRoll: char.initiativeRoll,
          speed: char.speed,
          activeTurn: char.activeTurn,
          imageUrl: char.imageUrl,
          attributes: JSON.stringify(char.attributes),
          level: char.level || 1,
        }))
      }
    }
  })

  console.log(`📚 Created Library with ${libraryCharacters.length} presets.`)

  // Create Active Campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'The Shadow of Everdawn',
      active: true,
      characters: {
        create: campaignCharacters.map((char) => ({
          name: char.name,
          type: char.type,
          class: char.class,
          race: char.race,
          hp: char.hp,
          maxHp: char.maxHp,
          armorClass: char.armorClass,
          initiative: char.initiative,
          initiativeRoll: char.initiativeRoll,
          speed: char.speed,
          activeTurn: char.activeTurn,
          imageUrl: char.imageUrl,
          attributes: JSON.stringify(char.attributes),
          level: char.level || 1,
        })),
      },
      logs: {
        create: [
          { content: 'Campaign started in the Whispering Woods.', type: 'Story' },
          { content: 'Valerius rolled a 15 for initiative!', type: 'Roll' },
          { content: 'A group of goblins ambushes the party!', type: 'Combat' },
        ],
      },
    },
  })

  console.log(`🎉 Campaign "${campaign.name}" created with ${campaignCharacters.length} characters.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
