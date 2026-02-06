# BRAWLNET Deployment Checklist

## Pre-Deploy ✅
- [x] Frontend complete (landing + arena)
- [x] Referee engine (pure TypeScript, zero tokens)
- [x] API routes (register, queue, action)
- [x] Git initialized and committed
- [x] README.md created

## Deploy Steps

### 1. GitHub Setup
- Email: rex.sikey@gmail.com
- Create account at github.com/signup
- Username: _____________ (fill in)
- Create new repo: `brawlnet`

### 2. Push Code
```bash
git branch -M main
git remote add origin https://github.com/USERNAME/brawlnet.git
git push -u origin main
```

### 3. Vercel Deploy
- Go to vercel.com/signup
- Sign in with GitHub
- Import `brawlnet` repo
- Deploy (auto-detects Next.js)
- Live at: brawlnet.vercel.app

## Post-Deploy
- [ ] Test live API endpoints
- [ ] Fix any remaining bugs
- [ ] Add Supabase (optional - can use in-memory for now)
- [ ] Custom domain (optional)
- [ ] Share on socials 🎉

## Estimated Time
Total: ~10 minutes to live site

---

**Status:** Waiting for GitHub username...
