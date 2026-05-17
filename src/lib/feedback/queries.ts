import { createClient } from "@/lib/supabase/server";
import type { PersonRef, TemplateQuestion } from "@/lib/one-on-ones/types";
import type {
  Feedback,
  FeedbackSourceRef,
  FeedbackTemplate,
  FeedbackWithSource,
  OpenFeedbackRequestForPeer,
  OwnFeedbackRequestSummary,
} from "./types";

const PERSON_COLS = "id, name, avatar_url";
const FEEDBACK_COLS = `id, recipient_id, author_id, source_type, source_id, prompt, body, responses, is_cross_team, status, requested_at, submitted_at, created_at, author:users!feedback_author_id_fkey(${PERSON_COLS})`;

export async function getFeedbackForEmployee(
  employeeId: string,
  options?: { sinceIso?: string; untilIso?: string },
): Promise<FeedbackWithSource[]> {
  const supabase = await createClient();
  let query = supabase
    .from("feedback")
    .select(FEEDBACK_COLS)
    .eq("recipient_id", employeeId)
    .eq("status", "submitted");
  if (options?.sinceIso) {
    query = query.gte("submitted_at", options.sinceIso);
  }
  if (options?.untilIso) {
    query = query.lte("submitted_at", options.untilIso);
  }
  const { data, error } = await query
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const items = data as unknown as Feedback[];

  const oneOnOneIds = Array.from(
    new Set(
      items
        .filter((f) => f.source_type === "one_on_one" && f.source_id)
        .map((f) => f.source_id as string),
    ),
  );

  const oneOnOneSourceById = new Map<string, FeedbackSourceRef>();
  if (oneOnOneIds.length) {
    const { data: rows } = await supabase
      .from("one_on_ones")
      .select(
        `id, subject, scheduled_at, completed_at, manager:users!one_on_ones_manager_id_fkey(${PERSON_COLS})`,
      )
      .in("id", oneOnOneIds);
    type Row = {
      id: string;
      subject: string;
      scheduled_at: string | null;
      completed_at: string | null;
      manager: PersonRef | null;
    };
    for (const raw of (rows ?? []) as unknown as Row[]) {
      const date = raw.completed_at ?? raw.scheduled_at;
      oneOnOneSourceById.set(raw.id, {
        kind: "one_on_one",
        label: raw.subject || "1-op-1",
        href: `/een-op-een/${raw.id}`,
        date,
        with: raw.manager ?? null,
      });
    }
  }

  const peerRequestIds = Array.from(
    new Set(
      items
        .filter((f) => f.source_type === "peer_request" && f.source_id)
        .map((f) => f.source_id as string),
    ),
  );

  const peerRequestById = new Map<
    string,
    { template: FeedbackTemplate | null; prompt: string | null }
  >();
  if (peerRequestIds.length) {
    const { data: requestRows } = await supabase
      .from("feedback_requests")
      .select(`id, prompt, template:templates(id, name, questions)`)
      .in("id", peerRequestIds);
    type Row = {
      id: string;
      prompt: string | null;
      template: {
        id: string;
        name: string;
        questions: TemplateQuestion[];
      } | null;
    };
    for (const raw of (requestRows ?? []) as unknown as Row[]) {
      peerRequestById.set(raw.id, {
        prompt: raw.prompt,
        template: raw.template
          ? {
              id: raw.template.id,
              name: raw.template.name,
              questions: raw.template.questions ?? [],
            }
          : null,
      });
    }
  }

  return items.map((f) => {
    let source: FeedbackSourceRef | null = null;
    let templateQuestions: TemplateQuestion[] | undefined;
    if (f.source_type === "one_on_one" && f.source_id) {
      source = oneOnOneSourceById.get(f.source_id) ?? {
        kind: "one_on_one",
        label: "1-op-1",
        href: null,
        date: null,
        with: null,
      };
    } else if (f.source_type === "peer_request") {
      const req = f.source_id ? peerRequestById.get(f.source_id) : null;
      templateQuestions = req?.template?.questions;
      source = {
        kind: "peer_request",
        label: req?.template?.name ?? "Op jouw verzoek",
        href: null,
        date: null,
        with: null,
      };
    } else if (f.source_type === "performance_review") {
      source = {
        kind: "performance_review",
        label: "Functioneringsgesprek",
        href: null,
        date: null,
        with: null,
      };
    }
    return { ...f, source, template_questions: templateQuestions };
  });
}

