# Source-pixel ground shadow candidate

Runtime world load decodes only root-shadow-ground.png once. Production shadow overlay uses drawImage, no ellipse path or radial gradient. Original crop/inferred matte and source SHA: root-shadow-source.json; derivative chain root-shadow-ground-source.json records RGB brightness .30 and alpha .16. World root unchanged, independent body squash; burrowed suppresses shadow. Width follows real alpha-body width *.76 capped by existing radius*2.5, minimum12. No collision change.

Actual production-module QA shadow-runtime-preview.html?art=tower:BURST (also hero:PLAYER, enemy:FAST/TANK/SPLINTER/PHASE). Body and overlay actual calls, guides QA-only. Need real cream arena/body-size/hop/state review; not final VF11/12 approval. Build passes. No old program-shadow fallback. Remaining status rings/FX/projectiles pending.
