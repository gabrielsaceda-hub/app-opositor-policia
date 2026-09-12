function AppButton({ children, variant = 'primary', ...props }) {
  const styles =
    variant === 'secondary'
      ? 'bg-slate-200 text-slate-800 active:bg-slate-300'
      : 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 active:bg-brand-700'

  return (
    <button
      {...props}
      className={`w-full rounded-2xl px-4 py-4 text-base font-bold transition active:scale-[0.99] ${styles}`}
    >
      {children}
    </button>
  )
}

export default AppButton
