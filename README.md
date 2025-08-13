# 🎯 Mochi - Brand Intelligence Dashboard

**An advanced MMM (Media Mix Modeling) analytics dashboard with AI-powered insights for data-driven marketing decisions.**

## 🚀 Features

### 📊 **Comprehensive Analytics Dashboards**
- **Executive Overview** - KPIs, portfolio performance, brand comparison, market analysis
- **MMM Meta Analysis** - Media contribution decomposition, attribution models, saturation curves
- **Seasonal Analysis** - In-season vs out-of-season performance optimization
- **TV & CTV Analysis** - Linear vs Connected TV performance and optimization
- **Digital Deep Dive** - Channel performance, VTR/viewability, targeting analysis
- **Halo & Synergy** - Cross-brand effects and channel synergy optimization
- **Publisher Analysis** - Platform-specific performance and tactics
- **Targeting & Funnel** - Audience segmentation and conversion flow analysis
- **Flighting Optimization** - Campaign timing and budget allocation scenarios
- **Budget Optimization** - Media mix optimization and efficiency frontiers

### 🤖 **Mochi AI Assistant**
- **Context-Aware Chat** - Understands current dashboard view and filters
- **Data-Driven Insights** - Answers questions about charts, trends, and recommendations
- **Auto-Scroll Chat** - Seamless conversation experience
- **Real-Time Analysis** - Provides strategic recommendations based on current data

### 🎨 **Modern UI/UX**
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Interactive Filters** - Brand, market, channel, and date range filtering
- **Dynamic Charts** - Recharts-powered visualizations with tooltips and legends
- **Glass Morphism** - Modern design with translucent panels and blur effects
- **Professional Color Scheme** - Primary: `#f3f2ef`, Secondary: `#2d2d2d`

## 🛠️ **Technology Stack**

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for responsive design
- **Charts**: Recharts for interactive data visualizations
- **AI**: OpenAI GPT-4o-mini for intelligent insights
- **Maps**: React Simple Maps for geographic data
- **Flags**: Country flags for market visualization
- **Date Handling**: date-fns for date manipulations

## 📁 **Project Structure**

```
brand-dashboard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/        # Dashboard layout group
│   │   ├── api/               # API routes (data, chat)
│   │   ├── mmm/               # MMM Meta Analysis page
│   │   ├── seasonal/          # Seasonal Analysis page
│   │   ├── tv-ctv/            # TV & CTV Analysis page
│   │   ├── digital/           # Digital Deep Dive page
│   │   ├── halo/              # Halo & Synergy page
│   │   ├── publishers/        # Publisher Analysis page
│   │   ├── targeting/         # Targeting & Funnel page
│   │   ├── flighting/         # Flighting Optimization page
│   │   └── optimize/          # Budget Optimization page
│   ├── components/            # Reusable React components
│   │   ├── Charts.tsx         # Chart components
│   │   ├── ChatBubble.tsx     # AI chat interface
│   │   ├── Filters.tsx        # Dashboard filters
│   │   ├── Nav.tsx            # Navigation sidebar
│   │   └── WorldMap.tsx       # Geographic visualization
│   ├── context/               # React Context providers
│   │   └── DashboardContext.tsx # Global state management
│   ├── lib/                   # Utility libraries
│   │   ├── types.ts           # TypeScript type definitions
│   │   ├── dummyData.ts       # Demo data generation
│   │   ├── transform.ts       # Data transformation utilities
│   │   └── formatters.ts      # Number/currency formatters
│   └── styles/                # Global styles
└── public/                    # Static assets
```

## 🚦 **Getting Started**

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- OpenAI API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jadkhattib/mochi.git
   cd mochi
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   Add your OpenAI API key to `.env.local`:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 **Dashboard Pages**

### **Executive Overview**
- 8 Key Performance Indicators
- Portfolio Performance Timeline
- Brand Performance Comparison (Progress Bars)
- Interactive World Map with Country Drill-down
- Top Performers Rankings

### **MMM Meta Analysis**
- Media Contribution Decomposition (Base vs Media vs Promo)
- Short-term vs Long-term Impact Analysis
- Channel Saturation Curves
- Attribution Models Comparison (First Touch, Last Touch, Linear, etc.)
- Media Efficiency Frontier Analysis

