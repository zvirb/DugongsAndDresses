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
            imageUrl: '/avatars/fighter_male.png'
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
            imageUrl: '/avatars/wizard_female.png'
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
            imageUrl: '/avatars/rogue_male.png'
          }
        ]
      },
      logs: {
        create: [
          { content: 'Campaign started in the Whispering Woods.', type: 'Story' },
          { content: 'Valerius rolled a 15 for initiative!', type: 'Roll' },
          { content: 'A group of goblins ambushes the party!', type: 'Combat' }
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
