let draft: import("../api").ProgressUploadResult & { local_uri?: string } | null = null;

export function setProgressDraft(value: typeof draft) {
  draft = value;
}

export function getProgressDraft() {
  return draft;
}
