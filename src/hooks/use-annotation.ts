"use client";

import { useReducer, useCallback } from "react";
import type { Annotation } from "@/types";

interface AnnotationState {
  annotations: Annotation[];
  history: Annotation[][];
  historyIndex: number;
}

type AnnotationAction =
  | { type: "ADD"; annotation: Annotation }
  | { type: "UPDATE"; id: string; changes: Partial<Annotation> }
  | { type: "REMOVE"; id: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_ALL"; annotations: Annotation[] }
  | { type: "CLEAR" };

function reducer(
  state: AnnotationState,
  action: AnnotationAction
): AnnotationState {
  switch (action.type) {
    case "ADD": {
      const newAnnotations = [...state.annotations, action.annotation];
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        newAnnotations,
      ];
      return {
        annotations: newAnnotations,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
    case "UPDATE": {
      const newAnnotations = state.annotations.map((a) =>
        a.id === action.id ? ({ ...a, ...action.changes } as Annotation) : a
      );
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        newAnnotations,
      ];
      return {
        annotations: newAnnotations,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
    case "REMOVE": {
      const newAnnotations = state.annotations.filter(
        (a) => a.id !== action.id
      );
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        newAnnotations,
      ];
      return {
        annotations: newAnnotations,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
    case "UNDO": {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        annotations: state.history[newIndex],
        historyIndex: newIndex,
      };
    }
    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        annotations: state.history[newIndex],
        historyIndex: newIndex,
      };
    }
    case "SET_ALL": {
      return {
        annotations: action.annotations,
        history: [action.annotations],
        historyIndex: 0,
      };
    }
    case "CLEAR": {
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        [],
      ];
      return {
        annotations: [],
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
  }
}

const initialState: AnnotationState = {
  annotations: [],
  history: [[]],
  historyIndex: 0,
};

export function useAnnotation(initial?: Annotation[]) {
  const [state, dispatch] = useReducer(
    reducer,
    initial
      ? { annotations: initial, history: [initial], historyIndex: 0 }
      : initialState
  );

  const addAnnotation = useCallback(
    (annotation: Annotation) => dispatch({ type: "ADD", annotation }),
    []
  );

  const updateAnnotation = useCallback(
    (id: string, changes: Partial<Annotation>) =>
      dispatch({ type: "UPDATE", id, changes }),
    []
  );

  const removeAnnotation = useCallback(
    (id: string) => dispatch({ type: "REMOVE", id }),
    []
  );

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);
  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const setAll = useCallback(
    (annotations: Annotation[]) => dispatch({ type: "SET_ALL", annotations }),
    []
  );

  return {
    annotations: state.annotations,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    undo,
    redo,
    clear,
    setAll,
  };
}
