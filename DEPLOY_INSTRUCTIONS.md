# Deploying to GitHub Pages

Congratulations on building your personal website! To get it online using GitHub Pages for free, follow these simple steps:

## Prerequisites
- You need a [GitHub account](https://github.com/).

## Steps

1.  **Create a New Repository on GitHub**
    - Go to [github.com/new](https://github.com/new).
    - **Repository name**: `username.github.io` (Replace `username` with your actual GitHub username).
    - **Note**: It is important to use this exact name format if you want your website address to be `https://username.github.io`.
    - Make sure it is **Public**.
    - Do **not** initialize with a README, .gitignore, or license (we already have our files).
    - Click **Create repository**.

2.  **Push Your Code**
    - Copy the "HTTPS" URL of your new repository (it looks like `https://github.com/username/username.github.io.git`).
    - Open your terminal in this project folder and run these commands (replace the URL with yours):
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git push -u origin main
    ```

3.  **Activate GitHub Pages**
    - Go to your repository **Settings** tab.
    - Click on **Pages** in the left sidebar.
    - Under **Branch**, select `main` and click **Save**.
    - (If you named your repo `username.github.io`, this might happen automatically).

4.  **Wait & Visit!**
    - Wait about 1-2 minutes.
    - Visit `https://username.github.io` to see your live site!

## Making Updates
Whenever you make changes to your files:
1.  Run `git add .`
2.  Run `git commit -m "Update message"`
3.  Run `git push`
The changes will go live automatically in a few minutes.
