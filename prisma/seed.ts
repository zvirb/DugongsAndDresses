import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.logEntry.deleteMany()
  await prisma.character.deleteMany()
  await prisma.campaign.deleteMany()

  // Create Example Campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'The Shadow of Everdawn',
      active: true,
      characters: {
        create: [
          // Original Characters (Updated Images)
          {
            name: 'Valerius the Brave',
            type: 'PLAYER',
            class: 'Paladin',
            race: 'Human',
            hp: 28,
            maxHp: 32,
            armorClass: 18,
            initiativeRoll: 15,
            activeTurn: true,
            imageUrl: '/avatars/fighter_male_1770266139273.png'
          },
          {
            name: 'Lyra Moonwhisper',
            type: 'PLAYER',
            class: 'Wizard',
            race: 'Elf',
            hp: 12,
            maxHp: 18,
            armorClass: 12,
            initiativeRoll: 22,
            activeTurn: false,
            imageUrl: '/avatars/wizard_female_1770266180583.png'
          },
          {
            name: 'Goblin Grunt',
            type: 'NPC',
            class: 'Scout',
            race: 'Goblin',
            hp: 7,
            maxHp: 7,
            armorClass: 13,
            initiativeRoll: 8,
            activeTurn: false,
            imageUrl: '/avatars/rogue_male_1770266194878.png'
          },
          // New Characters
          {
            name: 'Thorne Ironfoot',
            type: 'PLAYER',
            class: 'Fighter',
            race: 'Dwarf',
            hp: 35,
            maxHp: 35,
            armorClass: 17,
            initiativeRoll: 10,
            activeTurn: false,
            imageUrl: '/avatars/dwarf_fighter_male_1770268439402.png'
          },
          {
            name: 'Elara Swiftwind',
            type: 'PLAYER',
            class: 'Ranger',
            race: 'Elf',
            hp: 24,
            maxHp: 24,
            armorClass: 15,
            initiativeRoll: 18,
            activeTurn: false,
            imageUrl: '/avatars/elf_archer_female_1770268263008.png'
          },
          {
            name: 'Kaelen the Bard',
            type: 'PLAYER',
            class: 'Bard',
            race: 'Human',
            hp: 20,
            maxHp: 20,
            armorClass: 14,
            initiativeRoll: 14,
            activeTurn: false,
            imageUrl: '/avatars/bard_male_1770267480087.png'
          },
          {
            name: 'Grom the Barbarian',
            type: 'NPC',
            class: 'Barbarian',
            race: 'Human',
            hp: 45,
            maxHp: 45,
            armorClass: 14,
            initiativeRoll: 12,
            activeTurn: false,
            imageUrl: '/avatars/fantasy_barbarian_male_1770266807624.png'
          },
          {
            name: 'Malakor the Dark',
            type: 'NPC',
            class: 'Wizard',
            race: 'Human',
            hp: 40,
            maxHp: 40,
            armorClass: 16,
            initiativeRoll: 20,
            activeTurn: false,
            imageUrl: '/avatars/fantasy_wizard_male_1770266844095.png'
          }
        ]
      },
      logs: {
        create: [
          { content: 'Campaign started in the Whispering Woods.', type: 'Story' },
          { content: 'Valerius rolled a 15 for initiative!', type: 'Roll' },
          { content: 'A group of goblins ambushes the party!', type: 'Combat' },
          { content: 'Thorne grumbles about the lack of ale.', type: 'Story' },
          { content: 'Malakor watches from the shadows...', type: 'Story' }
        ]
      }
    }
  })

  console.log({ campaign })
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