### **Seasonal Analysis**
- Seasonal Performance Buckets
- In-Season vs Out-of-Season Channel ROI
- Day-of-Week and Hour-of-Day Performance
- What-if Scenarios for Pre-season Optimization

### **TV & CTV Analysis**
- Linear TV vs CTV Performance Timeline
- Reach vs Frequency Efficiency Analysis
- Prime vs Non-Prime Performance
- BVOD/SVOD/AVOD Platform Breakdown
- Daypart Performance Optimization

### **Digital Deep Dive**
- Digital Channel Performance Trends
- VTR vs Viewability Impact Analysis
- Buying Type Performance (Awareness vs Engagement)
- Video vs Static Format Analysis
- Campaign Setup Learnings

### **Halo & Synergy**
- Channel Synergy Matrix
- Brand-to-Brand Halo Effects
- Temporal Synergy Analysis
- Cross-Channel Lift Analysis
- Optimal Timing Recommendations

### **Publishers Analysis**
- Publisher Performance Over Time
- ROI vs Scale Efficiency
- Cross-Country Publisher Performance
- Creative Format Performance by Publisher
- Winning Tactics and Key Learnings

### **Targeting & Funnel**
- Funnel Stage Performance Timeline
- Targeting vs BAU Analysis
- Reach & Frequency by Funnel Stage
- 1st Party Data Performance
- Audience Segment Matrix

### **Flighting Optimization**
- Flight Pattern Performance Analysis
- Budget Scenario Optimization
- Saturation Curve Analysis
- Competitive Flight Analysis
- Strategic Timing Recommendations

### **Budget Optimization**
- Media Mix Allocation Optimization
- ROI vs Reach Efficiency Analysis
- Channel Saturation Analysis
- Efficiency Frontier Analysis
- Strategic Recommendations

## 🤖 **Mochi AI Features**

- **Contextual Understanding**: Knows what page you're viewing and what filters are applied
- **Chart-Specific Insights**: Can analyze and explain specific charts and data points
- **Strategic Recommendations**: Provides actionable insights for optimization
- **Natural Language**: Ask questions in plain English about your data
- **Auto-Scroll**: Conversation automatically scrolls to show latest messages

### Example Queries:
- "What's driving the peak in Q3 performance?"
- "Which channels have the best synergy with Linear TV?"
- "How should I optimize my media mix for Brand A?"
- "What's the saturation point for Meta advertising?"

## 🎨 **Design System**

### **Colors**
- Primary: `#f3f2ef` (Light beige background)
- Secondary: `#2d2d2d` (Dark charcoal for text/accents)
- Chart Colors: Coordinated palette for data visualization

### **Typography**
- Font Family: Google Geist (modern, clean, professional)
- Responsive sizing for different screen sizes

### **Components**
- Glass morphism panels with backdrop blur
- Rounded corners and subtle shadows
- Consistent spacing using Tailwind CSS
- Interactive hover states and animations

## 📈 **Data Model**

The dashboard uses a comprehensive data model including:

- **Daily Records**: Brand, market, channel, spend, impressions, reach, frequency, NR, ROI
- **Channel Parameters**: Half-life, thresholds, saturation points
- **Halo Matrix**: Cross-brand effects and strength
- **Channel Synergy**: Cross-channel lift effects
- **Market Groupings**: NAC, EU, MEA, APAC, LATAM

## 🔧 **Configuration**

### **Filters**
- **Brand Selection**: Individual brands or "All"
- **Market Selection**: Individual markets or "All" 
- **Channel Selection**: Multi-select channel filtering
- **Date Range**: Flexible start/end date selection

### **Chart Context**
- Charts register themselves for AI context
- Dynamic tooltip formatting
- Responsive breakpoints
- Performance optimization with data sampling

## 🚀 **Deployment**

### **Vercel (Recommended)**
```bash
npm run build
vercel --prod
```

### **Docker**
```bash
docker build -t mochi-dashboard .
docker run -p 3000:3000 mochi-dashboard
```

### **Other Platforms**
The app is a standard Next.js application and can be deployed to any platform supporting Node.js.

## 🧪 **Testing**

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run build test
npm run build
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ **Support**

For questions or support, please:
- Open an issue on GitHub
- Contact the development team
- Check the documentation wiki

---

**Built with ❤️ for data-driven marketing professionals**

*Mochi helps you understand your media mix, optimize your budget allocation, and make smarter marketing decisions through AI-powered insights and comprehensive analytics.*