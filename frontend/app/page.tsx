"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, ArrowRight, Activity, Globe, Lock, Zap, BarChart3, Radar } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex flex-col overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Navigation */}
      <header className="border-b border-emerald-500/20 bg-slate-950/40 backdrop-blur-xl fixed w-full z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/50 transition-all">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Mine-Sigma</span>
              <span className="text-xs text-slate-500 font-medium">Satellite Intelligence</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="text-slate-400 hover:text-emerald-400 transition-colors relative group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="#about" className="text-slate-400 hover:text-emerald-400 transition-colors relative group">
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="#contact" className="text-slate-400 hover:text-emerald-400 transition-colors relative group">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-emerald-500/50 transition-all">
                Sign Up <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden z-10">
        <div className="container mx-auto relative z-10 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold mb-8 backdrop-blur-sm">
            <Zap className="w-4 h-4" />
            <span>Real-Time Satellite Intelligence Platform</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-300 leading-tight">
            Mining Oversight Reimagined
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Harness AI-powered satellite imagery to detect illegal mining, monitor compliance in real-time, and ensure sustainable resource extraction with precision.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white h-14 px-10 text-lg font-semibold shadow-xl hover:shadow-emerald-500/50 transition-all">
                Get Started
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" className="border-2 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 h-14 px-10 text-lg font-semibold transition-all">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-16">
            <div className="p-4 rounded-lg bg-slate-800/30 border border-emerald-500/20 backdrop-blur-sm">
              <p className="text-3xl font-bold text-emerald-400">98%</p>
              <p className="text-sm text-slate-400 mt-1">Detection Accuracy</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/30 border border-emerald-500/20 backdrop-blur-sm">
              <p className="text-3xl font-bold text-cyan-400">24/7</p>
              <p className="text-sm text-slate-400 mt-1">Monitoring Active</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/30 border border-emerald-500/20 backdrop-blur-sm">
              <p className="text-3xl font-bold text-emerald-400">5+</p>
              <p className="text-sm text-slate-400 mt-1">Years Historical Data</p>
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mt-20 relative max-w-5xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl blur opacity-20" />
          <div className="relative rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="aspect-video bg-slate-950 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-black/50 backdrop-blur border border-white/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Satellite Feed Active
                  </div>
                  <div className="bg-black/50 backdrop-blur border border-white/10 px-4 py-2 rounded-lg text-sm">
                    Lat: 23.79° N, Long: 86.43° E
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-cyan-300">
              Comprehensive Monitoring Suite
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Equipped with state-of-the-art tools for complete oversight of mining operations and environmental compliance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300" />
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20 hover:border-emerald-500/50 transition-all backdrop-blur-sm">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:from-emerald-500/40 group-hover:to-emerald-600/40 transition-all">
                  <Globe className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-emerald-300">Satellite Integration</h3>
                <p className="text-slate-400 leading-relaxed">
                  Real-time access to multi-spectral satellite imagery with 5+ years of historical data for precise terrain analysis and change detection.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300" />
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/20 hover:border-cyan-500/50 transition-all backdrop-blur-sm">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:from-cyan-500/40 group-hover:to-blue-600/40 transition-all">
                  <Radar className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-cyan-300">AI Anomaly Detection</h3>
                <p className="text-slate-400 leading-relaxed">
                  Advanced machine learning identifies illegal mining patterns, encroachment, and unauthorized vegetation clearing with 98% accuracy.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300" />
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-purple-500/20 hover:border-purple-500/50 transition-all backdrop-blur-sm">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:from-purple-500/40 group-hover:to-pink-600/40 transition-all">
                  <BarChart3 className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-purple-300">Secure Reporting</h3>
                <p className="text-slate-400 leading-relaxed">
                  Encrypted reporting channels with automated compliance documentation and regulatory action initiation for officers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-emerald-500/20 bg-gradient-to-b from-slate-900/50 to-slate-950 text-slate-400 text-sm relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Mine-Sigma</span>
              </div>
              <p className="text-slate-500">Advanced satellite intelligence for mining oversight and compliance monitoring.</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-slate-400 hover:text-emerald-400 transition-colors">Features</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">About Us</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Blog</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500">© 2024 Mine-Sigma Intelligence. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Twitter</a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">LinkedIn</a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
