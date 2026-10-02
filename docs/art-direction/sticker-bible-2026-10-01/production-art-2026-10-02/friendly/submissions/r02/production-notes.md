# Friendly r02 最终规范候选

主审reviews/friendly-r01.md正式accepted第一包，并授权剩余七塔。r01文件保持不变。此次新增四张内置image_gen原画规范板：CANNON/SNIPER、RAIL/RAPID、MORTAR/FROST、SENTINEL。所有引用图生成前实际view_image查看，沿用各identity最新已批母版，不重新换造型。

新增主行均为常态/压缩/拉伸/原地攻击四格，固定双脚中线root，无弹体/闪光/轨迹/他人。各板技术分栏示意刚性炮组与P/M、独立身体层；不是独立机关或可运行源资源。自检返修：RAIL/RAPID把P从腹部移至炮组连接处并将root十字对齐地线；MORTAR/FROST修正‘鳍刚性’误说明为软器官局部变形/数量根部守恒，炮口刚性。

production-split.json保留全部规定字段，106/106 bodyReference现在只指向r01/r02新body-only板和具体角色行/命名格/列。DIR/LV明确复用新NEUTRAL格＋挂点旋转/外点徽；PLAYER AUTO_ATTACK复用新ATTACK。旧板仅在provenance中留历史身份溯源，不作为最终身体资源，不出现在默认index图片。

r01三张accepted继续复用；新增四张submitted待主审。候选‘final’仅指本轮美术规范候选，不自标通过、不宣称生产动画就绪。挂点、角度和固定画布仍proposed，未实测；仅纸面原地设计，不要求连续帧/透明源稿/实机性能。生成板的线宽与比例误差不作为rig测量，后续真正源稿保持同一炮组刚性实例。本轮无src修改、代码接入、玩法改动、Git提交/部署。

独立弹体/枪口/命中/等级徽需求沿用r01与effects-ui；body提交无需等待它们制成。当前真实中心发射点、kind来源区分限制、RAIL/RAPID每次单弹、BURST level3五发与四孔不耦合全部保留。HIVE optimized/fallback纠正继续保留在JSON，不扩展Boss范围。

默认浏览入口index.html仅7张新板（3已过+4新候选），并有完整106条动作映射表。prompts.json记录最终提示词集与局部返修，全部builtin_image_gen，无CLI/API fallback。

