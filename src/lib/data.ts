import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Asset = Database["public"]["Tables"]["assets"]["Row"];
export type MusicTrack = Database["public"]["Tables"]["music_tracks"]["Row"];
export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type Render = Database["public"]["Tables"]["renders"]["Row"];
export type EditPlan = Database["public"]["Tables"]["edit_plans"]["Row"];
export type EditingProfile = Database["public"]["Tables"]["editing_profiles"]["Row"];

async function must<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const useProjects = (includeArchived = false) =>
  useQuery({
    queryKey: ["projects", includeArchived],
    queryFn: () => {
      let q = supabase.from("projects").select("*").order("updated_at", { ascending: false });
      if (!includeArchived) q = q.eq("archived", false);
      return must<Project[]>(q);
    },
  });

export const useProject = (id?: string) =>
  useQuery({
    queryKey: ["project", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id!).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

export const useAssets = (projectId?: string) =>
  useQuery({
    queryKey: ["assets", projectId ?? "all"],
    queryFn: () => {
      let q = supabase.from("assets").select("*").order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      return must<Asset[]>(q);
    },
  });

export const useMusic = (projectId?: string) =>
  useQuery({
    queryKey: ["music", projectId ?? "all"],
    queryFn: () => {
      let q = supabase.from("music_tracks").select("*").order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      return must<MusicTrack[]>(q);
    },
  });

export const useJobs = (projectId?: string) =>
  useQuery({
    queryKey: ["jobs", projectId ?? "all"],
    queryFn: () => {
      let q = supabase.from("jobs").select("*").order("created_at", { ascending: false }).limit(200);
      if (projectId) q = q.eq("project_id", projectId);
      return must<Job[]>(q);
    },
  });

export const useRenders = (projectId?: string) =>
  useQuery({
    queryKey: ["renders", projectId ?? "all"],
    queryFn: () => {
      let q = supabase.from("renders").select("*").order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      return must<Render[]>(q);
    },
  });

export const usePlans = (projectId?: string) =>
  useQuery({
    queryKey: ["plans", projectId],
    enabled: !!projectId,
    queryFn: () => must<EditPlan[]>(supabase.from("edit_plans").select("*").eq("project_id", projectId!).order("version", { ascending: false })),
  });

export const useEditingProfiles = () =>
  useQuery({
    queryKey: ["editing_profiles"],
    queryFn: () => must<EditingProfile[]>(supabase.from("editing_profiles").select("*").order("created_at", { ascending: false })),
  });

/** Live updates for jobs and renders; invalidates cached lists on change. */
export function useLiveJobs() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel(`live-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
        qc.invalidateQueries({ queryKey: ["jobs"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "renders" }, () => {
        qc.invalidateQueries({ queryKey: ["renders"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);
}

const DEMO_KEY = "ars-demo-mode";
export function useDemoMode() {
  const [demo, setDemo] = useState(false);
  useEffect(() => setDemo(localStorage.getItem(DEMO_KEY) === "1"), []);
  return [
    demo,
    (v: boolean) => {
      localStorage.setItem(DEMO_KEY, v ? "1" : "0");
      setDemo(v);
    },
  ] as const;
}

export function useProjectPicker(projects?: Project[]) {
  const [id, setId] = useState<string | undefined>();
  useEffect(() => {
    if (!id && projects?.length) setId(projects[0].id);
  }, [projects, id]);
  return [id, setId] as const;
}
