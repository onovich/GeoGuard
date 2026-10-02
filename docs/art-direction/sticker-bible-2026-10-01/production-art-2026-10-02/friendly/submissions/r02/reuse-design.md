# 方向与等级复用设计

<a id="directions"></a>
## DIR：常态新身体＋显式局部转向

每条DIR在production-split.json中指定具体新板、角色行、NEUTRAL第1格。默认相机保持批准的三分之四正交视图；无新方向身体图、无器官变化。只旋转独立刚性炮组，body/face/feet/root不整体换视角。P是炮组连接身体的根部，M是出口中心；P/M引线和点是语义设计，不是已测像素。

采用proposed二维轴约定：+X向右、+Y向下；DIR_RIGHT目标轴0°、DIR_UP目标轴−90°、DIR_LEFT目标轴180°。delta=wrap(目标轴−neutralAxis)；MORTAR常态杯嘴中轴提出−45°，其余塔常态提出0°，均须将来源稿确认。旋转围绕P，不改变身体root与碰撞中心偏移。真实攻击朝向读取目标角度，可360°；三向只是设计核验参考，不增加机械限位。

RAIL/RAPID双管始终同一刚性组；BURST四孔始终一个平面刚性组，孔径/2×2排布守恒；MORTAR杯口不挤压。左右不自动镜像全部身体和脸；UP不换俯视相机。技术构造分栏中的炮口前视仅示孔数，不是默认身体视角。

PLAYER两DIR复用r01 PLAYER NEUTRAL第1格，只提出相对固定底root的−5°/+5°局部倾斜与单叶局部摆动（proposed）。保持一叶、无五官/手脚/炮；真实位移由逻辑提供。AUTO_ATTACK复用PLAYER ATTACK第4格及独立发射需求。

<a id="levels"></a>
## LV：同身体＋外置点徽

|参考|逻辑level|复用格|外部UI徽|
|---|---|---|---|
|LV1|0|本身份新板NEUTRAL第1格|1点|
|LV2|1|同上|2点|
|LV3|2|同上|3点|
|LV4|3|同上|4点|

点徽是root相关UI叠层，位于固定源绘制边界上方，不烘焙到body，不成为新增芽/眼/孔。绘制尺寸与间距由effects-ui独立设计，此处不声明可运行徽记资源。身体色块、脸与发射器无等级增生。保留既有奖励/调试升级规则，不引入收费升级。BURST level3的5发由真实burstCount决定，四孔固定不变。

## 各关键姿态具体格

NEUTRAL/SQUASH/STRETCH/ATTACK分别为每角色行从左到右第1/2/3/4格；每格body-only。压缩/拉伸只改变软组织，脚中心root固定。炮组由同一刚性源实例设计，不能从每格轮廓随意缩放组装。攻击只作原地局部形变，弹体、闪光、轨迹均独立。本包没有整角色后坐偏移请求。

r01已过的BASIC、BURST、PLAYER板继续复用，不修改r01。r02所有新增板等待主审。106条映射逐项列出path/row/cell/column/transform/levelOverlay，默认索引不展示旧含弹体图。

