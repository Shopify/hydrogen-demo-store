To create comprehensive documentation for your `eianene.shop` Hydrogen demo store, follow this structured guide. This documentation will cover setup, local development, production build, and specific configurations like Customer Account API setup.

---

# eianene.shop Hydrogen Demo Store Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Requirements](#requirements)
3. [Setup Instructions](#setup-instructions)
4. [Local Development](#local-development)
5. [Production Build](#production-build)
6. [Customer Account API Setup](#customer-account-api-setup)
7. [Additional Configuration](#additional-configuration)
8. [Useful Links](#useful-links)

## Introduction

Welcome to the eianene.shop Hydrogen demo store documentation. This guide will help you set up, develop, and deploy your Hydrogen-based Shopify storefront.

## Requirements

- Node.js version 18.0.0 or higher
- Shopify store with necessary API credentials

## Setup Instructions

### 1. Create a Hydrogen App

Open your terminal and run the following command to create a new Hydrogen app:

```bash
npm create @shopify/hydrogen@latest -- --template demo-store
```

### 2. Update Environment Variables

Update the `.env` file in your project root with your shop's domain and Storefront API token:

```
SHOPIFY_STORE_DOMAIN=eianene.shop
SHOPIFY_STOREFRONT_API_TOKEN=your_storefront_api_token
```

## Local Development

To start the local development server, run the following command:

```bash
npm run dev
```

This will start the server at `http://localhost:3000`.

## Production Build

When you are ready to build your app for production, run:

```bash
npm run build
```

This command will create an optimized production build of your app.

## Customer Account API Setup

To use the Customer Account API, you need to set up a public domain using ngrok and configure Shopify accordingly.

### 1. Setup ngrok

1. **Sign up and download ngrok**:
   - Create a [ngrok](https://ngrok.com/) account.
   - Download and install the [ngrok CLI](https://ngrok.com/download).

2. **Start ngrok**:
   ```bash
   ngrok http --domain=eianene.shop 3000
   ```

### 2. Configure Shopify

1. Go to your Shopify admin => `Hydrogen` or `Headless` app/channel => Customer Account API => Application setup.
2. Edit the `Callback URI(s)` to include `https://eianene.shop/account/authorize`.
3. Edit the `Javascript origin(s)` to include your public domain `https://eianene.shop` or leave it blank.
4. Edit the `Logout URI` to include your public domain `https://eianene.shop` or leave it blank.

## Additional Configuration

Ensure you configure any other settings specific to your application, such as payment gateways, shipping methods, and other Shopify settings.

## Useful Links

- [Hydrogen Documentation](https://shopify.dev/custom-storefronts/hydrogen)
- [Remix Documentation](https://remix.run/docs/en/v1)
- [ngrok](https://ngrok.com/)
- [Shopify Admin](https://admin.shopify.com/store/your-store-name)

---

This documentation provides a complete guide for setting up and running your Hydrogen-based demo store at `eianene.shop`. Make sure to keep this document updated with any changes or new features you add to your store.
