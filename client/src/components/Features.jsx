import React from 'react'
import { Zap, Shield, Globe, Smartphone, Database, Rocket } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'AI Auto-Tagging',
    description: 'Automatically tag your code snippets with relevant keywords using LLaMA 3 AI.'
  },
  {
    icon: Shield,
    title: 'AI Explanations',
    description: 'Get instant, clear explanations of what your code does in simple terms.'
  },
  {
    icon: Globe,
    title: 'Interview Mode',
    description: 'Convert any snippet into interview Q&A format for effective preparation.'
  },
  {
    icon: Smartphone,
    title: 'Smart Search',
    description: 'Find your snippets instantly with powerful search and filtering.'
  },
  {
    icon: Database,
    title: 'Organized Storage',
    description: 'Keep all your code snippets organized in one secure place.'
  },
  {
    icon: Rocket,
    title: 'Quick Save',
    description: 'Save snippets in seconds and let AI do the heavy lifting.'
  }
]

const Features = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-5xl md:text-6xl font-bold mb-6">
            <span className="text-gradient">Powerful Features</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to ace your coding interviews with AI-powered preparation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 bg-white border border-gray-200 rounded-2xl hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:scale-105"
              style={{
                animation: 'slideUp 0.6s ease-out forwards',
                animationDelay: `${index * 0.1}s`,
                opacity: 0
              }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="font-display text-2xl font-semibold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
