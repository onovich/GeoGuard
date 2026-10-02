# r03：批准的状态资格与来源命中 DTO

唯一依据 integration/submissions/r02/status-api-addendum.md 与 reviews/hit-source-and-status-addendum.md。前期states.healing/fusing和顶层range/progress设想未采用；本r03只消费批准字段，无同义字段或第二套接口。入口仍drawActorOverlay(...,'status') / drawWorldItem(... kind='feedback')，API/schemaVersion不变。

|字段|world消费与真实依据|未知与失效|
|---|---|---|
|actor.hp|新增资格均要求hp>0|死亡/缺失不绘资格|
|states.jammed:boolean|实际纯getTowerFireRateFactor查询的活塔资格；只清副本冻结字段以区分干扰与冻结|只显式true绘S04双紫波/X；不按身份猜|
|healAura={active,range,amount,eligibleTargetKeys}|活且非机关/已出土source，target资格来自真实engine遍历。world要求active===true、有限range>0、有实际eligibleTargetKeys，按range画S15稀疏sage资格环|目标满血仍属资格；不产生正回血、成功闪或金额。无实际资格/缺字段不画|
|jamAura={active,range,fireRateFactor}|保留真实source配置；world不以此对象替代塔states.jammed权威|不由JAMMER身份/半径推断新的危险盘|
|fuse={active,remaining,duration,radius}|活、非机关、已出土、真实点燃；world要求active===true与有限positive remaining/duration，纯计算clamp(1-remaining/duration)|null/未点燃/到期不画；配置radius始终不绘成危险区|

引信只绘actor.radius+5局部蜂蜜S15资格时钟。治疗S15是sage断续外圈，无填充/珊瑚危险外边；中心是actor.x/y，与真实healAura origin一致。JAM外置波/X、治疗外置plus只是状态符号，不新增器官。暂停完全依DTO固定，无world计时器。

来源hit沿已批准第三参观察接线：WorldItem.sourceArtId（或data.sourceArtId）、data.projectileKind、sourceKey/shotIndex均来自真实直接/溅射伤害通知的标量副本；位置来自真实命中，生命周期沿sidecar。已有三命中家族不改造型；kind优先，若kind缺但source已知按静态manifest的既有kind复用。source与kind都缺时generic basic，不计来源覆盖；不按color/弹体消失猜测。

dto-bindings.json记录此轮读取的adapter快照。world只写自己的消费者；真实引擎观察通知/sidecar接线及逐帧无差异证明仍归integration/QA。
