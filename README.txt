HISAB KHATA - Setup (3 steps)

1) BACKEND (Google Sheet + Apps Script)
   - Naya Google Sheet banayein > Extensions > Apps Script
   - code.gs ka poora code paste karein > Save
   - Function "setup" select karke Run karein (permissions Allow karein)
   - Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone > Deploy
   - "Web app URL" copy karein

2) FRONTEND
   - index.html me line:  const API="PASTE_WEB_APP_URL_HERE"  ki jagah URL paste karein

3) GITHUB + VERCEL
   - Is folder ko GitHub repo me push karein
   - Vercel > Add New Project > repo import > Deploy (koi build setting nahi chahiye)

LOGIN
   - Master Admin:  username  admin   password  OMAC@2026
   - Syed:          username  syed    (abhi bina password; Settings se password laga sakte hain)

APP INSTALL: Chrome me site kholein > "App install karein" / menu > Install app (PWA, sw.js + manifest.json shamil hain)
Note: Passwords hash nahi hain (aapki demand), Google Sheet ke "Users" tab me plain text me hain.
