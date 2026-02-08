# Personal Website Customization Guide

Welcome to your new personal website! This guide will help you personalize the template to make it truly yours. The code is designed to be simple and easy to edit.

## 📂 Project Structure

- **`index.html`**: The main content of your website (text, structure).
- **`style.css`**: The visual styling (colors, fonts, layout).
- **`script.js`**: The interactive behavior (animations, scrolling).

---

## ✏️ 1. Updating Text Content

Open **`index.html`** in your text editor.

### **Hero Section (Your Introduction)**
Find this section around line 35:
```html
<section id="home" class="hero">
    ...
    <h1>Building <span class="gradient-text">digital experiences</span> that matter.</h1>
    <p class="hero-subtitle">I'm a creative developer...</p>
    ...
</section>
```
*   Change the text inside `<h1>` to your own headline.
*   Update the paragraph `<p>` with your own bio.

### **Navigation & Social Links**
*   **Logo**: Find `<a href="#" class="logo">Portfolio.</a>` (Line 21) and change "Portfolio." to your name.
*   **Socials**: Scroll to the footer (around line 145) and update the `href="#"` with your actual profile URLs (Twitter, GitHub, LinkedIn).

---

## 🎨 2. Changing Colors & Theme

Open **`style.css`**. At the very top, you’ll see a `:root` section. This is where all the main colors are defined.

```css
:root {
    /* Colors */
    --bg-body: #0f172a;       /* Main background (Dark Blue) */
    --text-primary: #f8fafc;  /* Main text color (White) */
    
    --primary: #38bdf8;       /* Access Color (Sky Blue) */
    --secondary: #6366f1;     /* Gradient Secondary Color (Indigo) */
}
```

*   **To change the accent color**: Change the hex code for `--primary`.
    *   *Example (Emerald Green)*: Change `#38bdf8` to `#10b981`.
*   ** To change the background**: Change `--bg-body` and `--bg-surface`.

---

## 🖼️ 3. Adding Project Images

In **`index.html`**, scroll to the `#projects` section (around line 90).

You will see:
```html
<div class="project-image"></div>
```
This is currently a CSS placeholder. To add a real image:

1.  Create a folder named `images` in your project folder.
2.  Save your project screenshot inside (e.g., `project1.jpg`).
3.  Replace the `<div class="project-image"></div>` line with:
    ```html
    <img src="images/project1.jpg" alt="Screenshot of Project One" class="project-img-custom">
    ```
4.  *Optional*: You might need to add a small style rule in `style.css` to ensure it fits perfectly:
    ```css
    .project-img-custom {
        width: 100%;
        height: 240px;
        object-fit: cover;
    }
    ```

---

## � 4. Deployment (Putting it Online)

When you are ready to show the world, the easiest way is **Netlify** or **Vercel**.

1.  Drag and drop your project folder onto [Netlify Drop](https://app.netlify.com/drop).
2.  Your site will be online in seconds!

Enjoy building your personal space on the web! 🚀
