# UFO Battler

UFO Battler is an engaging web application that allows users to vote on and rank UFO sighting videos sourced from Twitter/X. The platform invites UFO enthusiasts to compare videos, explore a leaderboard of top sightings, and analyze detailed metadata, fostering a community-driven exploration of unidentified aerial phenomena.

https://ufobattler.com

https://ufobattler.com/Leaderboard

## Features

- **Home Page**  
  - Displays two UFO videos side-by-side for users to vote on the more compelling sighting.  
  - Real-time rating updates via backend API, with animations showing score changes (e.g., "1200 → 1230").  
  - Features mute/unmute, fullscreen, and tweet-viewing options.  

- **Leaderboard Page**  
  - Showcases ranked UFO videos based on user votes.  
  - Includes search by location, date, or tags (e.g., "orb", "hypersonic").  
  - Lazy-loaded videos using Intersection Observer for performance.  
  - Responsive design with hover effects and tweet embedding.  

- **Analyze Page**  
  - Offers in-depth analysis of a selected UFO video, including:  
    - Full video playback with mute and fullscreen controls.  
    - Embedded original tweet from Twitter/X.  
    - Metadata (location, date, tags) and UAP observables (e.g., "Sudden Acceleration").  
    - Links to similar sightings with pagination.  

## Technologies Used

- **Frontend**  
  - React (hooks: `useState`, `useEffect`, `useRef`, etc.)  
  - React Router for navigation  
  - CSS-in-JS with inline styles and global `<style>` tags  
  - Responsive design with dark mode support  

- **Backend Integration**  
  - RESTful API endpoints (e.g., `https://ufobattler.com/api/getVideos`, `/leaderboard`, `/choose`)  
  - Node.js/Express/NGINX

- **External APIs**  
  - Twitter/X API for tweet embedding via `widgets.js`  

- **Performance Optimization**  
  - Memoization with `React.memo` for components  
  - Intersection Observer for lazy-loaded videos  
  - Efficient state management and debounced API calls  

- **DevOps Tools**  
  - Git for version control  
  - GitHub Actions for CI/CD  
  - AWS (S3 for static assets, Elastic Beanstalk for backend)  

## Deployment Pipeline

To showcase DevOps expertise, UFO Battler implements a robust CI/CD pipeline using GitHub Actions, ensuring code quality, automated testing, and reliable deployments.

### Pipeline Overview

1. **Version Control**  
   - Repository branches:  
     - `main`: Production  
     - `staging`: Pre-production testing  
     - `dev`: Feature development  

2. **Continuous Integration (CI)**  
   - **Trigger**: Push or pull request to any branch  
   - **Steps**:  
     - Install Node.js (v14+) and dependencies (`npm install`)  
     - Run ESLint for code style (`npm run lint`)  
     - Execute Jest unit tests (`npm test`)  
     - Build React app (`npm run build`)  
     - Cache build artifacts for deployment  

   ```yaml
   name: CI
   on: [push, pull_request]
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '14'
         - name: Install Dependencies
           run: npm install
         - name: Run Linting
           run: npm run lint
         - name: Run Tests
           run: npm test
         - name: Build Application
           run: npm run build
         - name: Upload Build Artifact
           uses: actions/upload-artifact@v3
           with:
             name: build
             path: build/
