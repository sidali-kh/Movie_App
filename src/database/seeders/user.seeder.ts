
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

import connectDB from "@/database/connection.js";
import User from "@/modules/app/users/user.model.js";

const USERS_COUNT = 20;

const roles = ["Admin", "Author", "Client"] as const;

function generateUsers(passwordHash: string) {
  return Array.from({ length: USERS_COUNT }, () => ({
    fullName: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: passwordHash,

    // Generate a phone number with a maximum of 15 digits.
    phone: faker.helpers.maybe(
      () => faker.string.numeric({ length: 10 }),
      { probability: 0.7 }
    ),

    role: faker.helpers.arrayElement(roles),
    deletedAt: null,
  }));
}

async function seedUsers(): Promise<void> {
  const action = process.argv[2];

  if (!["seed", "unseed"].includes(action)) {
    throw new Error("Invalid argument. Use: seed or unseed");
  }

  try {
    await connectDB();

    if (action === "seed") {
      const passwordHash = await bcrypt.hash("DevPassword123!", 12);
      const users = generateUsers(passwordHash);

      const inserted = await User.insertMany(users);

      console.log(`Inserted ${inserted.length} users.`);
      console.log("Development password for seeded users: DevPassword123!");
    } else {
      // Deletes all users, including soft-deleted users.
      const result = await User.deleteMany({});

      console.log(`Deleted ${result.deletedCount} users.`);
    }
  } catch (error: unknown) {
    console.error("User operation failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await seedUsers();
