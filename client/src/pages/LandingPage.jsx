import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import CTA from '../components/CTA';

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <CTA />
    </div>
  );
};

export default LandingPage;
