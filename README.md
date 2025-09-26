# FormBot - Automated Form Data Transfer

A Next.js application that provides an intelligent bot to automatically capture form data from one website and transfer it to another website.

## Features

- 🤖 **Smart Form Monitoring**: Automatically detects when forms are filled and submitted
- ⚡ **Instant Data Transfer**: Captures form data and instantly fills the same information on destination site
- 🎯 **Accurate Field Mapping**: Intelligently maps form fields between different websites
- 🚀 **One-Click Operation**: Simple interface with start/stop controls
- 📱 **Responsive Design**: Beautiful UI that works on all devices

## How It Works

1. **Monitor**: Bot watches the source website for form submissions
2. **Capture**: Automatically captures all form data when submitted
3. **Transfer**: Fills and submits the same data on destination website

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Click the "🚀 Start Form Bot" button
2. The bot will open the source website in a new tab
3. When someone fills out the form on the source website, the bot will automatically capture the data
4. The bot will then open the destination website and auto-fill the same form
5. The form will be automatically submitted

## Technical Details

- Built with Next.js 15 and React 19
- Uses TypeScript for type safety
- Implements cross-window communication for bot functionality
- Responsive design with Tailwind CSS
- Real-time status updates and monitoring

## Bot Service

The `FormBot` class handles:
- Form monitoring and data capture
- Cross-window communication
- Automatic form filling
- Error handling and status updates

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.