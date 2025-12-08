export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-xs text-zinc-500">
      <p>
        © {new Date().getFullYear()} News / Essentials. Monochrome by default — color on hover.
      </p>
    </footer>
  );
}
