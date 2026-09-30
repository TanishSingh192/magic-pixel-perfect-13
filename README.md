# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## JanNexus as a Digital Public Good

- **Licence:** intended for release under the MIT licence (code) and CC BY 4.0 (documentation and schemas).
- **Open standards:** locations in WGS84 lat/lng, dates in ISO 8601, language tags in BCP 47, data exchanged as JSON over HTTPS. AI assistants connect through the open Model Context Protocol (MCP) with OAuth 2.1.
- **Privacy and consent:** citizens report without an account. Before anything is saved they confirm what the AI understood. Raw reports are readable only by signed-in planners. The system never invents a location the citizen didn't give, and it keeps stated facts separate from AI inferences.
- **Human decisions:** recommendations are advisory. Every accept, modify or reject decision is recorded with a note. Nothing is funded automatically.
- **Scoring:** priority = 0.45 × demand + 0.45 × gap + 0.10 × severity, shown in the console for every cluster.
- **Demo data:** cluster request counts are aggregates of historic grievance-portal records (illustrative figures) plus JanNexus reports; only a sample of individual reports is stored.
- **Deploying elsewhere:** a new region needs its boundary data, asset and project registers, language list and currency. The schema, AI extraction, clustering and console are not tied to one region. Multi-country fields (country, currency) and a census or infrastructure-index layer are the next steps.
