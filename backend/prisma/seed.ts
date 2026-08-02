import { PrismaClient, Role, EventStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function genReferralCode(name: string) {
  return `${name.slice(0, 4).toUpperCase()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

async function main() {
  console.log('Seeding database...');

  // ---- Categories ----
  const categories = [];
  for (const name of [
    "Music",
    "Technology",
    "Business",
    "Sports",
    "Arts & Culture",
    "Food & Drink",
  ]) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
    });
    categories.push(category);
  }

  // ---- Cities ----
  const cities = [];
  for (const name of [
    "Jakarta",
    "Bandung",
    "Surabaya",
    "Yogyakarta",
    "Bali",
    "Pekanbaru",
  ]) {
    const city = await prisma.city.upsert({
      where: { name },
      update: {},
      create: { name, province: name, country: "Indonesia" },
    });
    cities.push(city);
  }

  // ---- Admin ----
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eventplatform.com' },
    update: {},
    create: {
      email: 'admin@eventplatform.com',
      password: adminPassword,
      fullName: 'Platform Admin',
      role: Role.ADMIN,
      isVerified: true,
      referralCode: genReferralCode('ADMIN'),
    },
  });

  // ---- Organizer ----
  const organizerPassword = await bcrypt.hash('Organizer123!', 10);
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@eventplatform.com' },
    update: {},
    create: {
      email: 'organizer@eventplatform.com',
      password: organizerPassword,
      fullName: 'Demo Organizer',
      role: Role.ORGANIZER,
      isVerified: true,
      referralCode: genReferralCode('ORGN'),
    },
  });

  // ---- Customer ----
  const customerPassword = await bcrypt.hash('Customer123!', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@eventplatform.com' },
    update: {},
    create: {
      email: 'customer@eventplatform.com',
      password: customerPassword,
      fullName: 'Demo Customer',
      role: Role.CUSTOMER,
      isVerified: true,
      referralCode: genReferralCode('CUST'),
    },
  });

  // ---- Sample Events ----
  const eventData = [
    {
      title: "Maroon 5 'Greatest Hits' Live at GBK",
      category: categories[0],
      city: cities[0],
      venue: "Gelora Bung Karno Stadium",
      isFree: false,
      price: 350000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785693064/marron5_z9kdqf.png",
    },
    {
      title: "Raisa 'Sebuah Opera Kehidupan' Jakarta Finale",
      category: categories[0],
      city: cities[0],
      venue: "Gelora Bung Karno Stadium",
      isFree: false,
      price: 400000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785693345/raisa-with-simphony_v7eshp.png",
    },
    {
      title: "The Script 'Greatest Hits' Live at GBK",
      category: categories[0],
      city: cities[0],
      venue: "Gelora Bung Karno Stadium",
      isFree: false,
      price: 380000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785693062/the-script_skk88v.png",
    },
    {
      title: "Taylor Swift 'The Eras Tour' Jakarta Finale",
      category: categories[0],
      city: cities[0],
      venue: "Gelora Bung Karno Stadium",
      isFree: false,
      price: 450000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785684515/events/taylor-swift-eras-tour.jpg",
    },
    {
      title: "My Chemical Romance Live in Jakarta",
      category: categories[0],
      city: cities[0],
      venue: "Jakarta International Stadium",
      isFree: false,
      price: 320000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785684502/events/my-chemical-romance.png",
    },
    {
      title: "BLACKPINK 'Born Pink' Special Final Show Jakarta",
      category: categories[0],
      city: cities[0],
      venue: "Gelora Bung Karno Stadium",
      isFree: false,
      price: 500000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785693063/blackpink-born-pink_tkfiuc.png",
    },
    {
      title: "BTS 'ARIRANG' World Tour Jakarta",
      category: categories[0],
      city: cities[0],
      venue: "Gelora Bung Karno Stadium",
      isFree: false,
      price: 480000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785693065/bts-arirang_aebc1n.png",
    },
    {
      title: "Isyana Saraswati 'Opera Maestro' Jakarta Grand Finale",
      category: categories[0],
      city: cities[0],
      venue: "Gelora Bung Karno Stadium",
      isFree: false,
      price: 420000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785693063/isyana-saraswati-opera_o6bwcg.png",
    },
    // ---- Technology Events ----
    {
      title: "Summit Inovasi Fintech Indonesia 2026: GOPAY Ekosistem",
      category: categories[1],
      city: cities[0],
      venue: "Gelora Bung Karno Stadium",
      isFree: false,
      price: 250000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785684478/events/gopay-summit-fintech.jpg",
    },
    {
      title: "KTT Inovasi GRAB Nusantara 2026: GRAB Ekosistem",
      category: categories[1],
      city: cities[0],
      venue: "Jakarta Convention Center",
      isFree: false,
      price: 280000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785684482/events/grab-summit-innovation.jpg",
    },
    {
      title: "Summit Inovasi Indonesia 2026: Tokopedia Nusantara",
      category: categories[1],
      city: cities[0],
      venue: "Gelora Bung Karno Stadium",
      isFree: false,
      price: 200000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785684526/events/tokopedia-summit-innovation.jpg",
    },
    // ---- Business & Startup Events ----
    {
      title: "Inovasi Global & Kemitraan Startup: GOPAY Ekosistem",
      category: categories[2],
      city: cities[0],
      venue: "Jakarta International Expo",
      isFree: false,
      price: 300000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785692731/gopay-startup-innovation_qxwwvd.png",
    },
    {
      title: "Inovasi Global & Kemitraan GRAB: Ekosistem Digital",
      category: categories[2],
      city: cities[0],
      venue: "Jakarta Convention Center",
      isFree: false,
      price: 320000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785692731/gopay-startup-innovation_qxwwvd.png",
    },
    {
      title: "Inovasi Global & Kemitraan Tokopedia: Startup Summit",
      category: categories[2],
      city: cities[0],
      venue: "Jakarta International Expo",
      isFree: false,
      price: 270000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785692731/tokopedia-startup-innovation_h4oa3u.png",
    },
    // ---- Sports Events ----
    {
      title: "Billiard · Golf · Padel Championship Jakarta & Bandung",
      category: categories[3],
      city: cities[0],
      venue: "Jakarta Sports Complex",
      isFree: false,
      price: 150000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785684472/events/billiard-golf-padel.png",
    },
    // ---- Arts & Culture Events ----
    {
      title: "Art & Seni 2025: Celebrate Creativity. Inspire Culture.",
      category: categories[4],
      city: cities[0],
      venue: "Jakarta Art Center",
      isFree: false,
      price: 180000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785684466/events/art-seni-culture.png",
    },
    {
      title: "Tech Summit Indonesia 2026",
      category: categories[1],
      city: cities[1],
      venue: "Bandung Convention Center",
      isFree: false,
      price: 500000,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785684521/events/tech-summit-indonesia.png",
    },
    // ---- Food & Drink Events ----
    {
      title: "Festival Kuliner Nusantara 2026: Cita Rasa Khas Indonesia",
      category: categories[5],
      city: cities[5],
      venue: "Pekanbaru Goverment Park",
      isFree: false,
      price: 0,
      bannerUrl:
        "https://res.cloudinary.com/kivc3ajv/image/upload/v1785684513/events/talamdurian.png",
    },
  ];

  for (const ev of eventData) {
    const slug = ev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const event = await prisma.event.upsert({
      where: { slug },
      update: {},
      create: {
        organizerId: organizer.id,
        title: ev.title,
        slug,
        description: `${ev.title} - an amazing event you don't want to miss. Join us for an unforgettable experience with great speakers, performers, and networking opportunities.`,
        bannerUrl: ev.bannerUrl,
        categoryId: ev.category.id,
        cityId: ev.city.id,
        venue: ev.venue,
        latitude: -6.2088,
        longitude: 106.8456,
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        endDate: new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 30 + 1000 * 60 * 60 * 6,
        ),
        isFree: ev.isFree,
        maxPurchase: 4,
        status: EventStatus.PUBLISHED,
        ticketTypes: {
          create: [
            {
              name: ev.isFree ? "Free Entry" : "Regular",
              price: ev.price,
              quota: 200,
            },
            ...(ev.isFree
              ? []
              : [
                  {
                    name: "VIP",
                    price: ev.price * 2,
                    quota: 50,
                  },
                ]),
          ],
        },
        images: {
          create: [
            {
              imageUrl:
                "https://media.istockphoto.com/id/1806011581/id/foto/orang-orang-muda-yang-bahagia-menari-melompat-dan-bernyanyi-selama-konser-grup-favorit.jpg?s=2048x2048&w=is&k=20&c=Tv40w8gzaz9jU0zGNLjfphZp3Shjj8DPQXdFRuuJ4Xo=",
              position: 0,
            },
          ],
        },
      },
    });
    console.log(`Created event: ${event.title}`);
  }

  console.log('Seed complete.');
  console.log('---- Demo Accounts ----');
  console.log('Admin:     admin@eventplatform.com / Admin123!');
  console.log('Organizer: organizer@eventplatform.com / Organizer123!');
  console.log('Customer:  customer@eventplatform.com / Customer123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
