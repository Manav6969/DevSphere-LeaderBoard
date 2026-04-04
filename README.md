# DevSphere Leaderboard 🏆

The official **DevSphere** leaderboard platform, built for real-time task tracking, competition management, and developer engagement.

![DevSphere](https://via.placeholder.com/1200x600?text=DevSphere+Leaderboard+Platform)

## ✨ Key Features

- **Dynamic Leaderboard**: Real-time rankings with smooth swap animations powered by `Framer Motion`.
- **Automatic Task Verification**: Integrated with GitHub Webhooks to automatically calculate task completion time from push events.
- **Precision Scoring**: Advanced time calculation using `commit_time` from payloads for accurate task duration measurement.
- **Track Separation**: Individual leaderboards for different tracks (Development, Design, etc.) to ensure fair competition.
- **Secure Authentication**: Google OAuth login with domain-level restrictions for verified participant onboarding.
- **Admin Dashboard**: Full-featured admin interface for managing tasks, users, and monitoring submissions.
- **User Profiles**: Personalized profiles displaying rank history and completed tasks.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## ⚙️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Manav6969/DevSphere-LeaderBoard.git
cd DevSphere-LeaderBoard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file from the `.env.example` and fill in your Supabase and GitHub details.

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GITHUB_WEBHOOK_SECRET=your-webhook-secret
ALLOWED_EMAIL_DOMAINS=ipu.ac.in,gmail.com
```

### 4. Run the development server
```bash
npm run dev
```

---

## 🔗 GitHub Webhook Setup

This platform uses GitHub webhooks to track submissions automatically. 

1. Go to your GitHub repository settings.
2. Select **Webhooks** -> **Add webhook**.
3. Set **Payload URL** to `https://your-deployment.vercel.app/api/webhooks/github`.
4. Set **Content type** to `application/json`.
5. Enter your `GITHUB_WEBHOOK_SECRET`.
6. Select **Pushes** as the event trigger.

> [!TIP]
> The system calculates task completion based on the difference between the event start time and the actual push time (`commits[0].timestamp`), ensuring accuracy even if the webhook delivery is delayed.

---

## ✅ Deployment

Easily deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FManav6969%2FDevSphere-LeaderBoard)

1. Connect your repository to Vercel.
2. Add all environment variables from `.env.local`.
3. Set the build command to `npm run build`.
4. Deploy!

## 📖 API Documentation

The project includes an generated API documentation file: `api_doc_for_word.html`. This document provides details on available endpoints, webhook processing logic, and data schemas for integration.

