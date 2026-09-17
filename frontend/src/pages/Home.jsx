import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Wallet, BadgeIndianRupee, PieChart, CheckCircle, Calculator, Sparkles, ArrowRight } from 'lucide-react';
import api from '../services/api';

export const Home = () => {
  const [stats, setStats] = useState({
    activeMembers: 0,
    monthlyContribution: 200000,
    defaultInterestRate: 1.0
  });

  useEffect(() => {
    api.get('/settings/public-stats')
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/70 via-white to-gray-50 flex flex-col justify-between overflow-hidden">
      <div className="space-y-8 sm:space-y-12 pb-8">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-100 to-indigo-100 border border-brand-200 text-brand-800 text-xs font-bold mb-5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
            <span>ડિજિટલ ગ્રુપ ફંડ અને લોન વ્યવસ્થાપન</span>
          </div>

          {/* Brand Logo */}
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Mitra-Mandal Logo" className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-md" />
          </div>

          {/* Title in Gujarati */}
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight font-gujarati">
            મિત્ર-મંડળ
          </h1>

          {/* Subtitle in Gujarati */}
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-brand-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent font-gujarati">
            સાથે બચત, સાથે વિકાસ
          </p>

          {/* Description in Gujarati */}
          <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 font-gujarati leading-relaxed font-medium">
            "તમારા મિત્રમંડળના ફંડ, બચત, લોન અને EMIનું સરળ અને પારદર્શક મેનેજમેન્ટ."
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/login"
                className="px-6 py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                Login
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/signup"
                className="px-6 py-3 text-xs sm:text-sm font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-2xl border border-brand-200 shadow-xs transition-all"
              >
                Join Mitra-Mandal
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/calculator"
                className="px-6 py-3 text-xs sm:text-sm font-bold text-gray-800 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-2 transition-all"
              >
                <Calculator className="w-4 h-4 text-brand-600" />
                EMI Calculator
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* Key Features (સુવિધાઓ) */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-gujarati">સુવિધાઓ (Key Features)</h2>
            <div className="w-16 h-1 bg-brand-600 rounded-full mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              { title: 'માસિક ફંડ', desc: 'દરેક સભ્યનો માસિક ફાળો અને ચુકવણી ટ્રેકિંગ.', icon: Wallet, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50/60' },
              { title: 'લોન મેનેજમેન્ટ', desc: 'સરળ લોન અરજી અને ઘટી રહેલા વ્યાજ દરની ગણતરી.', icon: BadgeIndianRupee, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50/60' },
              { title: 'EMI ગણતરી', desc: 'સ્વચાલિત EMI શિડ્યુલ અને રીમાઇન્ડર્સ.', icon: Calculator, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50/60' },
              { title: 'ખર્ચ વ્યવસ્થાપન', desc: 'ગ્રુપના દરેક ખર્ચનો પારદર્શક હિસાબ.', icon: PieChart, color: 'from-purple-500 to-indigo-600', bg: 'bg-purple-50/60' },
              { title: 'પારદર્શક હિસાબ', desc: 'દરેક લેવડ-દેવડનો ડિજિટલ લેજર હિસાબ.', icon: CheckCircle, color: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-50/60' },
              { title: 'સુરક્ષિત ડેટા', desc: 'સરક્ષિત ડેટા અને રોલ બેઝ્ડ સુરક્ષા.', icon: Shield, color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50/60' }
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div 
                  key={i} 
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all ${f.bg} backdrop-blur-xs`}
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${f.color} text-white flex items-center justify-center mb-3 shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1 font-gujarati">{f.title}</h3>
                  <p className="text-xs text-gray-600 font-gujarati leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* How it Works (કેવી રીતે કામ કરે છે) */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white border-y border-gray-100 py-8 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-gujarati">કેવી રીતે કામ કરે છે (How It Works)</h2>
            <p className="text-xs text-gray-500 mb-6 font-gujarati">મિત્ર-મંડળમાં ફંડ અને લોનની સરળ પ્રક્રિયા</p>
            
            <div className="space-y-3 text-left font-gujarati">
              {[
                '૧. સભ્યો દર મહિને નિયમિત ફંડ આપે છે',
                '૨. તમામ ફંડ સુરક્ષિત રીતે એકત્રિત થાય છે',
                '૩. જરૂરિયાત મુજબ સભ્યોને લોન આપવામાં આવે છે',
                '૪. EMI દ્વારા વ્યાજ સાથે પૈસા પાછા આવે છે',
                '૫. સંપૂર્ણ નાણાકીય હિસાબ આપમેળે ટ્રેક થાય છે'
              ].map((step, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50/40 border border-gray-100 shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                    {idx + 1}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-800">{step}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Trust Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
            <motion.div whileHover={{ scale: 1.04 }} className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-sm">
              <div className="text-2xl sm:text-3xl font-black">{stats.activeMembers || 0}</div>
              <div className="text-[11px] font-semibold opacity-90 mt-0.5 font-gujarati">કુલ સભ્યો (Members)</div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04 }} className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-sm">
              <div className="text-2xl sm:text-3xl font-black">₹{(stats.monthlyContribution / 100).toLocaleString('en-IN')}</div>
              <div className="text-[11px] font-semibold opacity-90 mt-0.5 font-gujarati">માસિક ફાળો (Monthly Fund)</div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04 }} className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-sm">
              <div className="text-2xl sm:text-3xl font-black">{stats.defaultInterestRate}%</div>
              <div className="text-[11px] font-semibold opacity-90 mt-0.5 font-gujarati">વ્યાજ દર (Interest Rate)</div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04 }} className="p-4 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-2xl shadow-sm">
              <div className="text-2xl sm:text-3xl font-black">100%</div>
              <div className="text-[11px] font-semibold opacity-90 mt-0.5 font-gujarati">પારદર્શકતા (Transparency)</div>
            </motion.div>
          </div>
        </motion.section>
      </div>

      {/* Footer - Sealed without trailing whitespace */}
      <footer className="w-full bg-gray-900 text-gray-400 py-6 px-4 text-center text-xs border-t-0 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="font-bold text-white text-sm font-gujarati">મિત્ર-મંડળ (Mitra-Mandal)</div>
          <div className="flex gap-4 text-xs font-semibold">
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/calculator" className="hover:text-white transition-colors">EMI Calculator</Link>
            <span className="text-gray-600">Privacy & Terms</span>
          </div>
          <div className="text-[11px] text-gray-500">© 2026 મિત્ર-મંડળ. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};
