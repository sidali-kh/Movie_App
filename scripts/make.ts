
import {
  mkdir,
  writeFile,
  access,
} from "node:fs/promises";
import path from "node:path";

type GeneratorType = "controller" | "model" | "routes" | "service";

const generators: GeneratorType[] = [
  "controller",
  "model",
  "routes",
  "service",
];

function toPascalCase(value: string): string {
  return value
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function singularize(value: string): string {
  if (value.endsWith("ies")) {
    return `${value.slice(0, -3)}y`;
  }

  if (value.endsWith("s") && !value.endsWith("ss")) {
    return value.slice(0, -1);
  }

  return value;
}

function getTemplate(
  type: GeneratorType,
  resource: string,
  singular: string,
): string {
  const pascal = toPascalCase(singular);
  const modelName = `${pascal}Model`;

  switch (type) {
    case "controller":
      return `import type { Request, Response } from "express";

export function get${pascal}List(
  _req: Request,
  res: Response,
): void {
  res.status(501).json({
    message: "Implement get${pascal}List",
  });
}
`;

    case "model":
      return `import mongoose, { Schema } from "mongoose";

const ${singular}Schema = new Schema(
  {},
  { timestamps: true },
);

const ${modelName} = mongoose.model(
  "${pascal}",
  ${singular}Schema,
);

export default ${modelName};
`;

    case "routes":
      return `import { Router } from "express";
import { get${pascal}List } from "./${resource}.controller.js";

const router = Router();

router.get("/", get${pascal}List);

export default router;
`;

    case "service":
      return `// Implement the ${resource} business logic here.

export {};
`;
  }
}

async function createFile(
  type: GeneratorType,
  resource: string,
): Promise<void> {
  const singular = singularize(resource);
  const directory = path.resolve(
    process.cwd(),
    "src",
    "modules",
    resource,
  );

  const filename =
    type === "model"
      ? `${singular}.model.ts`
      : `${resource}.${type}.ts`;

  const filePath = path.join(directory, filename);

  await mkdir(directory, { recursive: true });

  try {
    await access(filePath);
    console.error(`Already exists: ${filePath}`);
    process.exitCode = 1;
    return;
  } catch {
    // The file doesn't exist, so creation can continue.
  }

  const content = getTemplate(type, resource, singular);

  await writeFile(filePath, content, { flag: "wx" });

  console.log(`Created: ${path.relative(process.cwd(), filePath)}`);
}

async function main(): Promise<void> {
  const [type, input] = process.argv.slice(2);

  if (
    !type ||
    !input ||
    !/^[a-z][a-z0-9_-]*$/.test(input)
  ) {
    throw new Error(
      "Usage: npm run make -- <controller|model|routes|service|module> <resource>",
    );
  }

  const resource = input.toLowerCase();

  if (type === "module") {
    for (const generator of generators) {
      await createFile(generator, resource);
    }

    return;
  }

  if (!generators.includes(type as GeneratorType)) {
    throw new Error(`Unknown generator: ${type}`);
  }

  await createFile(type as GeneratorType, resource);
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
