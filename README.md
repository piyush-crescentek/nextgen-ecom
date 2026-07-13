# GHC Frontend

A professional Next.js frontend application built with TypeScript and Tailwind CSS.

## Project Structure

```
ghc-frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home page (Coming Soon)
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   └── layout/           # Layout components
│       ├── Header.tsx    # Header component
│       ├── Footer.tsx    # Footer component
│       └── index.ts      # Barrel export
├── lib/                  # Utility functions and helpers
├── public/               # Static assets
└── ...config files
```

## Getting Started

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint and auto-fix issues
- `npm run type-check` - Run TypeScript type checking

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Linting**: ESLint with Next.js config
- **Fonts**: Geist Sans & Geist Mono

## Code Quality

This project uses:
- ESLint for code linting with custom rules for TypeScript and React
- TypeScript for type safety
- Tailwind CSS for consistent styling

## Components

### Header
Basic navigation header with responsive design. Located at `components/layout/Header.tsx`.

### Footer
Footer with company info, quick links, and contact details. Located at `components/layout/Footer.tsx`.

## Development Guidelines

1. **Components**: Place reusable components in the `components/` directory
2. **Utilities**: Add helper functions to the `lib/` directory
3. **Styling**: Use Tailwind CSS utility classes
4. **Type Safety**: Always use TypeScript types
5. **Code Quality**: Run `npm run lint:fix` before committing

## Project Status

🚧 Currently showing a "Coming Soon" page with countdown timer...
