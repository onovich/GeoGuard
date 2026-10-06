import { useRef } from 'react';
import { UI_COPY } from '../../data/gameConfig';
import { cx, playerUi, ui } from '../designSystem.js';
import { CharacterIcon, Panel, StickerSymbol, OriginalArt, originalSkin, useModalFocus } from './ui.jsx';
import { formatRewardStat, getRewardPresentation } from './rewardPresentation.js';

const REWARD_STYLES = {
  unlock: { label: '新防御塔', skin: ['button-blue',26], color: '#C7E4F4', symbol: 'blueprint', cta: '解锁蓝图' },
  upgrade: { label: '蓝图强化', skin: ['button-sage',29], color: '#B6D4AE', symbol: 'upgradeBlueprint', cta: '应用升级' },
  support_money: { label: '即时获得', skin: ['button-honey',26], color: '#F8DDAA', symbol: 'gem', cta: '获取物资' },
  support_repair: { label: '生命恢复', skin: ['button-coral',29], color: '#F4ADA0', symbol: 'heart', cta: '立即修复' },
};

// Split presentation only; remove a repeated current cost only when the conversion
// already states that exact value. Blueprint rules and all distinct stats remain.
const getDetailGroups = choice => {
  const detail = String(choice.detail ?? '');
  const firstStat = detail.search(/造价(?:\s|:)/);
  if (firstStat < 0) return { description: detail, stats: [] };
  const stats = detail.slice(firstStat).split(/\s*\/\s*|,\s*/).filter(Boolean);
  const costChange = choice.type === 'upgrade' ? stats.find(stat => /^造价:\s*\d+\s*->\s*\d+$/.test(stat)) : undefined;
  const currentCost = costChange?.match(/->\s*(\d+)$/)?.[1];
  return {
    description: detail.slice(0, firstStat).trim(),
    stats: stats.filter(stat => !currentCost || !new RegExp(`^造价\\s+${currentCost}$`).test(stat)),
  };
};

export default function WaveRewardOverlay({ rewardState, applyRewardChoice, towerTypes = [] }) {
  const ref = useRef(null);
  useModalFocus(ref, rewardState.active);
  if (!rewardState.active) return null;
  const count = rewardState.choices.length;
  return (
    <div className={`absolute inset-0 z-40 flex items-center justify-center overflow-y-auto p-4 ${playerUi.backdrop}`} style={playerUi.fontStyle}>
      <Panel ref={ref} variant="stickerModal" role="dialog" aria-modal="true" aria-labelledby="wave-reward-title" className="my-auto w-full p-5" style={{ maxWidth: count === 1 ? 420 : count === 2 ? 580 : 768 }}>
        <div className="mb-4 text-center">
          <h2 id="wave-reward-title" className="flex items-center justify-center gap-3 text-[30px] font-extrabold leading-tight"><OriginalArt id="reward-accent" className="h-7 w-7 object-contain" />{UI_COPY.rewardTitle}<OriginalArt id="reward-accent" className="h-7 w-7 -scale-x-100 object-contain" /></h2>
          <p className="mt-2 text-base leading-6">{UI_COPY.rewardSubtitle}</p>
        </div>
        <div data-reward-choices={count} className="mx-auto grid gap-x-3" style={{ gridTemplateColumns: `repeat(${Math.max(1, count)}, minmax(0, 1fr))`, maxWidth: count < 3 ? count * 240 : undefined }}>
          {rewardState.choices.map(choice => {
            const style = REWARD_STYLES[choice.type] ?? REWARD_STYLES.upgrade;
            const detail = getDetailGroups(choice);
            const presentation = getRewardPresentation(choice, towerTypes);
            const primaryBenefits = presentation.comparisons.filter(line => !line.startsWith('射程') && presentation.improvements.includes(line.split(' ')[0]));
            return (
              <button type="button" key={choice.id} data-original-art="card" onClick={() => applyRewardChoice(choice)} style={{ ...originalSkin('card',16), gridTemplateRows: 'subgrid', gridRow: 'span 7', rowGap: 0 }} className={cx(ui.card.interactive, playerUi.focus, 'group grid border-[1.5px] p-3 text-center text-[#4B281C] motion-reduce:transition-none')}>
                <span className="mx-auto border px-4 py-1 text-sm font-bold leading-5" style={originalSkin(...style.skin,10)}>{style.label}</span>
                <h3 className="mt-2 text-xl font-extrabold leading-6 [overflow-wrap:anywhere]" style={{ textWrap: 'balance' }}>{presentation.title}</h3>
                <div className="relative mx-auto my-2 h-16 w-24">
                  <OriginalArt id="root-shadow-ground" className="absolute bottom-0 left-2 h-2 w-20 object-fill" />
                  <OriginalArt id="reward-accent" className="absolute left-0 top-4 h-5 w-5 object-contain" />
                  <OriginalArt id="reward-accent" className="absolute right-0 top-4 h-5 w-5 -scale-x-100 object-contain" />
                  {choice.towerId ? <CharacterIcon artId={`tower:${choice.towerId}`} label={choice.title} className="relative mx-auto h-16 w-16" /> : <StickerSymbol kind={style.symbol} className="relative mx-auto h-16 w-16" />}
                  {choice.type === 'upgrade' ? <span aria-label="蓝图升级" className="absolute -right-1 bottom-0 border p-0.5" style={originalSkin('button-sage',29,8)}><StickerSymbol kind="arrowUp" className="h-6 w-6" /></span> : null}
                </div>
                <div className="mb-2 text-base font-extrabold leading-6 [overflow-wrap:anywhere]" style={{ textWrap: 'balance' }}>{choice.type === 'upgrade' && primaryBenefits.length ? <>{primaryBenefits.map(line => <p key={line}>{line}</p>)}</> : <p>{presentation.subtitle}</p>}</div>
                <div>{choice.type === 'upgrade' ? <p className="mb-1 text-sm font-semibold leading-5">{presentation.subtitle}</p> : null}{detail.description ? <p className="mb-2 text-sm leading-5 [overflow-wrap:anywhere]">{detail.description}</p> : null}</div>
                <div>{detail.stats.length ? <div className="mb-3 flex flex-wrap justify-center gap-x-3 gap-y-0 px-2 py-1.5 text-sm leading-5">{detail.stats.filter(stat => choice.type !== 'upgrade' || !primaryBenefits.some(line => stat.startsWith(`${line.split(' ')[0]} `))).map((stat, index) => <span key={index} className="[overflow-wrap:anywhere]">{choice.type === 'upgrade' && /^(伤害|射程|射击间隔)\s/.test(stat) ? presentation.comparisons.find(line => line.startsWith(`${stat.split(' ')[0]} `)) ?? stat : formatRewardStat(stat)}</span>)}</div> : null}</div>
                <span className="flex min-h-12 items-center justify-center border-[1.5px] px-2 py-2 text-base font-extrabold" style={originalSkin(...style.skin)}>{style.cta}</span>
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
