# Next Carbon - Frontend

A React-based carbon credit tokenization platform frontend built with Vite, TypeScript, and Tailwind CSS.

## Tech Stack

- **React 18** + **Vite 6** + **TypeScript 5.7**
- **Tailwind CSS** + **shadcn/ui** + **Radix UI**
- **Zustand** for state management
- **Leaflet** for interactive maps
- **NextUI** for data tables

## Features

- User authentication (Supabase Auth)
- Project dashboard with carbon credit listings
- Token portfolio management (PT, CIT, VCC)
- Credit pool deposit/withdraw/claim
- Offset/retire credits with NFT certificates
- Admin panel for maturity management
- KYC verification flow

## Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URI=https://your-project.supabase.co
VITE_SUPABASE_ANON=your-anon-key
VITE_BACKEND_URL=http://your-server-ip:3001
VITE_RAZORPAY_KEY=rzp_test_xxxxx
```

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

Output will be in `dist/` folder.

## Deployment Guide

### Option 1: Nginx (Recommended)

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Install nginx:
   ```bash
   sudo apt install nginx
   ```

3. Create nginx config `/etc/nginx/sites-available/nextcarbon`:
   ```nginx
   server {
       listen 80;
       server_name _;

       root /path/to/Next_carbon/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Enable and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/nextcarbon /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t && sudo systemctl restart nginx
   ```

### Option 2: Vercel

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

## Project Structure

```
src/
├── components/       # UI components
│   ├── custom/       # Custom components (dashboard, sidebar)
│   └── ui/           # shadcn/ui components
├── pages/            # Route pages
├── Admin/            # Admin panel components
├── hooks/            # Custom React hooks
├── lib/              # Utilities (supabase client)
├── state-management/ # Zustand stores
└── types/            # TypeScript types
```

## License

MIT
