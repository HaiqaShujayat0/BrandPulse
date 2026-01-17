# BrandPulse

**Real-time AI-powered social listening dashboard** that tracks brand mentions across Reddit, Google News (RSS), and Hacker News. Transforms social media noise into actionable intelligence through intelligent filtering, relevance-based ranking, sentiment analysis, and crisis detection.

---

## 🎯 Core Features

### **Multi-Source Monitoring**
- **Reddit**: Searches posts with keyword matching, captures author names and upvotes
- **Google News (RSS)**: Monitors news articles via RSS feeds
- **Hacker News**: Tracks stories using Algolia API, captures points and author data
- **Automated Aggregation**: Cron job runs every 10 minutes to fetch new mentions

### **Intelligent Filtering**
- **Boolean Logic Filtering**:
  - Search Terms (OR logic): Captures mentions containing ANY configured keyword
  - Excluded Terms (NOT logic): Filters out mentions with unwanted keywords
- **Spam Detection**: Multi-heuristic spam detection (emoji ratio, spam keywords, excessive capitalization/punctuation)
- **Duplicate Prevention**: Automatic URL-based duplicate filtering

### **Relevance-Based Ranking**
- **Keyword Match Scoring**: Posts ranked by number of matching keywords (most matches first)
- **Smart Sorting**: Primary sort by relevance score, secondary by publication date
- **Indexed Queries**: Fast database-level sorting for optimal performance

### **Sentiment Analysis**
- **Two-Tier Approach**:
  - **Local Analysis** (Free, Instant): Keyword-based sentiment detection using positive/negative word matching
  - **Gemini AI Analysis** (On-Demand): Advanced AI analysis for complex or mixed signals
- **Batch Processing**: Efficient AI batch processing (10 mentions per API call) to reduce costs
- **Sentiment Tracking**: Positive, negative, and neutral sentiment with confidence scores (0-1)

### **Crisis Detection**
- **Negative Sentiment Monitoring**: Tracks mentions with negative sentiment scores
- **Active Crisis Alerts**: Dashboard displays active crisis count
- **Reach Metrics**: Tracks engagement metrics (upvotes on Reddit, points on HN)

### **Dashboard & Analytics**
- **Real-time Feed**: Paginated mentions feed with source filtering (All/Reddit/News)
- **Brand Statistics**: Total mentions, average sentiment, active crises, total reach
- **AI-Generated Insights**: Automated analysis summaries and trending topics
- **Popular Topics**: Extracts and displays trending discussion topics
- **Author & Reach Data**: Displays post authors and engagement metrics

---

## 🏗️ Architecture

### **Tech Stack**
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, SWR for data fetching
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: SQLite (dev) with Prisma migrations
- **AI**: Google Gemini API for advanced sentiment analysis
- **APIs**: Reddit Search API, Hacker News Algolia API, Google News RSS

### **Data Flow**
```
1. FETCH → Reddit/HN/RSS APIs return posts matching search terms
2. VALIDATE → Boolean logic matcher checks search/excluded terms
3. FILTER → Spam detection removes promotional content
4. SCORE → Relevance score calculated (keyword match count)
5. SAVE → Valid posts stored in SQLite with author/reach data
6. ANALYZE → Sentiment analysis runs (local + Gemini AI)
7. RANK → Posts sorted by relevance score (desc) → date (desc)
8. DISPLAY → Dashboard shows ranked, analyzed mentions
```

### **Database Schema**
- **Brand**: Stores brand configuration with search/excluded terms (JSON arrays)
- **Mention**: Stores mentions with sentiment, relevance score, author, reach, spam status
- **Indexes**: Optimized indexes on brandId, source, publishedAt, sentiment, relevanceScore

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- npm or yarn

