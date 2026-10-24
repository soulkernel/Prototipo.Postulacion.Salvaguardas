"use client";
import { useEffect, useRef, useState } from "react";
import {
  ragEvent,
  ragFailure,
  ragInput,
  readRagLines,
  type RagCode,
  type RagInput,
  type RagResult,
  type RagStage,
} from "@/lib/rag-session";

export function useRagQuery() {
  const controller = useRef<AbortController | null>(null),
    sequence = useRef(0);
  const [pending, setPending] = useState(false),
    [seconds, setSeconds] = useState(0);
  const [stage, setStage] = useState<RagStage>({ stage: "connecting" });
  const [seen, setSeen] = useState<string[]>([]);
  const [error, setError] = useState<RagCode | null>(null),
    [requestId, setRequestId] = useState("");
  const [result, setResult] = useState<RagResult | null>(null),
    [history, setHistory] = useState<RagResult[]>([]);
  useEffect(
    () => () => {
      sequence.current++;
      controller.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (!pending) return;
    const start = performance.now(),
      timer = setInterval(
        () => setSeconds((performance.now() - start) / 1000),
        250,
      );
    return () => clearInterval(timer);
  }, [pending]);
  async function run(input: RagInput) {
    if (controller.current) return;
    setResult(null);
    setRequestId("");
    setError(null);
    setSeen([]);
    setSeconds(0);
    if (!ragInput.safeParse(input).success) {
      setError("invalid");
      return;
    }
    if (!navigator.onLine) {
      setError("offline");
      return;
    }
    const current = ++sequence.current,
      abort = new AbortController();
    controller.current = abort;
    setPending(true);
    setStage({ stage: "connecting" });
    let terminal = false;
    try {
      const response = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(80000)]),
      });
      const receive = (value: unknown) => {
        if (sequence.current !== current) return;
        const event = ragEvent.parse(value);
        if (terminal) throw new Error("invalid-response");
        if (event.type === "stage") {
          setStage(event);
          setSeen((old) =>
            old.includes(event.stage) ? old : [...old, event.stage],
          );
          setRequestId(event.requestId);
        }
        if (event.type === "error") {
          terminal = true;
          setError(event.code);
          setRequestId(event.requestId || "");
        }
        if (event.type === "result") {
          if (
            event.result.method !== input.method ||
            event.result.query !== input.query.trim()
          )
            throw new Error("invalid-response");
          terminal = true;
          setResult(event.result);
          setHistory((old) => [event.result, ...old].slice(0, 5));
          setRequestId(event.result.requestId);
        }
      };
      if (!response.ok) receive(await response.json());
      else {
        if (
          !response.headers
            .get("content-type")
            ?.includes("application/x-ndjson")
        )
          throw new Error("invalid-response");
        await readRagLines(response, receive);
      }
      if (!terminal) throw new Error("invalid-response");
    } catch (failure) {
      if (sequence.current === current)
        setError(!navigator.onLine ? "offline" : ragFailure(failure));
    } finally {
      if (sequence.current === current) {
        controller.current = null;
        setPending(false);
      }
    }
  }
  function cancel() {
    sequence.current++;
    controller.current?.abort();
    controller.current = null;
    setPending(false);
    setResult(null);
    setError("cancelled");
  }
  function reset() {
    setResult(null);
    setError(null);
    setRequestId("");
  }
  function restore(value: RagResult) {
    if (!controller.current) {
      reset();
      setResult(value);
      setRequestId(value.requestId);
    }
  }
  return {
    run,
    cancel,
    reset,
    restore,
    result,
    history,
    clearHistory: () => setHistory([]),
    pending,
    error,
    requestId,
    seconds,
    stage,
    seen,
  };
}
