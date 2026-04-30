#!/usr/bin/env python3
"""
Generate complete static HTML file from Next.js pages
"""
import os, re

app_dir = '/Users/josiaslucksonpierre/vibin-store/app'
output = '/Users/josiaslucksonpierre/vibin-store/vibin-store-full.html'

# Read all page.js files
pages = {}
components = {}

for root, dirs, files in os.walk(app_dir):
    for f in files:
        path = os.path.join(root, f)
        rel_path = os.path.relpath(path, app_dir)
        # Convert to page ID: app/about/page.js -> about, app/admin/orders/page.js -> admin-orders
        if f == 'page.js':
            page_id = re.sub(r'/page\.js$', '', rel_path).replace('/', '-')
            if page_id == '': page_id = 'home'
            with open(path, 'r') as fp:
                pages[page_id] = fp.read()
        elif f.endswith('.js') and 'components' in rel_path:
            with open(path, 'r') as fp:
                components[f] = fp.read()

print(f"Found {len(pages)} pages:", sorted(pages.keys()))
print(f"Found {len(components)} components:", sorted(components.keys()))

# Build HTML
html = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VIBIN · Move Different</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --ink:#0a0a0a;--cream:#f6f1e7;--coral:#ff4a3d;--muted:#888;--line:#1e1e1e;
  --ink2:#1a1a1a;--cream2:#ebe5d9;
}
body{background:var(--ink);color:var(--cream);font-family:'Manrope',sans-serif;overflow-x:hidden}
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

/* PROMO BAR */
.promo{background:var(--ink);border-bottom:1px solid var(--line);overflow:hidden;padding:8px 0;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--muted)}
.promo-track{display:flex;gap:40px;animation:scroll 30s linear infinite;white-space:nowrap}
.promo-track span{padding:0 20px}
@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

/* NAV */
nav{display:flex;justify-content:space-between;align-items:center;padding:20px 40px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--ink);z-index:100}
.logo{font-family:'Anton',sans-serif;font-size:32px;color:var(--cream);text-decoration:none;text-transform:uppercase;letter-spacing:-.01em}
.nav-links{display:flex;gap:30px}
.nav-links a{color:var(--muted);text-decoration:none;font-size:13px;letter-spacing:.1em;text-transform:uppercase;transition:color .2s}
.nav-links a:hover,.nav-links a.new{color:var(--coral)}
.nav-actions{display:flex;gap:20px;align-items:center}
.nav-icon{color:var(--cream);text-decoration:none;font-size:18px;position:relative}
.cart-dot{position:absolute;top:-6px;right:-8px;background:var(--coral);color:var(--cream);font-size:9px;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace}

