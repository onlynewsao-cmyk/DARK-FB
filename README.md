# Facebook Bot - Complete Automation Solution

A comprehensive Facebook automation bot with dashboard, scheduling, messaging, and analytics capabilities.

## Features

### Core Features
- **Post Management**: Create, schedule, edit, and delete posts
- **Multi-Target Posting**: Post to pages, groups, and channels
- **Media Support**: Upload images, videos, and create albums
- **Message Management**: Receive, read, reply, and archive messages
- **Real-time Notifications**: Socket.io integration for instant updates
- **Scheduling**: Advanced scheduling with recurrence options
- **Analytics Dashboard**: Track engagement, reach, and performance

### Technical Stack

#### Backend
- **Node.js** with Express
- **MongoDB** for data storage
- **Facebook Graph API** integration
- **JWT Authentication**
- **Socket.io** for real-time updates
- **Swagger** for API documentation
- **Winston** for logging
- **Node-cron** for scheduling

#### Frontend
- **React.js** with functional components
- **React Router** for navigation
- **Formik + Yup** for form validation
- **React Chart.js** for analytics visualization
- **Framer Motion** for animations
- **Lucide React** for icons
- **Axios** for HTTP requests
- **Socket.io-client** for real-time communication

## Project Structure

```
facebook-bot/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
├── scripts/
├── docs/
├── .gitignore
├── README.md
└── package.json
```

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB Atlas or local MongoDB
- Facebook Developer Account
- GitHub Account
- Render Account (for deployment)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/onlynewsao-cmyk/facebook-bot.git
cd facebook-bot
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Set up environment variables**

Create a `.env` file in the backend directory based on `.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/facebook-bot
JWT_SECRET=your_jwt_secret_key
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
FRONTEND_URL=http://localhost:3000
```

5. **Run the backend**
```bash
cd backend
npm run dev
```

6. **Run the frontend**
```bash
cd ../frontend
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Facebook App Setup

1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" and "Pages" products
4. Configure your app settings:
   - Valid OAuth Redirect URIs: `http://localhost:5000/api/facebook/connect`
   - App Domains: `localhost`
5. Get your App ID and App Secret
6. Generate a long-lived access token
7. Update your `.env` file with these credentials

## API Documentation

The API documentation is available at:
- Local: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- Production: `https://your-domain.onrender.com/api-docs`

## Deployment

### Deploy to Render

1. **Create a Render account** at [render.com](https://render.com/)
2. **Create a new Web Service**
3. **Configure the service**:
   - Name: facebook-bot-api
   - Region: Choose the closest to you
   - Branch: main
   - Root Directory: backend
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Add all from `.env.example`

4. **Create a Static Site for frontend**:
   - Name: facebook-bot-dashboard
   - Build Command: `npm install && npm run build`
   - Publish Directory: frontend/build

5. **Configure MongoDB Atlas**
   - Create a free cluster
   - Whitelist all IP addresses (0.0.0.0/0)
   - Create a database user
   - Get the connection string

6. **Update environment variables** in Render with your MongoDB URI

### Uptime Monitoring

1. **Create a UptimeRobot account** at [uptimerobot.com](https://uptimerobot.com/)
2. **Add a new HTTP(s) monitor**
3. **Configure**:
   - URL: `https://your-api.onrender.com/api/health`
   - Check every: 5 minutes
   - Alert if: down for 1 minute

4. **Add the API key to your environment variables**

## Usage

### Authentication
- Register a new account
- Login with email and password
- Connect your Facebook pages

### Creating Posts
1. Navigate to "Publicações" > "Nova Publicação"
2. Select the target (page or group)
3. Write your content
4. Add media if needed
5. Choose to publish now or schedule for later

### Scheduling Posts
1. Create a new post
2. Select "Agendar"
3. Choose date and time
4. Set recurrence if needed (daily, weekly, monthly)
5. Save

### Managing Messages
1. View all messages in "Mensagens"
2. Click on a message to view conversation
3. Reply directly from the dashboard
4. Mark as read or archive

### Analytics
- View overview statistics
- Track engagement metrics
- Monitor post performance
- Export data as CSV

## Contributing

1. Fork the repository
2. Create a new feature branch
3. Make your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- GitHub Issues: [https://github.com/onlynewsao-cmyk/facebook-bot/issues](https://github.com/onlynewsao-cmyk/facebook-bot/issues)
- Documentation: [https://github.com/onlynewsao-cmyk/facebook-bot/wiki](https://github.com/onlynewsao-cmyk/facebook-bot/wiki)

## Roadmap

- [x] Basic authentication
- [x] Facebook API integration
- [x] Post management
- [x] Message management
- [x] Scheduling system
- [x] Analytics dashboard
- [x] Real-time notifications
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] AI-powered responses
- [ ] Bulk operations
- [ ] Team collaboration features

---

**Facebook Bot** - Automate your Facebook presence with ease.

Built with ❤️ by [onlynewsao-cmyk](https://github.com/onlynewsao-cmyk)