export async function getOpenFeedbackRequestsForPeer(
  peerId: string,
): Promise<OpenFeedbackRequestForPeer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select(
      `id, source_id, requested_at, created_at, is_cross_team, recipient:users!feedback_recipient_id_fkey(${PERSON_COLS})`,
    )
    .eq("author_id", peerId)
    .eq("source_type", "peer_request")
    .eq("status", "requested")
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  type Row = {
    id: string;
    source_id: string | null;
    requested_at: string | null;
    created_at: string;
    is_cross_team: boolean;
    recipient: PersonRef | null;
  };
  const rows = data as unknown as Row[];

  const requestIds = Array.from(
    new Set(rows.map((r) => r.source_id).filter((v): v is string => !!v)),
  );
  const requestMap = new Map<
    string,
    { prompt: string | null; template: FeedbackTemplate | null }
  >();
  if (requestIds.length) {
    const { data: reqs } = await supabase
      .from("feedback_requests")
      .select(`id, prompt, template:templates(id, name, questions)`)
      .in("id", requestIds);
    type ReqRow = {
      id: string;
      prompt: string | null;
      template: {
        id: string;
        name: string;
        questions: TemplateQuestion[];
      } | null;
    };
    for (const r of (reqs ?? []) as unknown as ReqRow[]) {
      requestMap.set(r.id, {
        prompt: r.prompt,
        template: r.template
          ? {
              id: r.template.id,
              name: r.template.name,
              questions: r.template.questions ?? [],
            }
          : null,
      });
    }
  }

  return rows
    .filter((r) => r.recipient && r.source_id)
    .map((r) => {
      const req = requestMap.get(r.source_id as string) ?? null;
      return {
        feedback_id: r.id,
        request_id: r.source_id as string,
        requester: r.recipient as PersonRef,
        prompt: req?.prompt ?? null,
        template: req?.template ?? null,
        requested_at: r.requested_at,
        created_at: r.created_at,
        is_cross_team: r.is_cross_team,
      };
    });
}

export async function getOwnOpenRequestSummary(
  requesterId: string,
): Promise<OwnFeedbackRequestSummary[]> {
  const supabase = await createClient();
  const { data: requests, error: reqErr } = await supabase
    .from("feedback_requests")
    .select(`id, prompt, created_at, template:templates(name)`)
    .eq("requester_id", requesterId)
    .order("created_at", { ascending: false });
  if (reqErr || !requests) return [];

  type ReqRow = {
    id: string;
    prompt: string | null;
    created_at: string;
    template: { name: string } | null;
  };
  const reqRows = requests as unknown as ReqRow[];
  if (reqRows.length === 0) return [];

  const ids = reqRows.map((r) => r.id);
  const { data: feedbacks } = await supabase
    .from("feedback")
    .select("source_id, status")
    .eq("source_type", "peer_request")
    .in("source_id", ids);

  type FbRow = { source_id: string; status: string };
  const byRequest = new Map<string, FbRow[]>();
  for (const row of (feedbacks ?? []) as unknown as FbRow[]) {
    const list = byRequest.get(row.source_id) ?? [];
    list.push(row);
    byRequest.set(row.source_id, list);
  }

  return reqRows.map((r) => {
    const list = byRequest.get(r.id) ?? [];
    return {
      request_id: r.id,
      prompt: r.prompt,
      template_name: r.template?.name ?? null,
      created_at: r.created_at,
      peer_count: list.length,
      submitted_count: list.filter((f) => f.status === "submitted").length,
      declined_count: list.filter((f) => f.status === "declined").length,
    };
  });
}

export async function getFeedbackRequestDetailForPeer(
  feedbackId: string,
  peerId: string,
): Promise<{
  feedback: Feedback;
  requester: PersonRef;
  prompt: string | null;
  template: FeedbackTemplate | null;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select(
      `${FEEDBACK_COLS}, recipient:users!feedback_recipient_id_fkey(${PERSON_COLS})`,
    )
    .eq("id", feedbackId)
    .eq("author_id", peerId)
    .eq("source_type", "peer_request")
    .maybeSingle();
  if (error || !data) return null;

  type Row = Feedback & { recipient: PersonRef | null };
  const row = data as unknown as Row;
  if (!row.recipient || !row.source_id) return null;

  const { data: req } = await supabase
    .from("feedback_requests")
    .select(`id, prompt, template:templates(id, name, questions)`)
    .eq("id", row.source_id)
    .maybeSingle();
  type ReqRow = {
    id: string;
    prompt: string | null;
    template: {
      id: string;
      name: string;
      questions: TemplateQuestion[];
    } | null;
  };
  const reqRow = req as unknown as ReqRow | null;

  return {
    feedback: row,
    requester: row.recipient,
    prompt: reqRow?.prompt ?? null,
    template: reqRow?.template
      ? {
          id: reqRow.template.id,
          name: reqRow.template.name,
          questions: reqRow.template.questions ?? [],
        }
      : null,
  };
}

export async function countFeedbackReceivedSince(
  recipientId: string,
  sinceIso: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", recipientId)
    .eq("status", "submitted")
    .gte("submitted_at", sinceIso);
  return count ?? 0;
}

export async function listPeerFeedbackTemplates(): Promise<FeedbackTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("id, name, questions")
    .eq("type", "peer_360")
    .eq("is_active", true)
    .order("name");
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    questions: (row.questions ?? []) as TemplateQuestion[],
  }));
}

export async function getManagerFeedbackForOneOnOne(
  oneOnOneId: string,
  managerId: string,
): Promise<Feedback | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select(FEEDBACK_COLS)
    .eq("source_type", "one_on_one")
    .eq("source_id", oneOnOneId)
    .eq("author_id", managerId)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Feedback;
}
