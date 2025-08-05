import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: await bcrypt.hash('password123', 12),
      businessName: 'Test Singr Venue',
      phoneNumber: '+1-555-0123',
    },
  })

  // Create Stripe customer for test user
  const customer = await prisma.customer.upsert({
    where: { id: testUser.id },
    update: {},
    create: {
      id: testUser.id,
      stripeCustomerId: 'cus_test_customer_id',
    },
  })

  // Create test venues
  const venue1 = await prisma.venue.create({
    data: {
      name: 'The Singing Spot',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postalCode: '90210',
      country: 'US',
      latitude: 34.0522,
      longitude: -118.2437,
    },
  })

  const venue2 = await prisma.venue.create({
    data: {
      name: 'Karaoke Corner',
      address: '456 Music Ave',
      city: 'Nashville',
      state: 'TN',
      postalCode: '37201',
      country: 'US',
      latitude: 36.1627,
      longitude: -86.7816,
    },
  })

  // Create venue relationships
  const venueRel1 = await prisma.venueRelationship.create({
    data: {
      userId: testUser.id,
      venueId: venue1.id,
      displayName: 'My Main Venue',
      urlName: 'main-venue',
      acceptingRequests: true,
    },
  })

  const venueRel2 = await prisma.venueRelationship.create({
    data: {
      userId: testUser.id,
      venueId: venue2.id,
      displayName: 'Nashville Location',
      urlName: 'nashville-spot',
      acceptingRequests: false,
    },
  })

  // Create API key for test user
  const apiKeyHash = await bcrypt.hash('test-api-key-123456789', 12)
  await prisma.apiKey.create({
    data: {
      customerId: customer.id,
      description: 'Test API Key for Singr Connect',
      apiKeyHash,
      status: 'active',
    },
  })

  // Create sample songs
  const sampleSongs = [
    { artist: 'Queen', title: 'Bohemian Rhapsody' },
    { artist: 'Journey', title: "Don't Stop Believin'" },
    { artist: 'ABBA', title: 'Dancing Queen' },
    { artist: 'Neil Diamond', title: 'Sweet Caroline' },
    { artist: 'Garth Brooks', title: 'Friends In Low Places' },
  ]

  for (const song of sampleSongs) {
    const combined = `${song.artist} - ${song.title}`
    await prisma.songDb.create({
      data: {
        userId: testUser.id,
        systemId: 0,
        artist: song.artist,
        title: song.title,
        combined,
        normalizedCombined: combined.toLowerCase(),
      },
    })
  }

  // Create sample requests
  await prisma.request.create({
    data: {
      venueRelationshipId: venueRel1.id,
      systemId: 0,
      artist: 'The Beatles',
      title: 'Hey Jude',
      singer: 'John Doe',
      keyChange: 0,
    },
  })

  await prisma.request.create({
    data: {
      venueRelationshipId: venueRel1.id,
      systemId: 0,
      artist: 'Elvis Presley',
      title: 'Can\'t Help Falling in Love',
      singer: 'Jane Smith',
      keyChange: 2,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('📧 Test user email: test@example.com')
  console.log('🔑 Test user password: password123')
  console.log('🗝️  Test API key: test-api-key-123456789')
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