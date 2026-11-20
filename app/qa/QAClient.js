'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FREE_SHIPPING_LABEL } from '../lib/shipping'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0)

  const faqs = [
    { q: 'How do I track my order?', a: 'Once your order ships, you\'ll receive an email with tracking info. You can also track it on the Orders page in your account.' },
    { q: 'What is your return policy?', a: 'We accept returns within 30 days of delivery on unworn, unwashed items with tags attached. Return shipping is paid by the customer unless the item is defective or we sent the wrong item. Made-to-order pieces follow the return terms on their product page. To start a return, email returns@vibinapparel.com with your order number.' },
    { q: 'How do I find my size?', a: 'Each product page has a size guide. Measure yourself and compare to the chart. If between sizes, we recommend sizing up for a looser fit.' },
    { q: 'Do you ship internationally?', a: 'Not yet. We currently ship to US addresses only.' },
    { q: 'How do I become an ambassador?', a: 'Create an account on the Login page, then visit the Ambassador page to get your unique referral link and start earning.' },
    { q: 'Are your clothes sustainable?', a: 'We use quality materials built to last. Our pieces are designed in Jacksonville, FL with attention to durability and timeless style.' },
    { q: 'How do I contact support?', a: 'Email us at returns@vibinapparel.com. We typically respond within 1 business day.' },
    { q: 'Can I change my order after placing it?', a: 'Contact us within 1 hour of ordering and we\'ll do our best to accommodate changes before shipping.' },
    { q: 'Do you restock sold out items?', a: 'Numbered Drop 01 pieces are never restocked or re-run. For other pieces, you can sign up on the product page to get an email if an item comes back in stock.' },
    { q: 'How do made-to-order items work?', a: `Made to order. Ships within 7 business days of your order. US delivery usually takes another 3–4 business days after it ships. Hats ship in a separate package. Made-to-order pieces don't count toward free shipping on orders over ${FREE_SHIPPING_LABEL}. Their shipping is added at checkout. Made-to-order pieces are final sale except as stated in the return terms on their product page.` },
    { q: 'How do I use a discount code?', a: 'Enter your code at checkout in the "Discount code" field. Only one code can be used per order.' },
  ]

  return (
    <>
      <SiteHeader />

      <div className="faq-hero">
        <h1>Questions &amp; <em>Answers</em></h1>
        <p>Everything you need to know</p>
      </div>

      <div className="faq-list">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className={`faq-item ${openIndex === i ? 'on' : ''}`}
            onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
          >
            <div className="faq-q">{faq.q}</div>
            <div className="faq-a">{faq.a}</div>
          </div>
        ))}
      </div>

      <div className="faq-cta">
        <p>Still have questions?</p>
        <Link href="/contact">Contact Us →</Link>
      </div>

      <SiteFooter />
    </>
  )
}
