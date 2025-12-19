'use client'

import CTA from "@/components/landing/CTA"
import Ethical from "@/components/landing/Ethical"
import FAQ from "@/components/landing/FAQ"
import Footer from "@/components/landing/Footer"

export default function HomePage() {
  return (
    <>
      <Ethical/>
      <FAQ/>
      <CTA/>
      <Footer/>
    </>
  )
}