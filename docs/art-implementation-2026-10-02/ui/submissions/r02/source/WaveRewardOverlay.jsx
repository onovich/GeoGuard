import { useRef } from 'react';
import { UI_COPY } from '../../data/gameConfig';
import { cx, playerUi, ui } from '../designSystem.js';
import { Panel, StickerSymbol, useModalFocus } from './ui.jsx';

const REWARD_STYLES = {
  unlock: { label: '新防御塔', surface: '!bg-[#C7E4F4]', symbol: 'blueprint', cta: '解锁蓝图' },
  upgrade: { label: '属性提升', surface: '!bg-[#B6D4AE]', symbol: 'blueprint', cta: '应用升级' },
  support_money: { label: '补给', surface: '!bg-[#F8DDAA]', symbol: 'gem', cta: '获取物资' },
  support_repair: { label: '修复', surface: '!bg-[#F4ADA0]', symbol: 'heart', cta: '立即修复' },
};

const getDetail = choice => {
  if (choice.type === 'support_money' && choice.detail === '获得一笔额外的资金，而不是选择防御塔。') return '';
  if (choice.type === 'support_repair' && choice.detail === '立即恢复生命值，稳定防线。') return '恢复玩家生命。';
  if (choice.type !== 'upgrade' || typeof choice.detail !== 'string') return choice.detail;
  // Only remove the repeated post-upgrade cost when it matches the preceding conversion.
  return choice.detail.replace(/(造价:\s*\d+\s*->\s*(\d+)),\s*造价\s+(\d+)\s*\/\s*/, (full, conversion, to, repeated) => to === repeated ? `${conversion} · ` : full);
};

export default function WaveRewardOverlay({ rewardState, applyRewardChoice }) {
  const ref = useRef(null);
  useModalFocus(ref, rewardState.active);
  if (!rewardState.active) return null;
  const count = rewardState.choices.length;
  return (
    <div className={`absolute inset-0 z-40 flex items-center justify-center overflow-y-auto p-4 ${playerUi.backdrop}`} style={playerUi.fontStyle}>
      <Panel ref={ref} variant="stickerModal" role="dialog" aria-modal="true" aria-labelledby="wave-reward-title" className="my-auto w-full max-w-3xl p-6">
        <div className="mb-5 text-center">
          <h2 id="wave-reward-title" className="text-[28px] font-extrabold leading-tight">{UI_COPY.rewardTitle}</h2>
          <p className="mt-2 text-sm leading-5">{UI_COPY.rewardSubtitle}</p>
        </div>
        <div data-reward-choices={count} className="mx-auto grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(1, count)}, minmax(0, 1fr))`, maxWidth: count < 3 ? count * 240 : undefined }}>
          {rewardState.choices.map(choice => {
            const style = REWARD_STYLES[choice.type] ?? REWARD_STYLES.upgrade;
            return (
              <button type="button" key={choice.id} onClick={() => applyRewardChoice(choice)} className={cx(ui.card.interactive, playerUi.focus, 'flex min-h-[280px] flex-col rounded-[10px] border-[1.5px] border-[#4B281C] p-4 text-left text-[#4B281C] shadow-none transition-[filter] hover:brightness-[1.035] motion-reduce:transition-none', style.surface)}>
                <span className="text-xs font-bold leading-4">{style.label}</span>
                <h3 className="mt-3 text-lg font-extrabold leading-6 [overflow-wrap:anywhere]">{choice.title}</h3>
                <p className="mt-2 text-base font-semibold leading-6 [overflow-wrap:anywhere]">{choice.subtitle}</p>
                <StickerSymbol kind={style.symbol} className="mx-auto my-3 h-14 w-14" />
                {getDetail(choice) ? <p className="mb-4 text-sm leading-6 [overflow-wrap:anywhere]">{getDetail(choice)}</p> : null}
                <span className="mt-auto block rounded-lg border border-[#4B281C]/40 bg-[#FFF9EF]/60 px-2 py-2 text-center text-sm font-extrabold">{style.cta}</span>
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
