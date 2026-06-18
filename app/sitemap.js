import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://vibinapparel.com'

const STATIC_ROUTES = [
  { path: '/',           priority: 1.0,  changeFreq: 'weekly'  },
  { path: '/shop',       priority: 0.95, changeFreq: 'daily'   },
  { path: '/drop-01',    priority: 0.9,  changeFreq: 'weekly'  },
  { path: '/lookbook',   priority: 0.85, changeFreq: 'monthly' },
  { path: '/about',      priority: 0.7,  changeFreq: 'monthly' },
  { path: '/ambassador', priority: 0.65, changeFreq: 'monthly' },
  { path: '/careers',    priority: 0.5,  changeFreq: 'monthly' },
  { path: '/shipping',   priority: 0.5,  changeFreq: 'yearly'  },
  { path: '/returns',    priority: 0.5,  changeFreq: 'yearly'  },
  { path: '/qa',         priority: 0.5,  changeFreq: 'monthly' },
  { path: '/contact',    priority: 0.45, changeFreq: 'yearly'  },
]

export default async function sitemap() {
  const staticEntries = STATIC_ROUTES.map(({ path, priority, changeFreq }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: changeFreq,
    priority
  }))

  let productEntries = []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: products } = await supabase
      .from('products')
      .select('id, updated_at')
      .order('created_at', { ascending: false })

    if (products && products.length > 0) {
      productEntries = products.map((p) => ({
        url: `${BASE_URL}/product/${p.id}`,
        lastModified: new Date(p.updated_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.8
      }))
    }
  } catch (e) {
    console.warn('Sitemap: Could not fetch products from Supabase', e.message)
  }

  return [...staticEntries, ...productEntries]
}
