import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FIRST_NAMES = [
  "Alice", "Bob", "Chloe", "David", "Emma", "Farid", "Gaelle", "Hugo",
  "Ines", "Julien", "Kenza", "Louis", "Maya", "Nathan", "Olivia", "Paul",
  "Quentin", "Rania", "Sacha", "Théo", "Uma", "Victor", "Wassim", "Yasmine",
  "Zoe", "Adam", "Bianca", "Camille", "Diego", "Elise",
];

const LAST_NAMES = [
  "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Petit", "Durand",
  "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia",
  "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel",
];

const CAPTIONS = [
  "Belle journée aujourd'hui !",
  "Petit café du matin ☕",
  "On a testé un nouveau resto hier soir",
  "Balade en montagne ce week-end",
  "Nouvelle recette maison, verdict dans les commentaires",
  "Session code toute la nuit",
  "Coucher de soleil incroyable",
  "Retour de vacances, dur dur",
  "Nouveau projet en préparation",
  "Petit moment tranquille",
  "Sortie entre amis",
  "Premier jour dans le nouvel appart",
  "Séance de sport terminée",
  "Concert de folie hier",
  "Journée dans le jardin",
];

const COMMENT_TEXTS = [
  "Trop bien !",
  "J'adore",
  "Magnifique",
  "Tu étais où exactement ?",
  "Ça donne envie",
  "Superbe photo",
  "On y va quand ?",
  "Haha nice",
  "Ça a l'air top",
  "Bravo !",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateWithinMonths(months: number): Date {
  const now = Date.now();
  const past = now - months * 30 * 24 * 60 * 60 * 1000;
  return new Date(randomInt(past, now));
}

function randomSubset<T>(arr: T[], max: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  const count = randomInt(0, Math.min(max, shuffled.length));
  return shuffled.slice(0, count);
}

async function main() {
  console.log("Cleaning database...");
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");
  const commonPassword = bcrypt.hashSync("password123", 10);

  const fixedUsers = [
    { email: "alice@test.com", username: "alice", password: commonPassword },
    { email: "bob@test.com", username: "bob", password: commonPassword },
    {
      email: "admin@test.com",
      username: "admin",
      password: commonPassword,
      role: "ADMIN" as const,
    },
  ];

  const users = [];
  for (const data of fixedUsers) {
    users.push(await prisma.user.create({ data }));
  }

  for (let i = 0; i < 47; i++) {
    const first = randomItem(FIRST_NAMES);
    const last = randomItem(LAST_NAMES);
    const username = `${first.toLowerCase()}${randomInt(1, 999)}`;
    const email = `${username}@test.com`;

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: commonPassword,
      },
    });
    users.push(user);
  }

  console.log(`Created ${users.length} users`);

  console.log("Creating posts...");
  const posts = [];
  for (let i = 0; i < 500; i++) {
    const author = randomItem(users);
    const hasImage = Math.random() < 0.6;
    const imageIndex = String(randomInt(1, 20)).padStart(2, "0");

    const post = await prisma.post.create({
      data: {
        content: randomItem(CAPTIONS),
        imageUrl: hasImage ? `/seed-images/img-${imageIndex}.jpg` : null,
        authorId: author.id,
        createdAt: randomDateWithinMonths(6),
      },
    });
    posts.push(post);

    if (i % 50 === 0) {
      console.log(`  ${i}/500 posts created`);
    }
  }

  console.log("Creating comments and likes...");
  for (const post of posts) {
    const commentCount = randomInt(0, 5);
    for (let c = 0; c < commentCount; c++) {
      const commenter = randomItem(users);
      await prisma.comment.create({
        data: {
          content: randomItem(COMMENT_TEXTS),
          postId: post.id,
          authorId: commenter.id,
          createdAt: new Date(post.createdAt.getTime() + randomInt(60000, 5 * 24 * 60 * 60 * 1000)),
        },
      });
    }

    const likers = randomSubset(users, 25);
    for (const liker of likers) {
      await prisma.like.create({
        data: {
          postId: post.id,
          userId: liker.id,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