### **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env  # Add your GEMINI_API_KEY
npm run prisma:generate
npm run prisma:migrate
npm run seed  # Optional: Seed sample brands
npm run dev   # Starts on port 4000
```

### **Frontend Setup**
```bash
cd frontend
npm install
npm run dev   # Starts on port 3001
```

### **Access**
- Frontend: http://localhost:3001
- Backend API: http://localhost:4000
- Health Check: http://localhost:4000/health

---

## 📊 Key Improvements

### **Performance**
- ✅ Pagination: 50 mentions per page (was 200)
- ✅ Database indexing: Optimized queries for sorting and filtering
- ✅ Rate limiting: API protection (100 req/15min, 10 req/hour for expensive ops)

### **Data Quality**
- ✅ Relevance scoring: Posts ranked by keyword match count
- ✅ Author tracking: Captures Reddit/HN author names
- ✅ Reach metrics: Tracks upvotes (Reddit) and points (HN)
- ✅ Spam filtering: Multi-heuristic spam detection

### **User Experience**
- ✅ Centered layout: Proper form centering on configuration page
- ✅ Real-time updates: SWR auto-refresh every 30 seconds
- ✅ Error handling: Graceful error handling without mock fallbacks
- ✅ Pagination UI: Intuitive page navigation controls

---

## 🔧 Configuration

### **Adding a Brand**
1. Navigate to `/config` page
2. Enter brand name (e.g., "TypeScript")
3. Configure **Keywords to Watch** (comma-separated): `TypeScript, TS, TSX`
4. Configure **Negative Keywords** (optional): `hiring, job, crypto`
5. Click "Create Brand"

### **Boolean Logic**
- **Search Terms (OR)**: Mention must contain AT LEAST ONE search term
- **Excluded Terms (NOT)**: Mention containing ANY excluded term is filtered out

### **Cron Job**
- Runs every 10 minutes automatically
- Can be triggered manually: `POST /api/scrape` or `POST /api/scrape/:brandId`

---

## 📈 API Endpoints

- `GET /health` - Health check with uptime info
- `GET /api/brands` - List all brands
- `POST /api/brands` - Create new brand
- `GET /api/brands/:id/mentions` - Get paginated mentions (sorted by relevance)
- `GET /api/brands/:id/stats` - Get brand statistics
- `GET /api/brands/:id/analysis` - Get AI-generated analysis
- `GET /api/brands/:id/topics` - Get trending topics
- `POST /api/brands/:id/analyze-sentiment` - Trigger sentiment analysis
- `POST /api/scrape` - Manually trigger scraping for all brands

---

## 🔍 Sentiment Analysis

### **Local (Free)**
- Uses keyword matching for fast, cost-free analysis
- Returns: `positive`, `negative`, or `neutral`
- Confidence score: 0.5-0.95 based on keyword count

### **AI-Powered (Gemini)**
- Triggered for complex cases or on-demand
- Batch processing: 10 mentions per API call
- Handles mixed signals and nuanced sentiment

---

## 🛡️ Security & Performance

- **Rate Limiting**: Prevents API abuse (100 req/15min general, 10 req/hour for expensive ops)
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Request Logging**: Development-mode request logging
- **Database Migrations**: Version-controlled schema changes

---

## 📝 License

ISC

---

**Last Updated**: January 2026
**Status**: Production-ready with automated monitoring and AI-powered insights


Prisma Scheme :
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Brand {
  id           String    @id @default(uuid())
  name         String
  searchTerms  String    // JSON string array
  excludedTerms String   // JSON string array
  mentions     Mention[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Mention {
  id             String   @id @default(uuid())
  brandId        String
  brand          Brand    @relation(fields: [brandId], references: [id], onDelete: Cascade)
  source         String   // "reddit" | "hn" | "rss"
  title          String
  content        String   @default("")
  url            String   @unique
  publishedAt    DateTime
  isSpam         Boolean  @default(false)
  // New dynamic fields
  sentiment      String?  // "positive" | "negative" | "neutral"
  sentimentScore Float?   // 0-1 confidence score
  author         String?  // Actual author name
  reach          Int      @default(0) // Upvotes/points/impressions
  relevanceScore Int      @default(0) // Number of search terms matched (0 to N)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([brandId])
  @@index([source])
  @@index([publishedAt])
  @@index([sentiment])
  @@index([relevanceScore])
}


path :D:\BrandPulse\frontend\prisma\schema.prisma