# UFO Battler

UFO Battler is an engaging web application where users vote on and rank UFO sighting videos from Twitter/X. The platform enables UFO enthusiasts to compare videos, explore a leaderboard of top sightings, and analyze detailed metadata.

Website: [https://ufobattler.com](https://ufobattler.com)

## Features

### Home Page
- Two UFO videos displayed side-by-side for voting
- Real-time rating updates with animations showing score changes
- Media controls including mute/unmute, fullscreen, and tweet-viewing options

### Leaderboard Page
- Ranked UFO videos based on user votes
- Search functionality by location, date, or tags (e.g., "orb", "hypersonic")
- Performance-optimized with lazy-loaded videos
- Responsive design with interactive elements

### Analyze Page
- In-depth analysis of selected UFO videos:
  - Full video playback with controls
  - Original tweet embedding
  - Comprehensive metadata and UAP observables
  - Related sightings with pagination

## Technologies Used

### Frontend
- React (with hooks architecture)
- React Router for navigation
- CSS-in-JS styling
- Responsive design with dark mode

### Backend Integration
- RESTful API endpoints
- Node.js/Express/NGINX

### External APIs
- Twitter/X API for tweet embedding

### Performance Optimization
- Component memoization
- Intersection Observer for lazy loading
- Efficient state management

### DevOps
- Git version control
- GitHub Actions (CI/CD)
- AWS infrastructure (S3, Elastic Beanstalk)

## Deployment Pipeline

### Version Control
- Branches: `main` (production), `staging` (pre-production), `dev` (development)

### Continuous Integration
- Triggered by pushes or pull requests
- Linting, testing, and building
- Artifact caching

### Continuous Deployment
- Staging: Automatic deployment to AWS S3 staging bucket
- Production: Manual approval gate with deployment to production S3 and backend
- Automatic rollback on failures

### Monitoring
- AWS CloudWatch for logs and metrics
- Sentry for error tracking
- Health check endpoints

### Security
- GitHub Secrets for credential management
- HTTPS via AWS CloudFront
- API rate limiting and CORS

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- npm

### Installation
```bash
git clone https://github.com/yourusername/ufo-battler.git
cd ufo-battler
npm install
```

### Development
```bash
npm start
```
Access at http://localhost:3000

### Production Build
```bash
npm run build
```

## Usage

### Home Page
- Vote on the better UFO sighting
- Media controls for sound, fullscreen, and tweet viewing

### Leaderboard Page
- Browse top videos or search by keywords
- Click videos for detailed analysis

### Analyze Page
- View metadata, embedded tweets, and UAP characteristics
- Explore similar sightings or share content

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m "Add your feature"`)
4. Push to your fork (`git push origin feature/your-feature`)
5. Open a pull request with details

## License
This project is licensed under the MIT License.
