import { createClient } from "@/lib/supabase/server";
import type { PersonRef, TemplateQuestion } from "@/lib/one-on-ones/types";
import type {
  Feedback,
  FeedbackSourceRef,
  FeedbackTemplate,
  FeedbackWithSource,
  OpenFeedbackRequestForPeer,
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
  const performanceReviewIds = Array.from(
    new Set(
      items
        .filter(
          (f) =>
            (f.source_type === "performance_review" ||
              f.source_type === "upward_feedback") &&
            f.source_id,
        )
        .map((f) => f.source_id as string),
    ),
  );

  type TemplateRow = {
    id: string;
    name: string;
    questions: TemplateQuestion[];
  };

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
      template: TemplateRow | null;
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

  const performanceReviewById = new Map<
    string,
    {
      managerId: string;
      templateName: string | null;
      templateId: string | null;
      templateType: string | null;
      templateQuestions: TemplateQuestion[];
      sections: Record<string, TemplateQuestion[]> | null;
    }
  >();
  if (performanceReviewIds.length) {
    const { data: prRows } = await supabase
      .from("performance_reviews")
      .select(
        `id, manager_id, template:templates(id, name, type, questions, sections)`,
      )
      .in("id", performanceReviewIds);
    type Row = {
      id: string;
      manager_id: string;
      template:
        | (TemplateRow & {
            type: string;
            sections: Record<string, TemplateQuestion[]> | null;
          })
        | null;
    };
    for (const raw of (prRows ?? []) as unknown as Row[]) {
      performanceReviewById.set(raw.id, {
        managerId: raw.manager_id,
        templateName: raw.template?.name ?? null,
        templateId: raw.template?.id ?? null,
        templateType: raw.template?.type ?? null,
        templateQuestions: (raw.template?.questions ?? []) as TemplateQuestion[],
        sections: raw.template?.sections ?? null,
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
      const pr = f.source_id ? performanceReviewById.get(f.source_id) : null;
      if (pr?.templateType === "performance_review_bundle") {
        const sectionKey =
          f.author_id === pr.managerId ? "manager_prep" : "peer_360";
        templateQuestions = (pr.sections?.[sectionKey] ?? []) as TemplateQuestion[];
      } else {
        templateQuestions = pr?.templateQuestions;
      }
      source = {
        kind: "performance_review",
        label: pr?.templateName ?? "Functioneringsgesprek",
        href: null,
        date: null,
        with: null,
      };
    } else if (f.source_type === "upward_feedback") {
      const pr = f.source_id ? performanceReviewById.get(f.source_id) : null;
      if (pr?.templateType === "performance_review_bundle") {
        templateQuestions = (pr.sections?.upward ?? []) as TemplateQuestion[];
      } else if (pr?.templateType === "upward_feedback") {
        templateQuestions = pr.templateQuestions;
      }
      source = {
        kind: "upward_feedback",
        label: "Upward feedback uit functioneringsgesprek",
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
      `id, source_type, source_id, requested_at, created_at, is_cross_team, recipient:users!feedback_recipient_id_fkey(${PERSON_COLS})`,
    )
    .eq("author_id", peerId)
    .in("source_type", ["peer_request", "performance_review"])
    .eq("status", "requested")
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  type Row = {
    id: string;
    source_type: "peer_request" | "performance_review";
    source_id: string | null;
    requested_at: string | null;
    created_at: string;
    is_cross_team: boolean;
    recipient: PersonRef | null;
  };
  const rows = data as unknown as Row[];

  type TemplateRow = {
    id: string;
    name: string;
    questions: TemplateQuestion[];
  };

  const peerRequestIds = Array.from(
    new Set(
      rows
        .filter((r) => r.source_type === "peer_request")
        .map((r) => r.source_id)
        .filter((v): v is string => !!v),
    ),
  );
  const perfReviewIds = Array.from(
    new Set(
      rows
        .filter((r) => r.source_type === "performance_review")
        .map((r) => r.source_id)
        .filter((v): v is string => !!v),
    ),
  );

  const requestMap = new Map<
    string,
    { prompt: string | null; template: FeedbackTemplate | null }
  >();
  if (peerRequestIds.length) {
    const { data: reqs } = await supabase
      .from("feedback_requests")
      .select(`id, prompt, template:templates(id, name, questions)`)
      .in("id", peerRequestIds);
    type ReqRow = {
      id: string;
      prompt: string | null;
      template: TemplateRow | null;
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

  const perfMap = new Map<string, { template: FeedbackTemplate | null }>();
  if (perfReviewIds.length) {
    const { data: prs } = await supabase
      .from("performance_reviews")
      .select(`id, template:templates(id, name, questions)`)
      .in("id", perfReviewIds);
    type PrRow = { id: string; template: TemplateRow | null };
    for (const r of (prs ?? []) as unknown as PrRow[]) {
      perfMap.set(r.id, {
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
      const sourceId = r.source_id as string;
      const fromMap =
        r.source_type === "performance_review"
          ? { prompt: null as string | null, template: perfMap.get(sourceId)?.template ?? null }
          : {
              prompt: requestMap.get(sourceId)?.prompt ?? null,
              template: requestMap.get(sourceId)?.template ?? null,
            };
      return {
        feedback_id: r.id,
        request_id: sourceId,
        requester: r.recipient as PersonRef,
        prompt: fromMap.prompt,
        template: fromMap.template,
        requested_at: r.requested_at,
        created_at: r.created_at,
        is_cross_team: r.is_cross_team,
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
  source_kind: "peer_request" | "performance_review";
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select(
      `${FEEDBACK_COLS}, recipient:users!feedback_recipient_id_fkey(${PERSON_COLS})`,
    )
    .eq("id", feedbackId)
    .eq("author_id", peerId)
    .in("source_type", ["peer_request", "performance_review"])
    .maybeSingle();
  if (error || !data) return null;

  type Row = Feedback & { recipient: PersonRef | null };
  const row = data as unknown as Row;
  if (!row.recipient || !row.source_id) return null;

  type TemplateRow = {
    id: string;
    name: string;
    questions: TemplateQuestion[];
  };

  if (row.source_type === "performance_review") {
    const { data: pr } = await supabase
      .from("performance_reviews")
      .select(
        `id, manager_id, template:templates(id, name, type, questions, sections)`,
      )
      .eq("id", row.source_id)
      .maybeSingle();
    type PrTemplateRow = TemplateRow & {
      type: string;
      sections: Record<string, TemplateQuestion[]> | null;
    };
    type PrRow = {
      id: string;
      manager_id: string;
      template: PrTemplateRow | null;
    };
    const prRow = pr as unknown as PrRow | null;

    let questions: TemplateQuestion[] = [];
    if (prRow?.template) {
      if (prRow.template.type === "performance_review_bundle") {
        // Manager schrijft op manager_prep-sectie, peer op peer_360.
        const sectionKey =
          peerId === prRow.manager_id ? "manager_prep" : "peer_360";
        questions = (prRow.template.sections?.[sectionKey] ?? []) as TemplateQuestion[];
      } else {
        questions = prRow.template.questions ?? [];
      }
    }

    return {
      feedback: row,
      requester: row.recipient,
      prompt: null,
      template: prRow?.template
        ? {
            id: prRow.template.id,
            name: prRow.template.name,
            questions,
          }
        : null,
      source_kind: "performance_review",
    };
  }

  const { data: req } = await supabase
    .from("feedback_requests")
    .select(`id, prompt, template:templates(id, name, questions)`)
    .eq("id", row.source_id)
    .maybeSingle();
  type ReqRow = {
    id: string;
    prompt: string | null;
    template: TemplateRow | null;
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
    source_kind: "peer_request",
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
