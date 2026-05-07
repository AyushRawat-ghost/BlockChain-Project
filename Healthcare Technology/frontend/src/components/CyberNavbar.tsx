"use client";

import { motion } from "framer-motion";
import { Activity, Shield, Cpu, Zap, LogIn } from "lucide-react";
import Link from "next/link";

export default function CyberNavbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-cyber-blue/30 bg-cyber-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="text-cyber-blue"
          >
            <Activity size={28} />
          </motion.div>
          <span className="font-orbitron text-xl tracking-tighter text-cyber-blue glitch-text">
            AETHERIS <span className="text-cyber-pink">OS</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 font-rajdhani text-sm uppercase tracking-[0.2em]">
          <Link href="#" className="hover:text-cyber-blue transition-colors">Records</Link>
          <Link href="#" className="hover:text-cyber-blue transition-colors">Neural-Link</Link>
          <Link href="#" className="hover:text-cyber-blue transition-colors">Finance</Link>
          <Link href="#" className="hover:text-cyber-blue transition-colors">Emergency</Link>
        </div>

        <button className="cyber-button text-xs flex items-center gap-2">
          <LogIn size={14} />
          Initialize Session
        </button>
      </div>
    </nav>
  );
}
