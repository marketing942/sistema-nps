import Link from "next/link";

export default function NotFound() {
  return (
    <div className="brand-cppem min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center">
        <h1 className="b-display text-4xl font-bold">Pesquisa indisponível</h1>
        <p className="b-muted mt-3">
          Esta pesquisa não está mais ativa ou o link está incorreto.
        </p>
        <Link
          href="/"
          className="b-primary-text mt-6 text-xs uppercase tracking-widest hover:opacity-80"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
