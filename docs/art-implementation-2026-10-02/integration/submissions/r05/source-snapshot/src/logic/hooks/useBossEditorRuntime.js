import { useRef, useState } from 'react';
import {
  applyBossEditorDraft,
  BOSS_ABILITY_LIBRARY,
  buildBossEditorDraft,
  createBossBehaviorNode,
  DEFAULT_BOSS_ABILITY_COOLDOWNS,
  parseBossEditorDraft,
  serializeBossEditorDraft,
} from '../engine/bossAuthoringRules.js';

export default function useBossEditorRuntime({ bossOrder, getBossEditorBaseTemplate, isDebugMode }) {
  const nodeIdRef = useRef(1);
  const [state, setState] = useState(() => ({
    selectedBossId: bossOrder[0],
    useDraftOverrides: true,
    drafts: Object.fromEntries(
      bossOrder.map((bossId) => {
        const bossTemplate = getBossEditorBaseTemplate(bossId);
        return [bossId, bossTemplate ? buildBossEditorDraft(bossTemplate) : null];
      })
    ),
  }));

  const ensureDraftMap = (drafts, bossId) => {
    if (drafts[bossId]) {
      return drafts;
    }

    const bossTemplate = getBossEditorBaseTemplate(bossId);
    if (!bossTemplate) {
      return drafts;
    }

    return {
      ...drafts,
      [bossId]: buildBossEditorDraft(bossTemplate),
    };
  };

  const patchSelectedDraft = (updater) => {
    setState((previous) => {
      const drafts = ensureDraftMap(previous.drafts, previous.selectedBossId);
      const currentDraft = drafts[previous.selectedBossId];
      return {
        ...previous,
        drafts: {
          ...drafts,
          [previous.selectedBossId]: updater(currentDraft),
        },
      };
    });
  };

  const draft = state.drafts[state.selectedBossId] ?? buildBossEditorDraft(getBossEditorBaseTemplate(state.selectedBossId));
  const abilityOptions = Object.values(BOSS_ABILITY_LIBRARY).sort((left, right) => left.label.localeCompare(right.label));

  const applyDebugBossAuthoring = (bossTemplate) => {
    if (!isDebugMode() || !state.useDraftOverrides || !bossTemplate?.id) {
      return bossTemplate;
    }

    const authoredDraft = state.drafts[bossTemplate.id];
    return authoredDraft ? applyBossEditorDraft(bossTemplate, authoredDraft) : bossTemplate;
  };

  const setSelectedBossId = (bossId) => {
    setState((previous) => ({
      ...previous,
      selectedBossId: bossId,
      drafts: ensureDraftMap(previous.drafts, bossId),
    }));
  };

  const setUseDraftOverrides = (value) => {
    setState((previous) => ({
      ...previous,
      useDraftOverrides: value,
    }));
  };

  const updateIdentity = (patch) => {
    patchSelectedDraft((currentDraft) => ({
      ...currentDraft,
      ...patch,
    }));
  };

  const updatePhase = (phaseIndex, patch) => {
    patchSelectedDraft((currentDraft) => ({
      ...currentDraft,
      phases: currentDraft.phases.map((phase, index) => (index === phaseIndex ? { ...phase, ...patch } : phase)),
    }));
  };

  const addNode = (phaseIndex, abilityId = Object.keys(DEFAULT_BOSS_ABILITY_COOLDOWNS)[0]) => {
    patchSelectedDraft((currentDraft) => ({
      ...currentDraft,
      phases: currentDraft.phases.map((phase, index) =>
        index === phaseIndex
          ? {
              ...phase,
              nodes: [
                ...phase.nodes,
                createBossBehaviorNode(abilityId, phaseIndex, phase.nodes.length, {
                  id: `draft-node-${nodeIdRef.current++}`,
                }),
              ],
            }
          : phase
      ),
    }));
  };

  const updateNode = (phaseIndex, nodeId, patch) => {
    patchSelectedDraft((currentDraft) => ({
      ...currentDraft,
      phases: currentDraft.phases.map((phase, index) =>
        index === phaseIndex
          ? {
              ...phase,
              nodes: phase.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
            }
          : phase
      ),
    }));
  };

  const removeNode = (phaseIndex, nodeId) => {
    patchSelectedDraft((currentDraft) => ({
      ...currentDraft,
      phases: currentDraft.phases.map((phase, index) =>
        index === phaseIndex
          ? {
              ...phase,
              nodes: phase.nodes.filter((node) => node.id !== nodeId),
            }
          : phase
      ),
    }));
  };

  const resetDraft = () => {
    const bossTemplate = getBossEditorBaseTemplate(state.selectedBossId);
    if (!bossTemplate) {
      return;
    }

    setState((previous) => ({
      ...previous,
      drafts: {
        ...previous.drafts,
        [previous.selectedBossId]: buildBossEditorDraft(bossTemplate),
      },
    }));
  };

  const importDraft = (serializedDraft) => {
    const bossTemplate = getBossEditorBaseTemplate(state.selectedBossId);
    if (!bossTemplate) {
      return { ok: false, error: 'Unknown boss' };
    }

    try {
      const parsedDraft = parseBossEditorDraft(serializedDraft, bossTemplate);
      setState((previous) => ({
        ...previous,
        drafts: {
          ...previous.drafts,
          [previous.selectedBossId]: {
            ...parsedDraft,
            bossId: previous.selectedBossId,
          },
        },
      }));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to parse boss draft' };
    }
  };

  return {
    selectedBossId: state.selectedBossId,
    useDraftOverrides: state.useDraftOverrides,
    draft,
    abilityOptions,
    setSelectedBossId,
    setUseDraftOverrides,
    updateIdentity,
    updatePhase,
    addNode,
    updateNode,
    removeNode,
    resetDraft,
    importDraft,
    exportDraft: serializeBossEditorDraft(draft),
    applyDebugBossAuthoring,
  };
}
