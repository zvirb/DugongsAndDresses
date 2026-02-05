import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-agent-navy font-sans">
      <div className="flex-1 flex flex-col md:flex-row">
        <Link href="/dm" className="flex-1 flex flex-col items-center justify-center bg-neutral-900/50 hover:bg-neutral-800 transition-all border-b md:border-b-0 md:border-r border-white/5 group">
          <span className="text-neutral-500 text-xs uppercase tracking-[0.3em] mb-4 group-hover:text-agent-blue transition-colors">Command Center</span>
          <span className="text-agent-blue text-5xl font-black italic tracking-tighter uppercase">DM STATION</span>
        </Link>
        
        <div className="flex-1 flex flex-col">
          <Link href="/player" className="flex-1 flex flex-col items-center justify-center bg-agent-navy hover:bg-blue-950 transition-all border-b border-white/5 group">
            <span className="text-neutral-500 text-xs uppercase tracking-[0.3em] mb-4 group-hover:text-agent-blue transition-colors">Hero Interface</span>
            <span className="text-white text-5xl font-black italic tracking-tighter uppercase group-hover:text-agent-blue transition-all">PLAYER APP</span>
          </Link>
          
          <Link href="/public" className="h-32 md:h-1/3 flex flex-col items-center justify-center bg-black hover:bg-neutral-900 transition-all group">
            <span className="text-neutral-500 text-xs uppercase tracking-[0.3em] mb-2 group-hover:text-white transition-colors">Spectator View</span>
            <span className="text-white text-2xl font-bold italic tracking-tight uppercase opacity-60 group-hover:opacity-100 transition-all">Public Display</span>
          </Link>
        </div>
      </div>
      
      <Link href="/examples" className="h-16 flex items-center justify-center bg-agent-navy text-agent-blue border-t border-white/5 hover:bg-agent-blue hover:text-white transition-all font-black tracking-[0.2em] uppercase text-xs">
        System Components (Agent Mesh)
      </Link>
    </div>
  );
}
