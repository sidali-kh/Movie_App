# 🎬 Movie API

A RESTful backend API designed to power a Netflix-inspired frontend application. The project is built with **Node.js, Express 5, TypeScript, and MongoDB**, with an emphasis on modular architecture, security, testing, and API documentation.

The long-term goal is to provide a complete backend for managing movies, user accounts, authentication, reviews, and related resources.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technologies](#technologies)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Project Architecture](#project-architecture)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Documentation](#documentation)
- [Security](#security)
- [Development Workflow](#development-workflow)
- [Roadmap](#roadmap)

## Project Overview

Movie API is a backend project intended to provide the core services required by a movie-streaming platform.

The API follows a modular, feature-oriented architecture that separates HTTP routing, request handling, business logic, database operations, validation, and shared middleware.

This separation makes the codebase easier to maintain, test, document, and extend as new features are introduced.

## Features

### Current foundation

- Express 5 application setup.
- TypeScript development environment.
- ES modules using Node.js ESM.
- Development server with automatic restarts.
- JSON request-body parsing.
- Basic security headers with Helmet.
- Cross-origin resource sharing with CORS.
- Health-check endpoint.
- OpenAPI documentation with Swagger UI.
- Jest and Supertest testing environment.
- TypeScript compilation and type-checking scripts.

### Planned application features

- User registration and login.
- Password hashing and secure authentication.
- JWT-based authentication and role-based authorization.
- Movie creation, retrieval, updating, and deletion.
- Movie categories, filtering, sorting, pagination, and field selection.
- User reviews and ratings.
- MongoDB persistence with Mongoose.
- Request validation and centralized error handling.
- Rate limiting and protection against common web attacks.
- Image uploads and storage with Cloudinary.
- Email notifications and password recovery.
- Database seeders for development and testing.

## Technologies

| Technology    | Purpose                                          |
| ------------- | ------------------------------------------------ |
| Node.js       | JavaScript runtime                               |
| Express 5     | HTTP server and routing                          |
| TypeScript    | Static typing and maintainable code              |
| MongoDB       | NoSQL database                                   |
| Mongoose      | MongoDB object modeling                          |
| dotenv        | Environment configuration                        |
| Helmet        | HTTP security headers                            |
| CORS          | Cross-origin request handling                    |
| Jest          | Automated testing                                |
| Supertest     | HTTP endpoint testing                            |
| SWC           | TypeScript/JavaScript transformation for tests   |
| Swagger UI    | Interactive API documentation                    |
| swagger-jsdoc | Generate OpenAPI specifications from annotations |
| JSDoc         | Source-code documentation                        |
| Git           | Version control                                  |

Additional dependencies are intended for authentication, validation, rate limiting, sanitization, file uploads, and email services.

## Requirements

Install the following before starting:

- **Node.js** — use a version compatible with the project's dependencies.
- **npm** — installed with Node.js.
- **Git** — recommended for version control.
- **MongoDB** — required when database-backed features are implemented.

Check your environment:

```bash
node --version
npm --version
git --version
```

## Installation

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd Movie_App
```

Replace `<YOUR_REPOSITORY_URL>` with your actual repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root. See [Environment Configuration](#environment-configuration).

### 4. Start the development server

```bash
npm run dev
```

The API should be available at:

```text
http://localhost:3000
```

## Environment Configuration

Store configuration and secrets in environment variables instead of hardcoding them in application source files.

Example `.env`:

```env
PORT=3000
NODE_ENV=development

MONGODB_URI=mongodb://127.0.0.1:27017/movie_api

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

**Important:** The MongoDB and JWT variables are intended for upcoming database and authentication features. They may not yet be consumed by the current application.

Never commit `.env` to version control. Provide an `.env.example` file containing placeholder values instead.

Recommended `.gitignore` entries:

```gitignore
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
docs/code/
```

## Running the Application

### Development

Start the server with automatic restarts:

```bash
npm run dev
```

### Production build

Compile the TypeScript source:

```bash
npm run build
```

Run the compiled application:

```bash
npm start
```

### Type-checking

Check application and test TypeScript configurations:

```bash
npm run typecheck
```

### Available npm scripts

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Run the development server with `tsx watch` |
| `npm run build`      | Compile TypeScript with `tsc`               |
| `npm start`          | Start the compiled production server        |
| `npm run typecheck`  | Check application and test types            |
| `npm test`           | Run the Jest test suite                     |
| `npm run test:watch` | Run tests in watch mode                     |

## Project Architecture

The project uses a **feature-oriented architecture**. Related files are grouped by domain, while shared infrastructure remains in dedicated folders.

```text
Movie_App/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── swagger.ts
│   │
│   ├── database/
│   │   ├── connection.ts
│   │   └── seeders/
│   │       ├── user.seeder.ts
│   │       ├── movie.seeder.ts
│   │       └── review.seeder.ts
│   │
│   ├── middleware/
│   │   ├── protect.ts
│   │   ├── authorize.ts
│   │   ├── validate.ts
│   │   ├── errorHandler.ts
│   │   ├── notFound.ts
│   │   └── rateLimiter.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── movies/
│   │   └── reviews/
│   │
│   ├── routes/
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── express.d.ts
│   │   └── api.types.ts
│   │
│   ├── utils/
│   │   ├── ApiError.ts
│   │   ├── catchAsync.ts
│   │   └── pagination.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── scripts/
│   └── seed.ts
│
├── docs/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tsconfig.test.json
└── README.md
```

*Note: This tree represents the intended architecture. Folders and files should be added as the corresponding features are implemented.*

### Responsibilities of each layer

**`config/`**

Contains application configuration, environment-variable validation, and Swagger/OpenAPI setup.

**`database/`**

Contains database connection logic and seeders for populating the database with development or test data.

**`middleware/`**

Contains reusable request-processing functions, including authentication, authorization, validation, rate limiting, and error handling.

**`modules/`**

Contains feature-specific functionality. Each module groups the files required for one domain.

For example:

```text
modules/movies/
├── movie.model.ts
├── movie.types.ts
├── movie.validation.ts
├── movie.controller.ts
├── movie.service.ts
└── movie.routes.ts
```

- `movie.model.ts`: Defines the Mongoose schema and model.
- `movie.types.ts`: Defines TypeScript types associated with movies.
- `movie.validation.ts`: Validates incoming request data.
- `movie.controller.ts`: Handles HTTP requests and responses.
- `movie.service.ts`: Implements business logic and database operations.
- `movie.routes.ts`: Maps HTTP methods and paths to controllers and middleware.

**`routes/`**

Combines feature routers under a common API prefix, keeping the main application entry point clean.

**`types/`**

Stores shared TypeScript declarations and application-wide types.

**`utils/`**

Contains reusable helpers such as custom API errors, asynchronous error handling, and pagination utilities.

**`app.ts`**

Configures Express, registers middleware, mounts API routes, and exposes the application for testing.

**`server.ts`**

Starts the HTTP server and handles startup-related configuration.

**`tests/`**

Separates unit tests, integration tests, and reusable test fixtures from production code.

### Request lifecycle

A typical request flows through the following layers:

```text
Client
  │
  ▼
Express Application
  │
  ▼
Global Middleware
  │
  ▼
API Router
  │
  ▼
Feature Routes
  │
  ▼
Validation / Authentication
  │
  ▼
Controller
  │
  ▼
Service
  │
  ▼
Mongoose Model
  │
  ▼
MongoDB
```

The controller handles HTTP concerns, the service contains business logic, and the model handles database interactions. Not every endpoint requires every layer.

## API Endpoints

### Health check

| Method | Endpoint      | Purpose                          |
| ------ | ------------- | -------------------------------- |
| GET    | `/api/health` | Check whether the API is running |

Example request:

```bash
curl http://localhost:3000/api/health
```

Example response:

```json
{
  "status": "success",
  "message": "Movie API is running"
}
```

### Planned endpoint groups

The following endpoints describe the intended API design; they are not a claim that these routes already exist.

| Method | Endpoint                | Purpose                      |
| ------ | ----------------------- | ---------------------------- |
| POST   | `/api/v1/auth/register` | Register a user              |
| POST   | `/api/v1/auth/login`    | Authenticate a user          |
| GET    | `/api/v1/movies`        | Retrieve movies              |
| GET    | `/api/v1/movies/:id`    | Retrieve a movie             |
| POST   | `/api/v1/movies`        | Create a movie               |
| PATCH  | `/api/v1/movies/:id`    | Update selected movie fields |
| DELETE | `/api/v1/movies/:id`    | Delete a movie               |
| GET    | `/api/v1/reviews`       | Retrieve reviews             |
| POST   | `/api/v1/reviews`       | Create a review              |

Authentication and authorization requirements will depend on the endpoint and user role.

## Testing

The project uses Jest for the test runner and Supertest for HTTP integration tests.

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Type-check the test files

```bash
npx tsc -p tsconfig.test.json
```

### Recommended testing strategy

**Unit tests**

Test individual functions and business logic independently, such as validation helpers, pagination, and service logic.

**Integration tests**

Test HTTP endpoints and the interaction between routes, middleware, controllers, and services using Supertest.

**Database tests**

When database-backed features are implemented, test database operations using a dedicated test database or an isolated test database instance.

**Authentication tests**

Verify successful authentication, invalid credentials, missing or invalid tokens, and role-based access restrictions.

Tests should be repeatable and should not depend on production data.

## Documentation

### Swagger / OpenAPI

Interactive API documentation is available at:

```text
http://localhost:3000/api-docs
```

The generated OpenAPI specification is available at:

```text
http://localhost:3000/api-docs.json
```

Swagger documentation is generated using `swagger-jsdoc` and displayed through `swagger-ui-express`.

Document endpoints with annotations describing:

- HTTP methods and paths.
- Request parameters and request bodies.
- Authentication requirements.
- Response schemas and status codes.
- Relevant examples.

Swagger documents the **public HTTP API**, rather than the entire internal source code.

### JSDoc

JSDoc can generate HTML documentation from supported JavaScript source files and JSDoc comments.

Use it to document functions, parameters, return values, and internal utilities where appropriate.

The current JSDoc experiment documents a JavaScript utility. Full TypeScript-source documentation requires additional configuration or a compatible documentation tool.

### TypeScript type checking

Type checking is handled independently of API documentation and JavaScript bundling:

```bash
npm run typecheck
```

## Security

The project includes or plans to include several security measures.

- **Helmet:** Sets security-related HTTP headers.
- **CORS:** Controls which origins may access the API.
- **Input validation:** Validates request bodies, query parameters, and route parameters.
- **Password hashing:** Uses bcryptjs when account authentication is implemented.
- **JWT authentication:** Verifies tokens for protected routes.
- **Role-based authorization:** Restricts sensitive operations according to user roles.
- **Rate limiting:** Reduces abuse of endpoints.
- **NoSQL injection protection:** Reduces risks from malicious MongoDB query input.
- **XSS protection:** Sanitizes relevant untrusted input where appropriate.
- **HTTP parameter pollution protection:** Handles duplicated query parameters.
- **Environment variables:** Keeps secrets and environment-specific configuration outside source code.
- **Centralized error handling:** Produces consistent error responses without exposing internal details.

Security middleware must be configured according to each package's documentation and tested against the actual application. No single middleware guarantees complete protection.

## Development Workflow

The recommended workflow is:

1. Create or update a feature module.
2. Define its types and request validation.
3. Implement database models where needed.
4. Add business logic to the service layer.
5. Implement controller functions.
6. Register routes and relevant middleware.
7. Add Swagger annotations.
8. Write unit and integration tests.
9. Run type checking and the test suite.
10. Build and test the production application.

Useful commands:

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm start
```

The project currently uses TypeScript compilation with `tsc` for its production build and `tsx` for development. Jest and Swagger remain separate parts of the development workflow.

## Roadmap

- [x] Initialize the Express and TypeScript application.
- [x] Configure ES modules.
- [x] Add security headers and CORS.
- [x] Add the health-check endpoint.
- [x] Configure Swagger/OpenAPI.
- [x] Set up Jest and Supertest.
- [ ] Implement and validate environment configuration.
- [ ] Connect MongoDB with Mongoose.
- [ ] Build user and movie models.
- [ ] Implement authentication and authorization.
- [ ] Implement movie CRUD operations.
- [ ] Add filtering, sorting, field selection, and pagination.
- [ ] Implement reviews and ratings.
- [ ] Add centralized error handling.
- [ ] Add seeders and integration-test fixtures.
- [ ] Complete request validation and security middleware.
- [ ] Add image uploads and email workflows.
- [ ] Finalize code documentation and deployment.

---

## License

This project is currently distributed under the ISC license, as specified in `package.json`.

## Author

**Sidali Khelil Cherfi**

Telecommunications Engineer | Software Engineering | Cloud & DevOps | AI

