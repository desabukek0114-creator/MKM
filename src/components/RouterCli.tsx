import React, { useState, useRef, useEffect } from "react";
import { RouterSession } from "../types.js";
import { Terminal, RefreshCw, Trash2, ArrowRight, ShieldAlert, Cpu } from "lucide-react";

interface RouterCliProps {
  activeSession: RouterSession;
}

interface CommandLog {
  command: string;
  response: string;
  time: string;
}

export default function RouterCli({ activeSession }: RouterCliProps) {
  const [commandInput, setCommandInput] = useState("");
  const [logs, setLogs] = useState<CommandLog[]>([
    {
      command: "",
      response: `  __  __ _ _             _____ _ _     \n |  \\/  (_) |           |_   _(_) |    \n | \\  / |_| | ___ __ ___  | |  _| | __ \n | |\\/| | | |/ / '__/ _ \\ | | | | |/ / \n | |  | | |   <| | | (_) || | | |   <  \n |_|  |_|_|_|\\_\\_|  \\___/ \\_/ |_|_|\\_\\ \n                                       \nMikroTik RouterOS ${activeSession.ipAddress}\nTerminal emulator session initiated. Type 'help' or '?' for commands.`,
      time: new Date().toLocaleTimeString()
    }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const cmd = commandInput.trim();
    setCommandInput("");
    setIsExecuting(true);

    // Record client side input instantly
    const newLogItem: CommandLog = {
      command: cmd,
      response: "executing...",
      time: new Date().toLocaleTimeString()
    };
    setLogs(prev => [...prev, newLogItem]);

    try {
      const res = await fetch(`/api/router/${activeSession.id}/cli`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd })
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(prev => {
          const updated = [...prev];
          updated[updated.length - 1].response = data.reply;
          return updated;
        });
      } else {
        const errData = await res.json();
        setLogs(prev => {
          const updated = [...prev];
          updated[updated.length - 1].response = `Error: ${errData.error || "Execution failed"}`;
          return updated;
        });
      }
    } catch (err) {
      setLogs(prev => {
        const updated = [...prev];
        updated[updated.length - 1].response = "Error: Terjadi kegagalan komunikasi dengan API Router.";
        return updated;
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClear = () => {
    setLogs([
      {
        command: "",
        response: `Terminal cleared. Ready.\nType 'help' or '?' to explore options.`,
        time: new Date().toLocaleTimeString()
      }
    ]);
  };

  return (
    <div className="space-y-5" id="cli-terminal-container">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">MikroTik Live API Terminal</h2>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Konsol interaktif untuk menjalankan perintah CLI RouterOS secara langsung melalui API.
          </p>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition"
          id="btn-clear-terminal"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Bersihkan Layar
        </button>
      </div>

      {/* Terminal Screen UI */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
        
        {/* Terminal Tab bar */}
        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[10px] text-slate-500 font-mono pl-2">
              terminal@{activeSession.username} ({activeSession.ipAddress})
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
            <Cpu className="h-3 w-3 text-slate-600" /> API ROS v6 Mode
          </div>
        </div>

        {/* Console Logs Body */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 space-y-4 leading-relaxed whitespace-pre-wrap select-text">
          {logs.map((log, index) => (
            <div key={index} className="space-y-1 bg-slate-950">
              {log.command && (
                <div className="flex items-start text-emerald-400 font-bold select-none">
                  <span className="text-slate-500 mr-2">[{activeSession.username}@{activeSession.sessionName}] &gt;</span>
                  <span className="text-white font-semibold">{log.command}</span>
                </div>
              )}
              <div className="text-slate-300 leading-normal pl-4 font-normal">
                {log.response}
              </div>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Input prompt line */}
        <form onSubmit={handleSubmit} className="bg-slate-900 p-3 border-t border-slate-800 flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-xs select-none pl-1">
            [{activeSession.username}@{activeSession.sessionName}] &gt;
          </span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            disabled={isExecuting}
            placeholder={isExecuting ? "Executing command..." : "Type command (e.g. /system resource print, /ppp secret print)..."}
            className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder-slate-600 disabled:opacity-50"
            autoFocus
            id="cli-input-field"
          />
          <button
            type="submit"
            disabled={isExecuting || !commandInput.trim()}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
