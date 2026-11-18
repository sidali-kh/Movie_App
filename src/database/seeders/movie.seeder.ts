
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

import connectDB from "@/database/connection.js";
import Movie from "@/modules/app/movies/movie.model.js";
import User from "@/modules/app/users/user.model.js";

const MOVIES_COUNT = 50;

const languages = ["English", "Arabic", "French", "Spanish"] as const;

const genres = [
  "Action",
  "Comedy",
  "Drama",
  "Romance",
  "Thriller",
  "Horror",
  "Adventure",
  "Fantasy",
  "Science Fiction",
  "Animation",
] as const;

const statuses = ["Draft", "Pending", "Published", "Rejected"] as const;

type MovieLanguage = (typeof languages)[number];
type MovieGenre = (typeof genres)[number];

async function getOrCreateAuthor(): Promise<mongoose.Types.ObjectId> {
  let author = await User.findOne({ deletedAt: null }).select("_id email");

  if (!author) {
    const password = await bcrypt.hash("DevPassword123!", 12);

    author = await User.create({
      fullName: "Seed Author",
      email: "seed-author@example.com",
      password,
      role: "Author",
    });

    console.log(`Created development author: ${author.email}`);
  }

  return author._id;
}

function generateMovie(authorId: mongoose.Types.ObjectId) {
  const language: MovieLanguage = faker.helpers.arrayElement(languages);

  const selectedGenres: MovieGenre[] = faker.helpers.arrayElements(genres, {
    min: 1,
    max: 4,
  });

  const episodeCount = faker.number.int({ min: 1, max: 3 });

  const video = Array.from({ length: episodeCount }, (_, index) => ({
    episode: index + 1,
    fileUrl: [
      `https://example.com/videos/${faker.string.uuid()}.mp4`,
    ],
  }));

  const availableSubtitleLanguages = languages.filter(
    (item) => item !== language,
  );

  const subtitles = faker.helpers
    .arrayElements(availableSubtitleLanguages, {
      min: 1,
      max: 2,
    })
    .map((subtitleLanguage) => ({
      language: subtitleLanguage,
      fileUrl: `https://example.com/subtitles/${faker.string.uuid()}.vtt`,
    }));

  return {
    title: faker.lorem.words({ min: 2, max: 5 }),
    description: faker.lorem.paragraphs({ min: 1, max: 3 }),
    poster: `https://placehold.co/600x900?text=${encodeURIComponent(
      faker.lorem.words(2),
    )}`,
    video,
    language,
    genre: selectedGenres,
    subtitles,
    releaseYear: faker.number.int({
      min: 1988,
      max: new Date().getFullYear() + 1,
    }),
    duration: faker.number.int({
      min: 5 * 60,
      max: 3 * 60 * 60,
    }),
    author: authorId,
    status: faker.helpers.arrayElement(statuses),
    deletedAt: null,
  };
}

async function seedMovies(): Promise<void> {
  const action = process.argv[2];

  if (!["seed", "unseed"].includes(action)) {
    throw new Error("Invalid argument. Use: seed or unseed");
  }

  try {
    await connectDB();

    if (action === "seed") {
      const authorId = await getOrCreateAuthor();

      const movies = Array.from({ length: MOVIES_COUNT }, () =>
        generateMovie(authorId),
      );

      const inserted = await Movie.insertMany(movies);

      console.log(`Inserted ${inserted.length} movies.`);
    } else {
      const result = await Movie.deleteMany({});

      console.log(`Deleted ${result.deletedCount} movies.`);
    }
  } catch (error: unknown) {
    console.error("Movie operation failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await seedMovies();
