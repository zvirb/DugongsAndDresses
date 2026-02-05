import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen grid grid-cols-2">
      <Link href="/dm" className="flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 transition-colors text-amber-500 text-4xl font-bold border-r border-neutral-800">
        DM Station
      </Link>
      <Link href="/public" className="flex items-center justify-center bg-black hover:bg-neutral-950 transition-colors text-white text-4xl font-bold">
        Public Display
      </Link>
    </div>
  );
}
