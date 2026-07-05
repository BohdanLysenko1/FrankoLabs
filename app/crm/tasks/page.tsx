import type { Metadata } from "next";
import TasksView from "@/components/crm/TasksView";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return <TasksView />;
}
