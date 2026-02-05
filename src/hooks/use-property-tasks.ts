"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type PropertyTask = Database["public"]["Tables"]["property_tasks"]["Row"];

interface UsePropertyTasksOptions {
  propertyId: string;
  phase?: string; // Optional: filter by phase
}

export function usePropertyTasks({ propertyId, phase }: UsePropertyTasksOptions) {
  const [tasks, setTasks] = useState<PropertyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updating, setUpdating] = useState(false);
  const supabase = createClient();

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!propertyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("property_tasks")
        .select("*")
        .eq("property_id", propertyId);

      if (phase) {
        query = query.eq("phase", phase);
      }

      const { data, error: fetchError } = await query.order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      setTasks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al cargar tareas"));
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [propertyId, phase, supabase]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Get task by type
  const getTask = useCallback((taskType: string, taskPhase?: string) => {
    const phaseToUse = taskPhase || phase;
    return tasks.find(
      (t) => t.task_type === taskType && (!phaseToUse || t.phase === phaseToUse)
    );
  }, [tasks, phase]);

  // Check if task is completed
  const isTaskCompleted = useCallback((taskType: string, taskPhase?: string) => {
    const task = getTask(taskType, taskPhase);
    return task?.is_completed || false;
  }, [getTask]);

  // Get task data
  const getTaskData = useCallback((taskType: string, taskPhase?: string) => {
    const task = getTask(taskType, taskPhase);
    return task?.task_data || {};
  }, [getTask]);

  // Update or create task
  const updateTask = useCallback(async (
    taskType: string,
    taskPhase: string,
    updates: {
      is_completed?: boolean;
      task_data?: Record<string, any>;
    }
  ) => {
    if (!propertyId) {
      throw new Error("Property ID is required");
    }

    try {
      setUpdating(true);
      setError(null);

      // Check if task exists
      const { data: existing } = await supabase
        .from("property_tasks")
        .select("id")
        .eq("property_id", propertyId)
        .eq("phase", taskPhase)
        .eq("task_type", taskType)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing task
        const updateData: any = {
          ...updates,
          updated_at: new Date().toISOString(),
        };

        // Set completed_at if completing the task
        if (updates.is_completed === true) {
          updateData.completed_at = new Date().toISOString();
        } else if (updates.is_completed === false) {
          updateData.completed_at = null;
        }

        const { data, error: updateError } = await supabase
          .from("property_tasks")
          .update(updateData)
          .eq("id", existing.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = data;
      } else {
        // Create new task
        const insertData: any = {
          property_id: propertyId,
          phase: taskPhase,
          task_type: taskType,
          is_completed: updates.is_completed || false,
          task_data: updates.task_data || {},
        };

        if (insertData.is_completed) {
          insertData.completed_at = new Date().toISOString();
        }

        const { data, error: insertError } = await supabase
          .from("property_tasks")
          .insert(insertData)
          .select()
          .single();

        if (insertError) throw insertError;
        result = data;
      }

      // Update local state
      setTasks((prev) => {
        const filtered = prev.filter(
          (t) => !(t.property_id === propertyId && t.phase === taskPhase && t.task_type === taskType)
        );
        return [...filtered, result];
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Error al actualizar tarea");
      setError(error);
      console.error("Error updating task:", err);
      throw error;
    } finally {
      setUpdating(false);
    }
  }, [propertyId, supabase]);

  // Get tasks by phase
  const tasksByPhase = useMemo(() => {
    const grouped: Record<string, PropertyTask[]> = {};
    tasks.forEach((task) => {
      if (!grouped[task.phase]) {
        grouped[task.phase] = [];
      }
      grouped[task.phase].push(task);
    });
    return grouped;
  }, [tasks]);

  return {
    tasks,
    tasksByPhase,
    loading,
    error,
    updating,
    updateTask,
    getTask,
    isTaskCompleted,
    getTaskData,
    refetch: fetchTasks,
  };
}
