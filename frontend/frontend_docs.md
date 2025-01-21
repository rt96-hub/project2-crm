# Frontend Documentation

This document outlines the structure and purpose of files in the frontend directory of the CRM application.

## Directory Structure

### Root Directory Files

- `package.json`: Main project configuration file that defines dependencies, scripts, and project metadata
  - Dependencies include React, Vite, TypeScript, and other core libraries
  - Defines build, dev, and test scripts

- `package-lock.json`: Automatically generated file that locks dependency versions for consistent installs

- `tsconfig.json`: Base TypeScript configuration file
  - Extended by `tsconfig.app.json` and `tsconfig.node.json`
  - Defines core TypeScript compiler options

- `tsconfig.app.json`: TypeScript configuration for the application code
  - Extends base tsconfig
  - Configures paths and compilation options specific to the React application

- `tsconfig.node.json`: TypeScript configuration for Node.js environment
  - Used for build tools and Node.js specific code
  - Configures module resolution and compilation options for Node environment

- `vite.config.ts`: Vite bundler configuration
  - Configures build tools and development server
  - Defines plugins and build options

- `eslint.config.js`: ESLint configuration for code linting
  - Defines coding style rules
  - Configures TypeScript and React specific linting rules

- `postcss.config.js`: PostCSS configuration for CSS processing
  - Configures Tailwind CSS and other CSS tools
  - Used in the build process for CSS optimization

- `tailwind.config.js`: Tailwind CSS configuration
  - Defines custom themes, colors, and components
  - Configures Tailwind's utility classes and plugins

- `.env.local` and `.env.production`: Environment configuration files
  - Store environment-specific variables
  - Contains API keys and configuration for different environments

- `index.html`: Entry point HTML file
  - Contains the root div for React mounting
  - Includes initial scripts and meta tags

### Source Directory (`src/`)

- `main.tsx`: Application entry point
  - Renders the root React component
  - Sets up provider wrapping

- `App.tsx`: Root React component
  - Defines main routing structure
  - Handles authentication flow

- `App.css` and `index.css`: Global styles
  - Contains Tailwind imports
  - Defines global CSS variables and base styles

#### Subdirectories

- `assets/`: Static assets like images and icons

- `components/`: Reusable React components
  - Contains shared UI components
  - Includes layout components like `DashboardLayout` and `Sidebar`

- `context/`: React context providers
  - Contains `UserContext` for authentication state
  - Other global state management

- `lib/`: Utility functions and service integrations
  - Contains Supabase client setup
  - Shared helper functions

- `pages/`: Page components
  - Main route components like `Dashboard`, `Login`, and `Customers`
  - Each file corresponds to a main application route

- `types/`: TypeScript type definitions
  - Contains database types
  - Shared interface definitions

### Public Directory (`public/`)

- Contains static assets served directly
- Includes `vite.svg` for the application icon

### Build Output (`dist/`)

- Contains the production build output
- Generated when running build commands

## Dependencies

The project primarily depends on:
- React for UI components
- Vite for build tooling
- TypeScript for type safety
- Tailwind CSS for styling
- Supabase for backend services

## Development Workflow

1. Use `npm install` to install dependencies
2. Run `npm run dev` for development
3. Use `npm run build` for production builds
4. Configure environment variables in `.env.local` for development

## Important Notes

- Environment variables must be prefixed with `VITE_` to be accessible in the application
- The project uses TypeScript strict mode for better type safety
- Tailwind CSS is configured for custom styling needs
- ESLint and TypeScript configurations ensure code quality and consistency 