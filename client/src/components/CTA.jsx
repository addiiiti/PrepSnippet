import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Puzzle, Sparkles } from 'lucide-react'

const CTA = () => {
  return (
    <section className="relative py-20 px-4 bg-gradient-to-b from-white via-blue-50/40 to-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <div
          id="browser-extension"
          className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-xl shadow-blue-100/60"
        >
          <div className="absolute -top-24 -right-24 w-52 h-52 rounded-full bg-blue-100 blur-3xl opacity-80" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-sky-100 blur-3xl opacity-80" />

          <div className="relative grid lg:grid-cols-[1.6fr_auto] gap-8 p-8 md:p-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold mb-5">
                <Puzzle className="w-4 h-4" />
                Browser Extension
              </div>

              <h3 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Analyze snippets where you already learn and build.
              </h3>

              <p className="text-lg text-blue-700 font-medium mb-3">
                Analyze code directly from LeetCode, GitHub, docs, and blogs.
              </p>

              <p className="text-gray-600 text-base leading-relaxed">
                Highlight code, open PrepSnippet, and get instant AI explanation and interview prep context without breaking your flow.
              </p>

              <div className="flex flex-wrap gap-2 mt-5">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">LeetCode</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">GitHub</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Documentation</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Engineering Blogs</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <Link
                to="/install-extension"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 shadow-lg shadow-blue-500/30"
              >
                Install Extension Beta
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold transition-all duration-300"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-blue-200/30 shadow-2xl shadow-blue-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-25" />

          <div className="relative p-10 md:p-14 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white/95 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Web + Extension Interview Workflow
            </div>

            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
              Build interview confidence with every snippet you save.
            </h2>

            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
              Start with the web app, add the browser extension when you want instant context capture, and keep your prep system in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300"
              >
                Start Free
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/60 text-white font-semibold hover:bg-white/10 transition-all duration-300"
              >
                Login
              </Link>
            </div>

            <p className="text-sm text-white/75 mt-6">
              No credit card required • Free forever • Consistent PrepSnippet workflow across web and extension
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA
