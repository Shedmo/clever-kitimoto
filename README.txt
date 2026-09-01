CLEVER KITIMOTO — DIGITAL MENU

Files:
- index.html = public menu
- admin.html = admin panel for editing prices

ADMIN:
Open /admin.html. On first login, the first PIN you enter becomes the PIN stored in that browser. This demo admin uses browser localStorage.

IMPORTANT FOR PRODUCTION:
For price changes to appear to EVERY customer/device, connect the admin to a shared database such as Supabase/Firebase. A static site alone cannot securely synchronize admin edits across devices.

FREE HOSTING:
Cloudflare Pages supports static HTML. Upload/deploy this folder. Netlify and GitHub Pages are also options.
