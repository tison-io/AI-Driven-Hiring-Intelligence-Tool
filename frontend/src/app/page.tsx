'use client'

import CTA from "@/components/landing/CTA"
import Ethical from "@/components/landing/Ethical"
import FAQ from "@/components/landing/FAQ"
import Footer from "@/components/landing/Footer"
import Hero from "@/components/landing/Hero"
import Hiring from "@/components/landing/Hiring"
import HowItWorks from "@/components/landing/HowItWorks"
import Navbar from "@/components/landing/Navbar"

export default function HomePage() {
  return (
    <>
      <Hero/>
      <Hiring/>
      <HowItWorks/>
      <Ethical/>
      <FAQ/>
      <CTA/>
      <Footer/>
    </>
  )
}