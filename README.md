# Rita Light Wealth Circle™ — White Label Source Code

 
> Built with React + Vite + Supabase | PWA Ready | Mobile First
> New: Secure Digital Peer-to-Peer (P2P) Rotational Savings & Thrift Platform
> Built with React + Vite + Supabase | PWA Ready | White-Label Source Code

---

## 📦 What You're Getting

A complete, production-ready digital Ajo/Osusu savings platform with:

- ✅ Full user registration with NIN + face video verification
- ✅ GPS location tracking at registration
- ✅ Admin dashboard for complete circle management
- ✅ Slot-based savings system (daily, weekly, monthly)
- ✅ Payment submission with receipt upload
- ✅ Admin payment approval system
- ✅ Circle scoreboard — shows who paid and who hasn't
- ✅ Blacklist system for scammers
- ✅ Real-time notifications
- ✅ PWA — installable on Android and iPhone
- ✅ Dark mode + Light mode + System theme
- ✅ Splash screen for installed app
- ✅ Transaction history
- ✅ Member profile and settings
- ✅ Penalty fee system for late payments
- ✅ Separate admin login page with lockout protection

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS + Custom CSS |
| Animation | Framer Motion + AOS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| SMS OTP | Termii (Nigerian SMS) |
| Hosting | Vercel |
| PWA | vite-plugin-pwa |

---

## ⚡ Quick Setup Guide

### Step 1 — Clone and Install

```bash
git clone https://github.com/your-username/rita-light-wealth-circle.git
cd rita-light-wealth-circle
npm install
```

### Step 2 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings → API Keys** and copy:
   - Project URL
   - Publishable (anon) key

### Step 3 — Set Up Database

1. Go to **Supabase → SQL Editor**
2. Run the `database.sql` file included in this package
3. This creates all tables, triggers and storage buckets

### Step 4 — Configure Environment Variables

Create a `.env` file in the root folder:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
VITE_SMS_API_KEY=your_sms_gateway_api_key (e.g., Termii for Africa or Twilio for Global)
```

### Step 5 — Create Admin Account

1. Go to **Supabase → Authentication → Users → Add User**
2. Enter admin email and password
3. Copy the User UID
4. Go to **Supabase → SQL Editor** and run:

```sql
insert into public.users (
  id, full_name, email, phone,
  is_admin, is_verified, is_blacklisted
) values (
  'YOUR-USER-UID-HERE',
  'Admin Name',
  'admin@yourdomain.com',
  '+234800000000',
  true, true, false
);
```

### Step 6 — Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Step 7 — Deploy to Vercel

```bash
npm run build
```

Or connect GitHub repo to Vercel for automatic deployment.

After deploying add environment variables in:
**Vercel → Project → Settings → Environment Variables**

---

## 🎨 Rebranding Guide

To rebrand for your client:

### Change App Name
Search and replace `Rita Light Wealth Circle` with your brand name in:
- `src/pages/Landing.jsx`
- `src/pages/admin/AdminLogin.jsx`
- `src/components/SplashScreen.jsx`
- `vite.config.js` (manifest name)
- `index.html` (title)

### Change Logo
Replace `src/assets/rita_logo.jpeg` with your client's logo.
Keep the filename the same or update all imports.

### Change Colors
Main brand colors are in `src/index.css`:
```css
/* Purple brand color */
#7F77DD → your brand color

/* Gold accent */
#fbbf24 → your accent color

/* Dark background */
#0f0e1a → your background
```

### Change Currency 
To change the currency from Naira (₦) to your local currency (like $ or €):
- Open src/pages/Landing.jsx and your dashboard files, search for the ₦ symbol, and replace it with your preferred currency sign.

### Change WhatsApp Number
Search for `wa.me/234` and replace with client's WhatsApp number in:
- `src/pages/Landing.jsx`
- `src/pages/Settings.jsx`

### Change Admin Email
Update admin account details in Supabase Authentication.

---

## 📱 PWA Setup (Install on Phone)

### Android
1. Open live URL in Chrome
2. Tap 3 dots menu
3. Tap "Add to Home Screen"

### iPhone
1. Open live URL in **Safari** (not Chrome)
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

---

## 💳 Payment Flow

```
User makes bank transfer to admin account
         ↓
User opens app → Payment page → Drop Receipt
         ↓
Admin reviews receipt in dashboard
         ↓
Admin approves → User gets notification
         ↓
Payment shows as ✅ PAID in scoreboard
```

---

## 🔐 Security Features

- National ID / SSN verification
- Face video verification stored in Supabase Storage
- GPS location captured at registration
- Admin-only blacklist system
- Separate admin login with 3-attempt lockout
- 5-minute lockout after failed attempts
- Users cannot access admin routes

---

## 📊 Database Tables

| Table | Description |
|-------|-------------|
| users | All registered members |
| groups | Saving circles created by admin |
| slots | Slot numbers within each group |
| payments | All payment records |
| group_requests | Join requests from members |
| notifications | In-app notifications |
| blacklist | Blacklisted users log |

---

## 🔧 Common Issues & Fixes

### Registration takes long
- Normal due to face video upload
- Choose Supabase region closest to your users

### OTP not sending
- Top up Termii wallet at termii.com
- Minimum ₦500 recommended

### Dashboard not loading
- Check Supabase URL in environment variables
- Disable RLS temporarily for testing

### PWA not installing on iPhone
- Must use Safari browser (not Chrome)
- iOS 16.4+ required for full PWA support

---

## 📞 Support & Customization

For setup support or custom modifications contact:

- **WhatsApp:** +2349169530731
- **Email:** mrcourage34@gmail.com
- **Twitter:** @yourhandle

---

## 📄 License

This is a white-label commercial license.  
You may rebrand and deploy for one (1) client per purchase.  
Reselling the source code is not permitted.  
For multi-client license contact us.

---

*Rita Light Wealth Circle™ — Save Together. Rise Together.* 🇳🇬
