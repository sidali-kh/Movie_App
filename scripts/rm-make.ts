
import {
  access,
  readdir,
  unlink,
  rmdir,
} from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

type GeneratorType =
  | "controller"
  | "model"
  | "routes"
  | "service";

const generators: GeneratorType[] = [
  "controller",
  "model",
  "routes",
  "service",
];

function singularize(value: string): string {
  if (value.endsWith("ies")) {
    return `${value.slice(0, -3)}y`;
  }

  if (value.endsWith("s") && !value.endsWith("ss")) {
    return value.slice(0, -1);
  }

  return value;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const [type, input] = process.argv.slice(2);

  if (
    !type ||
    !input ||
    !/^[a-z][a-z0-9_-]*$/.test(input)
  ) {
    throw new Error(
      "Usage: npm run rm:make -- <controller|model|routes|service|module> <resource>",
    );
  }

  if (
    type !== "module" &&
    !generators.includes(type as GeneratorType)
  ) {
    throw new Error(`Unknown generator: ${type}`);
  }

  const resource = input.toLowerCase();
  const singular = singularize(resource);

  const directory = path.resolve(
    process.cwd(),
    "src",
    "modules",
    resource,
  );

  const files = (
    type === "module" ? generators : [type as GeneratorType]
  ).map((generator) => {
    const filename =
      generator === "model"
        ? `${singular}.model.ts`
        : `${resource}.${generator}.ts`;

    return path.join(directory, filename);
  });

  const existingFiles: string[] = [];

  for (const file of files) {
    if (await exists(file)) {
      existingFiles.push(file);
    }
  }

  if (existingFiles.length === 0) {
    console.log("No matching generated files found.");
    return;
  }

  console.log("The following files will be deleted:");

  for (const file of existingFiles) {
    console.log(`  ${path.relative(process.cwd(), file)}`);
  }

  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const answer = await rl.question(
      "Continue? Type yes to confirm: ",
    );

    if (answer.trim().toLowerCase() !== "yes") {
      console.log("Cancelled.");
      return;
    }
  } finally {
    rl.close();
  }

  for (const file of existingFiles) {
    await unlink(file);
    console.log(`Deleted: ${path.relative(process.cwd(), file)}`);
  }

  // Remove the module directory only if it is now empty.
  try {
    const remaining = await readdir(directory);

    if (remaining.length === 0) {
      await rmdir(directory);
      console.log("Removed empty module directory.");
    }
  } catch {
    // The directory may already be absent.
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
