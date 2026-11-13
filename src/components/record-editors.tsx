import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { Pencil, Plus } from "lucide-react";
import { useRouter } from "@/lib/navigation";
import { useState, type FormEvent } from "react";
import { addClient, addProject, editClient, editProject } from "@/app/actions/records";
import type { ClientOption, ProjectOption } from "@/lib/project-schema";
import {
  ClientForm,
  emptyClient,
  emptyProject,
  focusField,
  ProjectForm,
  type ClientDraft,
  type FormError,
  type ProjectDraft,
} from "./record-forms";
import { Sheet } from "./sheet";

/**
 * Whether an editor's sheet is showing. The editor stays on the page while closed so the sheet can slide
 * away; `key` changes on every `show`, so each opening starts from a clean form.
 */
export function useSheet() {
  const [state, setState] = useState({ open: false, key: 0 });
  return {
    open: state.open,
    key: state.key,
    show: () => setState((s) => ({ open: true, key: s.key + 1 })),
    hide: () => setState((s) => ({ ...s, open: false })),
  };
}

/**
 * Create or edit a project in a sheet, with a nested step to add its client on the spot. Used by the
 * new-estimate flow and the Projects and Clients pages.
 */
export function ProjectEditor({
  open = true,
  projectId,
  initial = emptyProject,
  clients: initialClients,
  onClose,
  onBack,
  onSaved,
}: {
  open?: boolean;
  projectId?: string;
  initial?: ProjectDraft;
  clients: ClientOption[];
  onClose: () => void;
  onBack?: () => void;
  onSaved: (project: ProjectOption | { id: string }) => void;
}) {
  const [view, setView] = useState<"project" | "client">("project");
  const [clients, setClients] = useState(initialClients);
  const [project, setProject] = useState(initial);
  const [client, setClient] = useState(emptyClient);
  const [error, setError] = useState<FormError>(null);
  const [busy, setBusy] = useState(false);

  async function saveProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const res = projectId ? await editProject(projectId, project) : await addProject(project);
    setBusy(false);
    if (!res.ok) {
      setError({ message: res.error, field: res.field });
      focusField(res.field);
      return;
    }
    onSaved(res.value);
  }

  async function saveClient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const res = await addClient(client);
    setBusy(false);
    if (!res.ok) {
      setError({ message: res.error, field: res.field });
      focusField(res.field === "name" ? "clientName" : res.field);
      return;
    }
    setClients((cs) => [...cs, res.value].sort((a, b) => a.name.localeCompare(b.name)));
    setProject((p) => ({ ...p, clientId: res.value.id, siteAddress: p.siteAddress || res.value.address || "" }));
    setClient(emptyClient);
    setError(null);
    setView("project");
  }

  return (
    <>
      <Sheet
        open={open && view === "project"}
        title={projectId ? "Edit project" : "New project"}
        onClose={onClose}
        onBack={onBack}
        action={projectId ? "Save" : "Create"}
        busy={busy}
        onSubmit={saveProject}
      >
        <ProjectForm
          value={project}
          onChange={setProject}
          clients={clients}
          error={view === "project" ? error : null}
          onNewClient={() => {
            setError(null);
            setView("client");
          }}
        />
      </Sheet>
      <Sheet
        open={open && view === "client"}
        title="New client"
        onClose={onClose}
        back="Back to the project"
        onBack={() => {
          setError(null);
          setView("project");
        }}
        action="Add client"
        busy={busy}
        onSubmit={saveClient}
      >
        <ClientForm value={client} onChange={setClient} error={view === "client" ? error : null} />
      </Sheet>
    </>
  );
}

export function ClientEditor({
  open = true,
  clientId,
  initial = emptyClient,
  onClose,
  onSaved,
}: {
  open?: boolean;
  clientId?: string;
  initial?: ClientDraft;
  onClose: () => void;
  onSaved: (client: ClientOption) => void;
}) {
  const [client, setClient] = useState(initial);
  const [error, setError] = useState<FormError>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const res = clientId ? await editClient(clientId, client) : await addClient(client);
    setBusy(false);
    if (!res.ok) {
      setError({ message: res.error, field: res.field });
      focusField(res.field === "name" ? "clientName" : res.field);
      return;
    }
    onSaved(res.value);
  }

  return (
    <Sheet
      open={open}
      title={clientId ? "Edit client" : "New client"}
      onClose={onClose}
      action={clientId ? "Save" : "Add client"}
      busy={busy}
      onSubmit={save}
    >
      <ClientForm value={client} onChange={setClient} error={error} />
    </Sheet>
  );
}

/** Page-level buttons that open an editor and then show the result. */
export function NewProjectButton({
  clients,
  clientId,
  label = "New project",
  variant = "secondary",
}: {
  clients: ClientOption[];
  clientId?: string;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const sheet = useSheet();
  return (
    <>
      <Button label={label} variant={variant} icon={<Icon icon={Plus} />} onClick={sheet.show} />
      {sheet.key > 0 && (
        <ProjectEditor
          key={sheet.key}
          open={sheet.open}
          clients={clients}
          initial={clientId ? { ...emptyProject, clientId, siteAddress: clients.find((c) => c.id === clientId)?.address ?? "" } : undefined}
          onClose={sheet.hide}
          onSaved={(p) => router.push(`/projects/${p.id}`)}
        />
      )}
    </>
  );
}

export function EditProjectButton({ projectId, initial, clients }: { projectId: string; initial: ProjectDraft; clients: ClientOption[] }) {
  const router = useRouter();
  const sheet = useSheet();
  return (
    <>
      <Button label="Edit" variant="secondary" icon={<Icon icon={Pencil} />} onClick={sheet.show} />
      {sheet.key > 0 && (
        <ProjectEditor
          key={sheet.key}
          open={sheet.open}
          projectId={projectId}
          initial={initial}
          clients={clients}
          onClose={sheet.hide}
          onSaved={() => {
            sheet.hide();
            router.refresh();
          }}
        />
      )}
    </>
  );
}

export function NewClientButton({ variant = "secondary" }: { variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const sheet = useSheet();
  return (
    <>
      <Button label="New client" variant={variant} icon={<Icon icon={Plus} />} onClick={sheet.show} />
      {sheet.key > 0 && (
        <ClientEditor key={sheet.key} open={sheet.open} onClose={sheet.hide} onSaved={(c) => router.push(`/clients/${c.id}`)} />
      )}
    </>
  );
}

export function EditClientButton({ clientId, initial }: { clientId: string; initial: ClientDraft }) {
  const router = useRouter();
  const sheet = useSheet();
  return (
    <>
      <Button label="Edit" variant="secondary" icon={<Icon icon={Pencil} />} onClick={sheet.show} />
      {sheet.key > 0 && (
        <ClientEditor
          key={sheet.key}
          open={sheet.open}
          clientId={clientId}
          initial={initial}
          onClose={sheet.hide}
          onSaved={() => {
            sheet.hide();
            router.refresh();
          }}
        />
      )}
    </>
  );
}
