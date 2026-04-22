# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
This is a personal portfolio website for Emanuele D'Allestro, a PhD Researcher at KTH. The site is a static HTML/CSS/JS project designed for deployment on GitHub Pages.

## Project Structure
- `index.html`: Main entry point and landing page. Contains the hero section, about, values, and featured projects.
- `style.css`: Core styling using a "Soft Pastel Earthy" theme. Uses CSS variables for easy customization.
- `script.js`: Interactivity, including scroll reveal animations, a 3D carousel for values, and navigation handling.
- `images/`: Contains static images for projects and personal branding.
- `recipes/`: Sub-pages for various recipes (e.g., `recipes.html`, individual recipe pages).
- `conferences/`: Sub-pages for conference notes and logs (e.g., `conferences.html`, individual conference pages).
- `phd/`: PhD-related documentation and milestones.
- `projects/`: Detailed case studies and publication summaries for research projects.
- `values/`: Pages exploring personal philosophies (e.g., Wabi-sabi, Kaizen, Ikigai).
- `events/`: Documentation for events like UNLEASH.
- `CUSTOMIZATION.md`: Guide for updating text, colors, and images.
- `DEPLOY_INSTRUCTIONS.md`: Step-by-step guide for GitHub Pages deployment.

## Development & Deployment

### Deployment
The site is hosted on **GitHub Pages**. To deploy:
1. Ensure changes are committed and pushed to the `main` branch.
2. The site updates automatically via GitHub Actions or manual trigger if configured.
3. Verify the live site at `https://emanuelenene.github.io/`.

### Customization
- **Colors**: Modify `:root` variables in `style.css` to change the theme.
- **Content**: Update text directly in the relevant `.html` files.
- **Images**: Add new images to `images/` and update the `src` attribute in HTML.

## Key Technologies
- **HTML5**: Semantic structure.
- **CSS3**: Modern layouts (Grid, Flexbox) and animations (CSS Variables, 3D Transforms).
- **JavaScript (ES6+)**: DOM manipulation and animation logic.
- **Phosphor Icons**: Used for lightweight, clean iconography via CDN.
- **Google Fonts**: "Source Serif 4" for professional typography.
