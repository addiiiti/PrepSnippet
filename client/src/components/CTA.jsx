import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const CTA = () => {
  return (
    <section className="relative py-24 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
          
          {/* Content */}
          <div className="relative p-12 md:p-16 text-center">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Ace Your Interviews?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join developers who are mastering their code knowledge. 
              Start organizing your snippets today - completely free!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center gap-2"
              >
                Start Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <p className="text-sm text-white/70 mt-6">
              No credit card required • Free forever • AI-powered features included
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA
