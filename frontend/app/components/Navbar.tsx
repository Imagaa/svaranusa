"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Ticket } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-black/90 backdrop-blur-md border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image 
                src="/svaranusa-logo.webp" 
                alt="Svaranusa Logo" 
                width={180} 
                height={50} 
                className="h-10 w-auto object-contain" 
                priority 
              />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#tentang" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
              Tentang
            </Link>
            <Link href="/#lineup" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
              Line Up
            </Link>
            
            <div className="flex items-center space-x-4 border-l border-white/20 pl-6">
              {/* Tombol Cek Tiket */}
              <Link 
                href="/cek-tiket" 
                className="flex items-center space-x-2 text-gray-300 hover:text-orange-500 px-3 py-2 text-sm font-medium transition-colors"
              >
                <Ticket className="w-4 h-4" />
                <span>Cek Tiket</span>
              </Link>

              {/* Tombol Beli Tiket */}
              <Link 
                href="/beli" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.4)] hover:shadow-[0_0_20px_rgba(234,88,12,0.6)]"
              >
                Beli Tiket
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-black/95 border-b border-white/10 absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-2 shadow-xl">
            <Link href="/#tentang" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white block px-3 py-3 rounded-md text-base font-medium border-b border-white/5">
              Tentang
            </Link>
            <Link href="/#lineup" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white block px-3 py-3 rounded-md text-base font-medium border-b border-white/5">
              Line Up
            </Link>
            <Link href="/cek-tiket" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-orange-500 flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium border-b border-white/5">
              <Ticket className="w-5 h-5" />
              <span>Cek Tiket</span>
            </Link>
            <div className="pt-4">
              <Link href="/beli" onClick={() => setIsOpen(false)} className="bg-orange-600 flex justify-center text-white px-3 py-3 rounded-full text-base font-bold shadow-[0_0_15px_rgba(234,88,12,0.4)]">
                Beli Tiket Sekarang
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}