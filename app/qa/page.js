
'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from '../styles.css'

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0)

  const faqs = [
    { q: 'How do I track my order?', a: 'Once your order ships, you\'ll receive an email with tracking info. You can also track it on the Orders page in your account.' },
    { q: 'What is your return policy?', a: 'We offer free returns within 30 days of delivery. Items must be unworn with tags attached. Start a return from your account or the Returns page.' },
    { q: 'How do I find my size?', a: 'Each product page has a size guide. Measure yourself and compare to the chart. If between sizes, we recommend sizing up for a looser fit.' },
    { q: 'Do you ship internationally?', a: 'Yes! We ship worldwide. International shipping rates and delivery times vary by location at checkout.' },
    { q: 'How do I become an ambassador?', a: 'Create an account on the Login page, then visit the Ambassador page to get your unique referral link and start earning.' },
    { q: 'Are your clothes sustainable?', a: 'We use quality materials built to last. Our pieces are designed in Jacksonville, FL with attention to durability and timeless style.' },
    { q: 'How do I contact support?', a: 'Email us at returns@vibinapparel.com. We typically respond within 24 hours.' },
    { q: 'Can I change my order after placing it?', a: 'Contact us within 1 hour of ordering and we\'ll do our best to accommodate changes before shipping.' },
    { q: 'Do you restock sold out items?', a: 'Most popular items restock. Sign up for restock notifications on product pages or follow us on social media for restock alerts.' },
    { q: 'How do I use a discount code?', a: 'Enter your code at checkout in the "Discount code" field. Only one code can be used per order.' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <header>
        <Link href="/" className="hdr-logo">VIBIN</Link>
      </header>

      <div className="faq-hero">
        <h1> Fragen & <em>Antworten</em></h1>
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

      <footer>
        <div className="foot-logo">VIBIN</div>
      </footer>
    </>
  )
}

