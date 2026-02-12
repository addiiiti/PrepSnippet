import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 bg-white">
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-8 border border-blue-200">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-700 font-medium">AI-Powered Interview Preparation</span>
        </div>

        {/* Main heading */}
        <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
          <span className="block text-gradient">PrepSnippet</span>
          <span className="block text-gray-900 mt-2">Code to Interviews</span>
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
          Transform your code snippets into interview-ready Q&A with AI. 
          Save, organize, and master your coding knowledge.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/signup"
            className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-lg transition-all duration-300 shadow-lg shadow-blue-500/50 flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 border-2 border-blue-600 hover:bg-blue-50 text-blue-600 rounded-full font-semibold text-lg transition-all duration-300"
          >
            Login
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-gradient mb-2">AI</div>
            <div className="text-sm text-gray-600">Auto-Tagging</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gradient mb-2">Instant</div>
            <div className="text-sm text-gray-600">Explanations</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gradient mb-2">Free</div>
            <div className="text-sm text-gray-600">Interview Prep</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
