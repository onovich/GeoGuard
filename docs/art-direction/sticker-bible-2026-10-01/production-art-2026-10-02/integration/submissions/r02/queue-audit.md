# 通信队列最终提交审计

全部旧封存packet SHA一致，每组当前READY及所有历史封包均有主审结果。friendly r02 changes_requested只退方向说明，r03已修复并accepted。

|组|版本|当前READY|主审结果|证据|
|---|---|---|---|---|
|friendly|r01|False|accepted|[review](../../../reviews/friendly-r01.md)|
|friendly|r02|False|changes_requested|[review](../../../reviews/friendly-r02.md)|
|friendly|r03|True|accepted|[review](../../../reviews/friendly-r03.md)|
|enemies|r01|False|accepted|[review](../../../reviews/enemies-r01.md)|
|enemies|r02|True|accepted|[review](../../../reviews/enemies-r02.md)|
|bosses-mechanics|r01|False|accepted|[review](../../../reviews/bosses-mechanics-r01.md)|
|bosses-mechanics|r02|False|accepted|[review](../../../reviews/bosses-mechanics-r02.md)|
|bosses-mechanics|r03|True|accepted|[review](../../../reviews/bosses-mechanics-r03.md)|
|effects-ui|r01|False|accepted|[review](../../../reviews/effects-ui-r01.md)|
|effects-ui|r02|True|accepted|[review](../../../reviews/effects-ui-r02.md)|
|integration|r01|True|accepted|[review](../../../reviews/integration-r01.md)|

本次新增integration r02：submitted/awaiting_primary_review；READY发布后保持可见，主审需新增对应结果。不得把新提交自审为accepted。
