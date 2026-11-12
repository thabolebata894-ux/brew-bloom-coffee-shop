import { useState } from 'react';

export default function StaffLogin({ onLogin }) {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (staffId.trim() && password) {
      onLogin({ staffId, password });
    }
  };

  return (
    <main className="grid min-h-[calc(100vh-76px)] place-items-center bg-[#FAF8F5] px-5 py-16 text-[#2C2A29]">
      <section className="w-full max-w-md rounded-3xl border border-[#E9E0D5] bg-white p-7 shadow-[0_24px_70px_rgba(44,42,41,.16)] sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#C85A38]">Brew &amp; Bloom · Team</p>
        <h1 className="mt-3 font-display text-4xl">Staff access.</h1>
        <p className="mt-4 text-sm leading-6 text-[#8A8178]">This project has a demo staff screen only; credentials are not verified.</p>
        <form className="mt-8" onSubmit={handleSubmit}>
          <label htmlFor="staff-id" className="mb-2 block text-xs font-semibold text-[#A66A2C]">Staff ID</label>
          <input id="staff-id" autoComplete="username" value={staffId} onChange={(event) => setStaffId(event.target.value)} placeholder="Enter your staff ID" required className="mb-5 w-full rounded-xl border border-[#E9E0D5] bg-[#FAF8F5] px-4 py-3.5 text-sm text-[#2C2A29] outline-none transition placeholder:text-[#8A8178]/60 focus:border-[#C85A38]" />
          <label htmlFor="staff-password" className="mb-2 block text-xs font-semibold text-[#A66A2C]">Password</label>
          <input id="staff-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required className="w-full rounded-xl border border-[#E9E0D5] bg-[#FAF8F5] px-4 py-3.5 text-sm text-[#2C2A29] outline-none transition placeholder:text-[#8A8178]/60 focus:border-[#C85A38]" />
          <button type="submit" className="mt-7 w-full rounded-full bg-[#C85A38] py-4 text-sm font-bold text-white transition hover:scale-[1.02] hover:bg-[#D95D39]">Open point of sale <span aria-hidden="true">→</span></button>
        </form>
        <div className="mt-6 border-t border-[#E9E0D5] pt-5">
          <p className="text-center text-xs leading-5 text-[#8A8178]">For marking and demonstration</p>
          <button
            type="button"
            onClick={() => onLogin({ staffId: 'lecturer-demo', password: 'demo' })}
            className="mt-3 w-full rounded-full border border-[#C85A38] px-5 py-3.5 text-sm font-semibold text-[#C85A38] transition hover:bg-[#C85A38] hover:text-white"
          >
            Enter demo staff dashboard
          </button>
        </div>
      </section>
    </main>
  );
}
