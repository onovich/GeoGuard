# r11 尺度r03 / HUD入口修复 READY

已保留获批PLAYER40.1×74.1、BASIC塔75.3×71.6、BASIC敌59×58。TANK统一比例增加1.35，预计108.3×75.3，相对普通体约1.84宽/1.30高，保持原像素比例、不拉单轴。master-density-comparison同密度图同步。

all-identities-scale-runtime.html实际48源body绘制及透明bounds表，逻辑半径从真实catalog及真实Boss构造器（含双子）获取；机制default13/wall18明确catalog默认样本。未把文档默认半径冒用真实所有触发对象半径。

hud-health-runtime.html已import真实/src/styles/index.css，使用真实Tailwind组件且三.relative stage隔离。此前未引入CSS入口作废，不以坏QA判产品必坏。原图框与动态内缩fill分层不变，仍请验0/11/50/100及单/双Boss。
