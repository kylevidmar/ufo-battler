# UFO Battler

UFO Battler is an engaging web application that allows users to vote on and rank UFO sighting videos sourced from Twitter/X. The platform invites UFO enthusiasts to compare videos, explore a leaderboard of top sightings, and analyze detailed metadata, fostering a community-driven exploration of unidentified aerial phenomena.

https://ufobattler.com

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

Continuous Deployment (CD)  
Trigger: Push to main or staging  

Steps:  
Staging: Deploy to AWS S3 (ufo-battler-staging) and run integration tests  

Production: Manual approval gate, deploy to AWS S3 (ufo-battler-prod) and update backend (Elastic Beanstalk)  

Rollback: Automatic rollback on failure via AWS CloudFormation

yaml

name: CD
on:
  push:
    branches: [main, staging]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
        with:
          name: build
          path: build/
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy to Staging
        if: github.ref == 'refs/heads/staging'
        run: aws s3 sync build/ s3://ufo-battler-staging --delete
      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        env:
          ENVIRONMENT: production
        run: |
          aws s3 sync build/ s3://ufo-battler-prod --delete
          aws elasticbeanstalk update-environment --application-name ufo-battler --environment-name prod-env --version-label latest

Monitoring and Logging  
AWS CloudWatch for logs and metrics  

Sentry for frontend error tracking  

Health checks on API endpoints (e.g., /api/health)

Security  
Secrets stored in GitHub Secrets  

HTTPS via AWS CloudFront  

Rate limiting and CORS on backend

Setup Instructions
To run UFO Battler locally:
Prerequisites  
Node.js (v14+)  

npm

Clone the Repository  
bash

git clone https://github.com/yourusername/ufo-battler.git
cd ufo-battler

Install Dependencies  
bash

npm install

Run the Application  
bash

npm start

Access at http://localhost:3000

Build for Production  
bash

npm run build

Note: Local development may require a mock API or access to ufobattler.com backend. Update API endpoints in the code if needed.
Usage
Home Page  
Click a video to vote for the better UFO sighting.  

Use  to toggle sound, ⛶ for fullscreen, or 𝕏 to view the tweet.

Leaderboard Page  
Browse top videos or search by keywords (e.g., "orb", "Nevada").  

Click a video to analyze it or open in a new tab.

Analyze Page  
View video metadata, embedded tweet, and UAP observables.  

Explore similar sightings or share the video URL.

Contributing
Contributions are welcome! To contribute:
Fork the repository.  

Create a feature branch (git checkout -b feature/your-feature).  

Commit changes (git commit -m "Add your feature").  

Push to your fork (git push origin feature/your-feature).  

Open a pull request with a detailed description.

Ensure code passes linting and tests before submitting.
License
This project is licensed under the MIT License (LICENSE).

### Instructions for Use
1. Copy the entire Markdown content above.
2. Paste it into your repository's `README.md` file.
3. Replace `yourusername` in the clone command with your actual GitHub username.
4. If your backend uses a different stack (not Node.js/Express) or hosting provider (not AWS), update the "Technologies Used" and "Deployment Pipeline" sections accordingly.
5. Add a `LICENSE` file to your repository if you choose the MIT License, or update the license section to match your preference.
6. Optionally, add screenshots or a demo link under a new "Demo" section to enhance visibility.

This README is formatted for GitHub, with clear headings, code blocks, and concise descriptions. It highlights 

