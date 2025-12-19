'use client'

import CTA from "@/components/landing/CTA"
import Ethical from "@/components/landing/Ethical"
import FAQ from "@/components/landing/FAQ"
import Footer from "@/components/landing/Footer"
import HowItWorks from "@/components/landing/HowItWorks"

export default function HomePage() {
  return (
    <>
      <HowItWorks/>
      <Ethical/>
      <FAQ/>
      <CTA/>
      <Footer/>
    </>
  )
}