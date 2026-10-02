import { useState } from 'react';
import { Button, Panel } from './ui.jsx';

export default function PlaytestExport({ gameState, exportPlaytest, closePlaytestExport, exportPreviousPlaytest }) {
  const [report, setReport] = useState(null), [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  if (gameState === 'START') return null;
  const text = report ? JSON.stringify({ ...report, playerFeedback: { note, recordedAt: report.exportedAt } }) : '';
  const open = () => { setReport(exportPlaytest()); setMessage(''); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setMessage('已复制，可直接发给研究者。'); }
    catch { setMessage('自动复制不可用，请选中下方文本复制，或下载 JSON。'); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `geoguard-${report.sessionId}.json`; link.click(); URL.revokeObjectURL(url);
  };
  return <>
    <Button variant="ghost" size="sm" className="absolute right-2 top-40 z-[60] bg-white/95 pointer-events-auto" onClick={open}>试玩数据</Button>
    {report && <div className="absolute inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4" onPointerDown={e => e.stopPropagation()}>
      <Panel variant="modalPanel" className="w-full max-w-xl p-5">
        <h2 className="text-xl font-bold text-slate-800">单局试玩数据</h2>
        <p className="my-2 text-sm text-slate-600">已截取打开此面板时的数据。局中、暂停、奖励和结算时均可导出；采集只保存在本机，不自动上传。打开时暂停战斗，关闭后恢复之前的状态。</p>
        <p className="text-xs text-slate-500">第 {report.current.wave} 波 · {report.current.battleSeconds} 秒 · {report.outcome === 'in-progress' ? '进行中' : '已结束'} · {Math.ceil(text.length / 1024)} KB</p>
        <label className="mt-3 block text-sm text-slate-600">刚才哪里困惑、卡住或觉得不公平？（选填）
          <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 2000))} className="mt-1 h-16 w-full select-text touch-auto rounded border border-slate-300 p-2" />
        </label>
        <textarea readOnly aria-label="试玩 JSON 数据" value={text} onFocus={e => e.target.select()} className="my-3 h-36 w-full select-text touch-auto rounded border border-slate-300 bg-slate-50 p-2 font-mono text-xs" />
        <p className="mb-3 text-sm text-slate-600" role="status">{message}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="blue" onClick={copy}>复制 JSON</Button>
          <Button variant="ghost" onClick={download}>下载 JSON</Button>
          <Button variant="ghost" onClick={open}>刷新数据</Button>
          <Button variant="ghost" onClick={() => { const previous = exportPreviousPlaytest(); if (previous) { setReport(previous); setNote(''); setMessage('已载入上一局，刷新数据可回到当前局。'); } else setMessage('暂无已保存的上一局。'); }}>上一局</Button>
          <Button variant="ghost" onClick={() => { setReport(null); closePlaytestExport(); }}>返回游戏</Button>
        </div>
      </Panel>
    </div>}
  </>;
}
