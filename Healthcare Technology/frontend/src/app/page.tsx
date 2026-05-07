import CyberNavbar from "@/components/CyberNavbar";
import { Activity, Shield, Database, Lock } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <CyberNavbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-cyber-pink/50 bg-cyber-pink/10 text-cyber-pink text-[10px] uppercase tracking-widest font-orbitron">
            <Activity size={12} />
            System Status: Operational
          </div>
          
          <h1 className="text-6xl md:text-8xl font-orbitron font-black tracking-tighter leading-none">
            YOUR HEALTH, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue to-cyber-pink glitch-text">
              DECENTRALIZED
            </span>
          </h1>
          
          <p className="font-rajdhani text-lg text-white/60 max-w-lg leading-relaxed">
            Welcome to AETHERIS. A next-generation medical neural-interface built on immutable blockchain protocols. 
            Secure your medical identity with Soulbound Tokens and control your data with quantum-grade encryption.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <button className="cyber-button text-base px-10 py-4 bg-cyber-blue text-black font-bold">
              Connect Neural-Link
            </button>
            <button className="px-8 py-4 border border-white/20 hover:border-cyber-pink transition-all font-orbitron text-sm tracking-widest">
              View Audit Log
            </button>
          </div>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 pt-12 border-t border-white/10">
            <div>
              <div className="text-cyber-blue font-orbitron text-2xl">99.9%</div>
              <div className="text-white/40 text-[10px] uppercase tracking-widest">Uptime</div>
            </div>
            <div>
              <div className="text-cyber-pink font-orbitron text-2xl">AES-256</div>
              <div className="text-white/40 text-[10px] uppercase tracking-widest">Encryption</div>
            </div>
            <div>
              <div className="text-cyber-yellow font-orbitron text-2xl">WEB3</div>
              <div className="text-white/40 text-[10px] uppercase tracking-widest">Core</div>
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyber-blue to-cyber-pink opacity-30 blur-2xl group-hover:opacity-50 transition-all duration-1000" />
          <div className="relative cyber-border overflow-hidden aspect-square bg-cyber-gray/50">
             <Image 
              src="/hero-dashboard.png" 
              alt="Cyberpunk Medical Dashboard" 
              fill
              className="object-cover opacity-80 mix-blend-screen"
            /> 
            {/* Holographic Overlays */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
            <div className="absolute top-4 left-4 p-4 border-l-2 border-cyber-blue bg-black/40 backdrop-blur-sm space-y-2">
              <div className="text-[10px] text-cyber-blue font-orbitron uppercase tracking-widest">Neural Sync</div>
              <div className="h-1 w-32 bg-white/10 overflow-hidden">
                <div className="h-full bg-cyber-blue w-2/3 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FeatureCard 
            icon={<Shield className="text-cyber-blue" />}
            title="SBT Identity"
            desc="Soulbound tokens ensure your medical records are irrevocably tied to your neural signature."
          />
          <FeatureCard 
            icon={<Activity className="text-cyber-pink" />}
            title="Real-time Vitals"
            desc="Sync your cybernetic implants directly to the blockchain for continuous monitoring."
          />
          <FeatureCard 
            icon={<Database className="text-cyber-yellow" />}
            title="IPFS Vault"
            desc="Distributed storage ensures your clinical records never reside on a single point of failure."
          />
          <FeatureCard 
            icon={<Lock className="text-white" />}
            title="Dual-Approval"
            desc="Access to your records requires both your neural key and doctor's verification."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all hover:border-cyber-blue/50 group relative">
      <div className="mb-4">{icon}</div>
      <h3 className="font-orbitron text-sm tracking-widest mb-2 group-hover:text-cyber-blue transition-colors">{title}</h3>
      <p className="font-rajdhani text-sm text-white/50 leading-relaxed">{desc}</p>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-white/20 group-hover:border-cyber-blue transition-colors" />
    </div>
  );
}