/* HERO */
.hero{position:relative;height:100vh;min-height:600px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.hero-img{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,10,10,.3),rgba(10,10,10,.8)),url('https://images.unsplash.com/photo-148398598355-763728e1935b?w=1600&q=80');background-size:cover;background-position:center 30%;filter:contrast(1.05) saturate(.95)}
.hero-grain{position:absolute;inset:0;opacity:.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")}
.hero-content{position:relative;z-index:2;text-align:center;max-width:900px;padding:0 40px}
.hero-top{display:flex;justify-content:space-between;margin-bottom:30px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.15em;color:var(--muted)}
.hero-title{font-family:'Anton',sans-serif;font-size:clamp(60px,10vw,140px);line-height:.85;letter-spacing:-.005em;text-transform:uppercase;margin-bottom:20px}
.hero-title span{display:block}
.vt-1{color:var(--cream)}
.vt-2{color:var(--coral);font-style:italic;text-shadow:0 0 60px rgba(255,74,61,.3)}
.hero-tag{font-size:14px;line-height:1.7;color:rgba(246,241,231,.8);max-width:500px;margin:0 auto 30px}
.hero-cta{display:flex;gap:15px;justify-content:center}
.btn{display:inline-block;padding:16px 32px;border:1px solid var(--line);color:var(--cream);text-decoration:none;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.15em;text-transform:uppercase;transition:all .2s;cursor:pointer;background:transparent}
.btn.primary{background:var(--coral);border-color:var(--coral)}
.btn:hover{border-color:var(--coral);color:var(--coral)}
.btn.primary:hover{background:transparent;color:var(--coral)}
.arrow{margin-left:8px}
</style>
</head>
<body>

<!-- PROMO BAR -->
<div class="promo">
  <div class="promo-track" id="promoTrack">
    <span>Free shipping on orders over $75</span>
    <span>New SS26 Drop is live</span>
    <span>Sign up for 15% off your first order</span>
    <span>Free shipping on orders over $75</span>
    <span>New SS26 Drop is live</span>
    <span>Sign up for 15% off your first order</span>
  </div>
</div>

<!-- NAV -->
<nav>
  <a href="#" class="logo" onclick="showPage(\'home\');return false">VIBIN</a>
  <div class="nav-links">
    <a href="#" onclick="showPage(\'shop\');return false">Shop</a>
    <a href="#" onclick="showPage(\'shop\');return false" class="new">New Drop</a>
    <a href="#" onclick="showPage(\'lookbook\');return false">Lookbook</a>
    <a href="#" onclick="showPage(\'about\');return false">About</a>
    <a href="#" onclick="showPage(\'about\');return false">Stockists</a>
  </div>
  <div class="nav-actions">
    <a href="#" class="nav-icon" onclick="showPage(\'shop\');return false" style="text-decoration:none">&#128269;</a>
    <a href="#" class="nav-icon" onclick="showPage(\'login\');return false" style="text-decoration:none">&#128100;</a>
    <a href="#" class="nav-icon" onclick="showPage(\'cart\');return false" style="text-decoration:none">
      &#128722;<span class="cart-dot" id="cartDot">0</span>
    </a>
  </div>
</nav>
'''

# Add all pages
page_ids = sorted(pages.keys())
for pid in page_ids:
    html += f'\n<!-- PAGE: {pid} -->\n'
    html += f'<div id="page-{pid}" style="display:none">\n'
    html += '  <!-- Content from Next.js app/{pid}/page.js -->\n'
    html += '  <div style="padding:60px 20px;text-align:center;color:var(--muted);font-family:JetBrains Mono,monospace;font-size:12px;letter-spacing:.15em;text-transform:uppercase;">\n'
    html += f'    Page: {pid} - Content being loaded from Next.js source...\n'
    html += '  </div>\n'
    html += '</div>\n'

# Add JavaScript
html += '''
<script>
// PRODUCTS DATA
var PRODUCTS = [
  { id: '1', name: 'Foundation Tee', price: 48, cat: 'Tee', color: '#222' },
  { id: '2', name: 'Move Different Tee', price: 48, cat: 'Tee', color: '#f5f0e6' },
  { id: '3', name: 'Vol 01 Hoodie', price: 98, cat: 'Hoodie', color: '#ff6b5a' },
  { id: '4', name: 'VIBIN Cap', price: 32, cat: 'Accessories', color: '#0a0a0a' },
  { id: '5', name: 'Cargo Pant', price: 88, cat: 'Pants', color: '#3a3a3a' },
];

var cart = JSON.parse(localStorage.getItem('vibin_cart') || '[]');

function updateCartUI() {
  var dot = document.getElementById('cartDot');
  if (dot) dot.textContent = cart.reduce(function(sum, item) { return sum + item.qty; }, 0);
}

function showPage(page) {
  var pages = ['home','shop','about','lookbook','login','cart','checkout','product','admin','faq','returns','profile','ambassador','shipping','print'];
  pages.forEach(function(p) {
    var el = document.getElementById('page-' + p);
    if (el) el.style.display = p === page ? 'block' : 'none';
  });
  // Handle admin sub-pages
  var adminPages = ['admin-orders','admin-support','admin-dashboard','admin-analytics','admin-reviews'];
  adminPages.forEach(function(p) {
    var el = document.getElementById(p);
    if (el) el.style.display = 'none';
  });
  window.scrollTo(0, 0);
}

// INIT
updateCartUI();
</script>
</body>
</html>
'''

with open(output, 'w') as f:
    f.write(html)

print(f"Created {output} with {len(pages)} page placeholders")
print("Now manually add content from Next.js files")
