"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { buttonClass } from "./ui";

/**
 * Create or edit a project in a sheet, with a nested step to add its client on the spot. Used by the
 * new-estimate flow and the Projects and Clients pages.
 */
export function ProjectEditor({
  projectId,
  initial = emptyProject,
  clients: initialClients,
  onClose,
  onBack,
  onSaved,
}: {
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

  if (view === "client") {
    return (
      <Sheet
        open
        title="New client"
        onClose={onClose}
        onBack={() => {
          setError(null);
          setView("project");
        }}
        action="Add client"
        busy={busy}
        onSubmit={saveClient}
      >
        <ClientForm value={client} onChange={setClient} error={error} />
      </Sheet>
    );
  }

  return (
    <Sheet
      open
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
        error={error}
        onNewClient={() => {
          setError(null);
          setView("client");
        }}
      />
    </Sheet>
  );
}

export function ClientEditor({
  clientId,
  initial = emptyClient,
  onClose,
  onSaved,
}: {
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
      open
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
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass(variant, "md")}>
        <Plus className="size-4" aria-hidden />
        {label}
      </button>
      {open && (
        <ProjectEditor
          clients={clients}
          initial={clientId ? { ...emptyProject, clientId, siteAddress: clients.find((c) => c.id === clientId)?.address ?? "" } : undefined}
          onClose={() => setOpen(false)}
          onSaved={(p) => router.push(`/projects/${p.id}`)}
        />
      )}
    </>
  );
}

export function EditProjectButton({ projectId, initial, clients }: { projectId: string; initial: ProjectDraft; clients: ClientOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "md")}>
        <Pencil className="size-4" aria-hidden />
        Edit
      </button>
      {open && (
        <ProjectEditor
          projectId={projectId}
          initial={initial}
          clients={clients}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

export function NewClientButton({ variant = "secondary" }: { variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass(variant, "md")}>
        <Plus className="size-4" aria-hidden />
        New client
      </button>
      {open && <ClientEditor onClose={() => setOpen(false)} onSaved={(c) => router.push(`/clients/${c.id}`)} />}
    </>
  );
}

export function EditClientButton({ clientId, initial }: { clientId: string; initial: ClientDraft }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "md")}>
        <Pencil className="size-4" aria-hidden />
        Edit
      </button>
      {open && (
        <ClientEditor
          clientId={clientId}
          initial={initial}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
