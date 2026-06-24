const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="relative h-screen w-full bg-slate-50 flex overflow-hidden">
      {/* Shared Decorative Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] rounded-full bg-rose-500/20 blur-[120px]" />
      </div>

      <div className="w-full h-full flex lg:grid lg:grid-cols-2 z-10 relative">

        {/* Left Side: Presentation (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col relative overflow-hidden bg-slate-900 border-r border-slate-800 h-full">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/30 blur-[140px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/20 blur-[120px]" />
          </div>

          <div className="relative z-10 p-10 lg:p-16 flex flex-col h-full justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-400 text-white shadow-lg shadow-indigo-500/30">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Nexora</span>
            </div>

            {/* Central Typography */}
            <div className="max-w-md">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Architect the bold. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">
                  Build the future.
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-300 leading-relaxed font-light">
                Our platform streamlines project management, bridges the gap between students and faculty, and equips teams to deliver their very best work.
              </p>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex -space-x-3">
                <img className="w-8 h-8 rounded-full border-2 border-slate-900" src="https://ui-avatars.com/api/?name=St&background=4f46e5&color=fff" alt="avatar" />
                <img className="w-8 h-8 rounded-full border-2 border-slate-900" src="https://ui-avatars.com/api/?name=Te&background=0ea5e9&color=fff" alt="avatar" />
                <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">+2k</div>
              </div>
              <span>Trusted by universities worldwide</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form -- NO overflow, fits screen */}
        <div className="w-full h-full flex items-center justify-center px-6 sm:px-12 lg:px-16">
          <div className="w-full max-w-[420px] flex flex-col">

            {/* Mobile Logo */}
            <div className="lg:hidden mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-xl shadow-indigo-500/30">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            {/* Form Header */}
            <div className="w-full text-left mb-4">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>

            {/* Glass Card */}
            <div className="w-full bg-white/70 border border-white/60 shadow-2xl shadow-indigo-500/5 backdrop-blur-xl rounded-[2rem] p-5 sm:p-6">
              {children}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
