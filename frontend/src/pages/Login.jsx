import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Ship, Lock, User, Key, Building, Anchor, 
  ShieldCheck, AlertOctagon, ArrowRight, UserPlus, 
  Gauge, CheckCircle2, RotateCcw
} from 'lucide-react';

export default function Login({ initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' | 'register'
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('procurement@steel.gov.in');
  const [loginPassword, setLoginPassword] = useState('steel123');
  
  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Port Operations Manager');
  const [regOrg, setRegOrg] = useState('JSW Steel / Ministry of Steel');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      let res;
      try {
        res = await axios.post('/api/auth/login', { 
          email: loginEmail, 
          password: loginPassword 
        });
      } catch (err1) {
        if (err1.response?.status === 404) {
          res = await axios.post('/api/login', { 
            email: loginEmail, 
            password: loginPassword 
          });
        } else {
          throw err1;
        }
      }
      
      const token = res.data.token || res.data.access_token;
      localStorage.setItem('token', token);
      localStorage.setItem('navi_steel_token', token);
      localStorage.setItem('navi_steel_user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Backend server offline. Please launch backend or run start_all.bat.');
      } else {
        setError(err.response?.data?.detail || 'Authentication failed. Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const payload = {
        full_name: regName || "Steel Officer",
        email: regEmail,
        password: regPassword,
        designation: regRole || "Port Operations Manager",
        agency: regOrg || "JSW Steel / Ministry of Steel"
      };

      let res;
      try {
        res = await axios.post('/api/auth/register', payload);
      } catch (err1) {
        if (err1.response?.status === 404) {
          res = await axios.post('/api/register', payload);
        } else {
          throw err1;
        }
      }

      const token = res.data.token || res.data.access_token;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('navi_steel_token', token);
        localStorage.setItem('navi_steel_user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      } else {
        setError('Registration succeeded but no session token returned.');
      }
    } catch (err) {
      if (!err.response) {
        setError('Backend server offline. Please launch backend or run start_all.bat.');
      } else {
        const detailMsg = err.response?.data?.detail || '';
        if (
          detailMsg.toLowerCase().includes('already registered') || 
          detailMsg.toLowerCase().includes('already exists')
        ) {
          setError('Account exists! Please enter your password to sign in.');
          setLoginEmail(regEmail);
          setTimeout(() => {
            setActiveTab('login');
          }, 1200);
        } else {
          setError(detailMsg || 'Registration failed. Please verify your entries.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDevResetDB = async () => {
    try {
      await axios.post('/api/auth/reset-db');
      setSuccessMsg('Dev Notice: User database reset to default demo accounts.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const setDemoAccount = (demoEmail) => {
    setLoginEmail(demoEmail);
    setLoginPassword('steel123');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 font-sans bg-[#F8FAFC] text-[#0F172A] selection:bg-[#16A34A] selection:text-white">
      
      {/* Main Light Mode Split-Panel Card */}
      <div className="relative z-10 w-full max-w-5xl bg-white border border-[#E2E8F0] rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px]">
        
        {/* Left Side Panel: Light Maritime Logistics Hero (5 Cols) */}
        <div className="md:col-span-5 relative bg-slate-50 text-[#0F172A] p-8 flex flex-col justify-between overflow-hidden border-b md:border-b-0 md:border-r border-[#E2E8F0]">
          
          {/* Subtle Light Logistics Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-15 transform scale-105"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200&auto=format&fit=crop')` 
            }}
          />

          {/* Top Branding Header */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#16A34A] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 border border-emerald-500/30">
                <Ship className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#16A34A] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  SIH26006
                </span>
                <h1 className="text-xl font-extrabold tracking-tight text-[#0F172A] mt-0.5">
                  NAVI-STEEL FREIGHT AI
                </h1>
              </div>
            </div>
            
            <p className="text-xs text-[#64748B] leading-relaxed font-medium">
              Intelligent Bulk Cargo Procurement & Vessel Chartering Engine | Ministry of Steel Operations
            </p>
          </div>

          {/* Logistics Feature Bullet Highlights */}
          <div className="relative z-10 space-y-3.5 my-8">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
              <Anchor className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#0F172A]">8 Indian Discharge Ports</h4>
                <p className="text-[11px] text-[#64748B]">Paradip, Vizag, Dhamra, Haldia, Krishnapatnam, Gopalpur & Kakinada</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
              <Gauge className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#0F172A]">BDI & Bunker Fuel Analytics</h4>
                <p className="text-[11px] text-[#64748B]">Multi-horizon forward predictive rate curve modeling</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#0EA5E9] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#0F172A]">Ministry Authorized Portal</h4>
                <p className="text-[11px] text-[#64748B]">Protected role-based session access with JWT authorization</p>
              </div>
            </div>
          </div>

          {/* Footer Badge & Dev Reset */}
          <div className="relative z-10 pt-4 border-t border-[#E2E8F0] text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Ministry of Steel • SIH26006</span>
            <button
              onClick={handleDevResetDB}
              title="Reset user database for testing"
              className="text-[#64748B] hover:text-[#16A34A] flex items-center gap-1 text-[10px] font-semibold cursor-pointer transition"
            >
            </button>
          </div>

        </div>

        {/* Right Side Panel: Clean Light Form (7 Cols) */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          
          <div>
            {/* Top Tab Toggle Switcher */}
            <div className="flex items-center bg-[#F1F5F9] p-1.5 rounded-2xl border border-[#E2E8F0] mb-6">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition ${
                  activeTab === 'login' 
                    ? 'bg-[#16A34A] text-white shadow-md shadow-emerald-600/20' 
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/60'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition ${
                  activeTab === 'register' 
                    ? 'bg-[#16A34A] text-white shadow-md shadow-emerald-600/20' 
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/60'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Success Banner */}
            {successMsg && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[#16A34A] text-xs flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Global Error Banner */}
            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2.5 font-medium">
                <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN FORM */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#16A34A]" /> Official Portal Sign In
                  </h3>
                  <span className="text-[11px] text-[#16A34A] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    JWT Session
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Email Address</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                    <input 
                      type="email"
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] transition"
                      placeholder="procurement@steel.gov.in"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Password</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                    <input 
                      type="password"
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] transition"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Quick Demo Official Profiles */}
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
                    Quick Demo Profiles (Auto-fills Credentials):
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      type="button"
                      onClick={() => setDemoAccount('procurement@steel.gov.in')}
                      className={`text-left p-2.5 rounded-xl border text-xs flex justify-between items-center cursor-pointer transition ${
                        loginEmail === 'procurement@steel.gov.in' 
                          ? 'bg-emerald-50 border-[#16A34A] text-[#0F172A] font-semibold' 
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-[#0F172A]">SAIL Chief Procurement Officer</p>
                        <p className="text-[10px] text-[#64748B]">procurement@steel.gov.in</p>
                      </div>
                      <Building className="w-4 h-4 text-[#16A34A]" />
                    </button>

                    <button 
                      type="button"
                      onClick={() => setDemoAccount('logistics@steel.gov.in')}
                      className={`text-left p-2.5 rounded-xl border text-xs flex justify-between items-center cursor-pointer transition ${
                        loginEmail === 'logistics@steel.gov.in' 
                          ? 'bg-emerald-50 border-[#16A34A] text-[#0F172A] font-semibold' 
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-[#0F172A]">RINL Vizag Logistics Director</p>
                        <p className="text-[10px] text-[#64748B]">logistics@steel.gov.in</p>
                      </div>
                      <Anchor className="w-4 h-4 text-[#0EA5E9]" />
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-3.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99] border border-[#16A34A]"
                >
                  {loading ? 'Authenticating Session...' : (
                    <>
                      <span>Sign In to Operations Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* TAB 2: CREATE ACCOUNT (REGISTER) FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#16A34A]" /> Register Official Credentials
                  </h3>
                  <span className="text-[11px] text-[#16A34A] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    New Account
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Full Official Name</label>
                  <input 
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] transition"
                    placeholder="e.g. Ripon Saha"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] transition"
                    placeholder="riponsaha357@gmail.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Password</label>
                  <input 
                    type="password"
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] transition"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Designation / Role</label>
                    <input 
                      type="text"
                      required
                      value={regRole}
                      onChange={e => setRegRole(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Plant / Agency</label>
                    <input 
                      type="text"
                      required
                      value={regOrg}
                      onChange={e => setRegOrg(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] transition"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-3.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99] border border-[#16A34A]"
                >
                  {loading ? 'Creating Official Account...' : (
                    <>
                      <span>Complete Official Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
            SIH26006 Decision Support System • Ministry of Steel Maritime Logistics
          </div>

        </div>

      </div>
    </div>
  );
}
