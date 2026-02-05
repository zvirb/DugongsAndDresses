import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="grid grid-cols-2 flex-1">
        <Link href="/dm" className="flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 transition-colors text-amber-500 text-4xl font-bold border-r border-neutral-800">
          DM Station
        </Link>
        <Link href="/public" className="flex items-center justify-center bg-black hover:bg-neutral-950 transition-colors text-white text-4xl font-bold">
          Public Display
        </Link>
      </div>
      <Link href="/examples" className="h-16 flex items-center justify-center bg-agent-navy text-agent-blue border-t border-agent-blue/20 hover:bg-agent-navy/80 transition-all font-bold tracking-widest uppercase text-sm">
        View Component Gallery (Agent Mesh)
      </Link>
    </div>
  );
}
