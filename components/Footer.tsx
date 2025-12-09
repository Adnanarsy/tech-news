export default function Footer() {
  return (
    <footer className="mt-16 py-8 text-center text-xs text-zinc-500" style={{ borderTop: "1px solid var(--divider-color)" }}>
      <p>
        © {new Date().getFullYear()} News / Essentials. Monochrome by default — color on hover.
      </p>
    </footer>
  );
}
