import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Project } from "@/lib/data";

export function ProjectSelect({ projects, value, onChange }: { projects?: Project[]; value?: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-64"><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
      <SelectContent>
        {projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
