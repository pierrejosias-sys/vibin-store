import './styles.css'

export const metadata = {
  title: 'VIBIN Apparel | Move Different.',
  description: 'Streetwear that speaks for you. A lifestyle brand from Miami, FL.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
