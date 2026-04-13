import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Chrome,
  Download,
  Puzzle,
  Wrench,
} from 'lucide-react'
import extensionPreviewScreenshot from '../assets/Screenshot 2026-04-13 190440.png'

const EXTENSION_DOWNLOAD_URL = 'https://github.com/addiiiti/PrepSnippet/releases/download/v0.1.0-beta/prepsnippet-extension-beta.zip'

const installSteps = [
  'Download the beta zip',
  'Extract the zip',
  'Open chrome://extensions',
  'Enable Developer mode',
  'Click "Load unpacked"',
  'Select the extracted "dist" folder',
]

const extensionFeatures = [
  'Analyze selected code instantly while browsing',
  'Capture snippets from LeetCode, GitHub, docs, and blogs',
  'Send snippets to PrepSnippet workflow for interview prep',
]

const InstallExtensionPage = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-blue-50/40 to-white px-4 py-14 md:py-20">
      <div className="max-w-6xl mx-auto space-y-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to PrepSnippet
        </Link>

        <section className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-white shadow-xl shadow-blue-100/60 p-8 md:p-12">
          <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-blue-100 blur-3xl opacity-70" />
          <div className="absolute -bottom-20 -left-20 w-36 h-36 rounded-full bg-sky-100 blur-3xl opacity-70" />

          <div className="relative max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold mb-5">
              <Puzzle className="w-4 h-4" />
              PrepSnippet Browser Extension Beta
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Install the internal beta extension
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-3xl">
              The browser extension is currently in internal beta. It helps you analyze code
              snippets while you browse, so you can move from discovery to interview prep faster.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <a
                href={EXTENSION_DOWNLOAD_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 shadow-lg shadow-blue-500/30"
              >
                <Download className="w-4 h-4" />
                Download Beta
              </a>

              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl border border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold transition-all duration-300"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <article className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <Wrench className="w-5 h-5 text-blue-600" />
              <h2 className="font-display text-2xl font-bold text-gray-900">
                Manual Chrome Install
              </h2>
            </div>

            <ol className="space-y-4">
              {installSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold inline-flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm">
              Chrome Web Store version is coming later. This beta flow is temporary for internal testing.
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <Chrome className="w-5 h-5 text-blue-600" />
              <h2 className="font-display text-2xl font-bold text-gray-900">
                What you get in beta
              </h2>
            </div>

            <ul className="space-y-3">
              {extensionFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={extensionPreviewScreenshot}
                  alt="PrepSnippet extension preview screenshot"
                  className="w-full h-full object-contain bg-white"
                />
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}

export default InstallExtensionPage
