import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

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
}

const characterTemplates: CharacterTemplate[] = [
  // --- Players ---
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
  },
  {
    name: 'Kaelen Strongbow',
    type: 'PLAYER',
    race: 'Elf',
    class: 'Ranger',
    imageUrl: '/avatars/elf_archer_male_1770268242137.png',
    hp: 24,
    maxHp: 24,
    armorClass: 15,
    initiative: 3,
    initiativeRoll: 18,
    speed: 35,
    attributes: { str: 12, dex: 16, con: 12, int: 10, wis: 14, cha: 8 },
    activeTurn: false,
  },
  {
    name: 'Thorgar Ironfist',
    type: 'PLAYER',
    race: 'Dwarf',
    class: 'Fighter',
    imageUrl: '/avatars/dwarf_fighter_male_1770268439402.png',
    hp: 35,
    maxHp: 35,
    armorClass: 17,
    initiative: -1,
    initiativeRoll: 10,
    speed: 25,
    attributes: { str: 17, dex: 8, con: 16, int: 10, wis: 12, cha: 8 },
    activeTurn: false,
  },
  {
    name: 'Elara Swiftfoot',
    type: 'PLAYER',
    race: 'Halfling',
    class: 'Rogue',
    imageUrl: '/avatars/hobbit_female_1770268009102.png',
    hp: 18,
    maxHp: 18,
    armorClass: 14,
    initiative: 4,
    initiativeRoll: 20,
    speed: 25,
    attributes: { str: 8, dex: 17, con: 12, int: 12, wis: 10, cha: 14 },
    activeTurn: false,
  },
  {
    name: 'Seraphina Lightbringer',
    type: 'PLAYER',
    race: 'Human',
    class: 'Cleric',
    imageUrl: '/avatars/cleric_female_1770266235967.png',
    hp: 22,
    maxHp: 22,
    armorClass: 16,
    initiative: 0,
    initiativeRoll: 12,
    speed: 30,
    attributes: { str: 12, dex: 10, con: 14, int: 10, wis: 16, cha: 12 },
    activeTurn: false,
  },
  {
    name: 'Grommash the Unyielding',
    type: 'PLAYER',
    race: 'Orc',
    class: 'Barbarian',
    imageUrl: '/avatars/fantasy_barbarian_male_1770266807624.png',
    hp: 40,
    maxHp: 40,
    armorClass: 14,
    initiative: 1,
    initiativeRoll: 14,
    speed: 40,
    attributes: { str: 18, dex: 12, con: 16, int: 8, wis: 10, cha: 8 },
    activeTurn: false,
  },
  {
    name: 'Finnegan the Fool',
    type: 'PLAYER',
    race: 'Human',
    class: 'Bard',
    imageUrl: '/avatars/jester_male_1770267240604.png',
    hp: 18,
    maxHp: 18,
    armorClass: 13,
    initiative: 3,
    initiativeRoll: 16,
    speed: 30,
    attributes: { str: 10, dex: 14, con: 12, int: 12, wis: 10, cha: 16 },
    activeTurn: false,
  },
  {
    name: 'Arineth of the Woods',
    type: 'PLAYER',
    race: 'Elf',
    class: 'Druid',
    imageUrl: '/avatars/elf_female_1770267651052.png',
    hp: 20,
    maxHp: 20,
    armorClass: 13,
    initiative: 2,
    initiativeRoll: 13,
    speed: 35,
    attributes: { str: 10, dex: 14, con: 12, int: 12, wis: 16, cha: 10 },
    activeTurn: false,
  },
  {
    name: 'Doric Stonehewer',
    type: 'PLAYER',
    race: 'Dwarf',
    class: 'Cleric',
    imageUrl: '/avatars/cleric_male_1770266221119.png',
    hp: 25,
    maxHp: 25,
    armorClass: 18,
    initiative: -1,
    initiativeRoll: 8,
    speed: 25,
    attributes: { str: 14, dex: 8, con: 16, int: 10, wis: 15, cha: 10 },
    activeTurn: false,
  },

  // --- NPCs / Enemies ---
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
  },
  {
    name: 'Bandit Leader',
    type: 'NPC',
    race: 'Human',
    class: 'Rogue',
    imageUrl: '/avatars/thief_male_1770267752047.png',
    hp: 30,
    maxHp: 30,
    armorClass: 15,
    initiative: 3,
    initiativeRoll: 17,
    speed: 30,
    attributes: { str: 12, dex: 16, con: 12, int: 12, wis: 10, cha: 14 },
    activeTurn: false,
  },
  {
    name: 'Forest Nymph',
    type: 'NPC',
    race: 'Fey',
    class: 'Nymph',
    imageUrl: '/avatars/nymph_female_1770267925456.png',
    hp: 15,
    maxHp: 15,
    armorClass: 12,
    initiative: 4,
    initiativeRoll: 19,
    speed: 30,
    attributes: { str: 10, dex: 18, con: 10, int: 12, wis: 14, cha: 18 },
    activeTurn: false,
  },
  {
    name: 'Dwarven Merchant',
    type: 'NPC',
    race: 'Dwarf',
    class: 'Merchant',
    imageUrl: '/avatars/dwarf_mage_male_1770268698293.png',
    hp: 20,
    maxHp: 20,
    armorClass: 11,
    initiative: 0,
    initiativeRoll: 5,
    speed: 25,
    attributes: { str: 12, dex: 10, con: 14, int: 14, wis: 14, cha: 12 },
    activeTurn: false,
  },
  {
    name: 'Elven Guide',
    type: 'NPC',
    race: 'Elf',
    class: 'Ranger',
    imageUrl: '/avatars/elf_male_1770267634807.png',
    hp: 22,
    maxHp: 22,
    armorClass: 14,
    initiative: 3,
    initiativeRoll: 16,
    speed: 35,
    attributes: { str: 10, dex: 16, con: 10, int: 12, wis: 14, cha: 10 },
    activeTurn: false,
  },
  {
    name: 'Dark Wizard',
    type: 'NPC',
    race: 'Human',
    class: 'Wizard',
    imageUrl: '/avatars/fantasy_wizard_male_1770266844095.png',
    hp: 25,
    maxHp: 25,
    armorClass: 12,
    initiative: 2,
    initiativeRoll: 21,
    speed: 30,
    attributes: { str: 8, dex: 14, con: 12, int: 18, wis: 12, cha: 10 },
    activeTurn: false,
  },
  {
    name: 'Fairy Trickster',
    type: 'NPC',
    race: 'Fey',
    class: 'Rogue',
    imageUrl: '/avatars/fairy_female_1770267946577.png',
    hp: 10,
    maxHp: 10,
    armorClass: 15,
    initiative: 5,
    initiativeRoll: 23,
    speed: 40,
    attributes: { str: 4, dex: 20, con: 10, int: 12, wis: 10, cha: 16 },
    activeTurn: false,
  },
  {
    name: 'Town Guard',
    type: 'NPC',
    race: 'Human',
    class: 'Fighter',
    imageUrl: '/avatars/fighter_male_1770266261627.png',
    hp: 25,
    maxHp: 25,
    armorClass: 16,
    initiative: 1,
    initiativeRoll: 10,
    speed: 30,
    attributes: { str: 14, dex: 12, con: 14, int: 10, wis: 10, cha: 10 },
    activeTurn: false,
  },
  {
    name: 'Tavern Keeper',
    type: 'NPC',
    race: 'Dwarf',
    class: 'Commoner',
    imageUrl: '/avatars/dwarf_archer_male_1770268667839.png',
    hp: 30,
    maxHp: 30,
    armorClass: 10,
    initiative: 0,
    initiativeRoll: 4,
    speed: 25,
    attributes: { str: 12, dex: 10, con: 14, int: 12, wis: 12, cha: 14 },
    activeTurn: false,
  },
  {
    name: 'Mysterious Stranger',
    type: 'NPC',
    race: 'Human',
    class: 'Rogue',
    imageUrl: '/avatars/rogue_female_1770266208126.png',
    hp: 20,
    maxHp: 20,
    armorClass: 14,
    initiative: 3,
    initiativeRoll: 18,
    speed: 30,
    attributes: { str: 10, dex: 16, con: 12, int: 14, wis: 12, cha: 14 },
    activeTurn: false,
  },

  // --- New Additions (Summoner) ---
  {
    name: 'Helga Ironheart',
    type: 'NPC',
    race: 'Dwarf',
    class: 'Ranger',
    imageUrl: '/avatars/dwarf_archer_female_1770268683214.png',
    hp: 28,
    maxHp: 28,
    armorClass: 16,
    initiative: 2,
    initiativeRoll: 12,
    speed: 25,
    attributes: { str: 14, dex: 14, con: 16, int: 10, wis: 14, cha: 10 },
    activeTurn: false,
  },
  {
    name: 'Zephyr the Wind Lord',
    type: 'NPC',
    race: 'Elemental',
    class: 'Sorcerer',
    imageUrl: '/avatars/nymph_male_1770267906487.png',
    hp: 60,
    maxHp: 60,
    armorClass: 15,
    initiative: 5,
    initiativeRoll: 20,
    speed: 50, // Fast because wind
    attributes: { str: 10, dex: 18, con: 14, int: 14, wis: 12, cha: 20 },
    activeTurn: false,
  },
  {
    name: 'Kaelen Sunwalker',
    type: 'NPC', // Could be a high level NPC
    race: 'Elf',
    class: 'Wizard',
    imageUrl: '/avatars/elf_male_1770267781103.png',
    hp: 45,
    maxHp: 45,
    armorClass: 12,
    initiative: 3,
    initiativeRoll: 18,
    speed: 30,
    attributes: { str: 8, dex: 14, con: 12, int: 20, wis: 14, cha: 16 },
    activeTurn: false,
  },
  {
    name: 'Isolde the Shadow',
    type: 'NPC',
    race: 'Human',
    class: 'Rogue',
    imageUrl: '/avatars/thief_female_1770267844778.png',
    hp: 35,
    maxHp: 35,
    armorClass: 16,
    initiative: 4,
    initiativeRoll: 22,
    speed: 35,
    attributes: { str: 10, dex: 18, con: 12, int: 14, wis: 10, cha: 14 },
    activeTurn: false,
  },
  {
    name: 'Krag the Wild',
    type: 'PLAYER', // Let's make him a player option
    race: 'Human',
    class: 'Barbarian',
    imageUrl: '/avatars/barbarian_archer_male_1770268280543.png',
    hp: 42,
    maxHp: 42,
    armorClass: 15, // Unarmored defense
    initiative: 2,
    initiativeRoll: 14,
    speed: 40,
    attributes: { str: 18, dex: 14, con: 16, int: 8, wis: 10, cha: 10 },
    activeTurn: false,
  },
  {
    name: 'Lila the Songbird',
    type: 'PLAYER',
    race: 'Human',
    class: 'Bard',
    imageUrl: '/avatars/bard_female_1770267498918.png',
    hp: 18,
    maxHp: 18,
    armorClass: 13,
    initiative: 3,
    initiativeRoll: 15,
    speed: 30,
    attributes: { str: 8, dex: 16, con: 12, int: 12, wis: 10, cha: 18 },
    activeTurn: false,
  },
]

async function main() {
  console.log('🕯️ Summoner: Starting seed process...')

  // Clear existing data
  await prisma.logEntry.deleteMany()
  await prisma.character.deleteMany()
  await prisma.campaign.deleteMany()

  console.log('🧹 Cleared existing data.')

  // Validate and Filter Characters
  const validCharacters = characterTemplates.filter((char) => {
    const relativePath = char.imageUrl.startsWith('/')
      ? `public${char.imageUrl}`
      : `public/${char.imageUrl}`

    const fullPath = path.join(process.cwd(), relativePath)

    if (fs.existsSync(fullPath)) {
      return true
    } else {
      console.warn(`⚠️ Warning: Image not found for ${char.name} at ${relativePath}. Skipping.`)
      return false
    }
  })

  console.log(`✅ Validated ${validCharacters.length} characters.`)

  // Create Campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'The Shadow of Everdawn',
      active: true,
      characters: {
        create: validCharacters.map((char) => ({
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
        })),
      },
      logs: {
        create: [
          { content: 'Campaign started in the Whispering Woods.', type: 'Story' },
          { content: 'Valerius rolled a 15 for initiative!', type: 'Roll' },
          { content: 'A group of goblins ambushes the party!', type: 'Combat' },
          { content: 'The Tavern Keeper eyes the strangers suspiciously.', type: 'Story' },
        ],
      },
    },
  })

  console.log(`🎉 Campaign "${campaign.name}" created with ${validCharacters.length} characters.`)
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
