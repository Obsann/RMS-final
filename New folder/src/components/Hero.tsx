import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Home } from "lucide-react";
import { motion } from "motion/react";

export default function Hero() {
  return (
    <div className="relative min-h-[600px] flex flex-col md:flex-row overflow-hidden">
      {/* Left Side - Content */}
      <div className="flex-1 bg-brand-light p-8 md:p-20 flex flex-col justify-center relative z-10">
        {/* Abstract Geometric Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L400 300L0 600V0Z" fill="url(#grad1)" />
            <path d="M800 0L400 300L800 600V0Z" fill="url(#grad2)" />
            <path d="M0 0L800 0L400 300L0 0Z" fill="url(#grad3)" />
            <path d="M0 600L800 600L400 300L0 600Z" fill="url(#grad4)" />
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="400" y2="300" gradientUnits="userSpaceOnUse">
                <stop stopColor="#163e6e" />
                <stop offset="1" stopColor="#163e6e" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="grad2" x1="800" y1="0" x2="400" y2="300" gradientUnits="userSpaceOnUse">
                <stop stopColor="#163e6e" />
                <stop offset="1" stopColor="#163e6e" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="grad3" x1="400" y1="0" x2="400" y2="300" gradientUnits="userSpaceOnUse">
                <stop stopColor="#163e6e" />
                <stop offset="1" stopColor="#163e6e" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="grad4" x1="400" y1="600" x2="400" y2="300" gradientUnits="userSpaceOnUse">
                <stop stopColor="#163e6e" />
                <stop offset="1" stopColor="#163e6e" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-xl relative z-20"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold text-brand-dark leading-[1.1] mb-6">
            Empowering Modern Living
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Streamline your property operations with our efficient and comprehensive management solution.
          </p>
        </motion.div>
      </div>

      {/* Right Side - Image and Cards */}
      <div className="flex-1 relative min-h-[400px] md:min-h-full">
        <img
          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000"
          alt="Modern Apartment Building"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6">
          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-sm"
          >
            <Card className="bg-brand-dark/90 border-none text-white backdrop-blur-sm overflow-hidden shadow-2xl">
              <CardContent className="p-8 flex items-center gap-6">
                <div className="p-3 bg-white/10 rounded-full">
                  <User className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-4">Login to Your Account</h3>
                  <Button variant="secondary" className="bg-white text-brand-dark hover:bg-gray-100 font-bold px-6">
                    Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Register Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full max-w-sm"
          >
            <Card className="bg-white border-none text-brand-dark overflow-hidden shadow-2xl">
              <CardContent className="p-8 flex items-center gap-6">
                <div className="p-3 bg-brand-dark/5 rounded-full">
                  <Home className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-4">Register as Resident</h3>
                  <Button className="bg-brand-dark text-white hover:bg-brand-dark/90 font-bold px-6">
                    Register
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
