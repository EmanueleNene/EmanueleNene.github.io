# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
This is a personal portfolio website for Emanuele D'Allestro, a PhD Researcher at KTH. The site is a static HTML/CSS/JS project designed for deployment on GitHub Pages.

## Project Structure
- `index.html`: Main entry point and landing page. Contains the hero section, about, values, and featured projects.
- `style.css`: Core styling using a "Soft Pastel Earthy" theme. Uses CSS variables for easy customization. Note: `projects/radiculae.html` is a standalone exception with its own bespoke "Radiculae — Botanical Blueprint" styling (deep forest ink, warm parchment, moss green; Fraunces + IBM Plex Mono), self-contained in that page's own `<style>` block.
- `script.js`: Interactivity, including scroll reveal animations, a 3D carousel for values, and navigation handling.
- `images/`: Contains static images for projects and personal branding.
- `recipes/`: Sub-pages for various recipes (e.g., `recipes.html`, individual recipe pages).
- `conferences/`: Sub-pages for conference notes and logs (e.g., `conferences.html`, individual conference pages).
- `phd/`: PhD-related documentation and milestones.
- `projects/`: Detailed case studies and publication summaries for research projects.
- `values/`: Pages exploring personal philosophies (e.g., Wabi-sabi, Kaizen, Ikigai).
- `events/`: Documentation for events like UNLEASH.
- `gym/`: FerroDaStiro, a standalone installable PWA workout tracker, hosted at `/gym/` and self-contained (own `index.html`, `sw.js`, `manifest.webmanifest`, `CLAUDE.md`, `README.md`, `test.js`).
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

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
