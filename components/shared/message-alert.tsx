import { feedbackText, type FeedbackParams } from "@/lib/feedback";

export function MessageAlert(params: FeedbackParams) {
  const feedback = feedbackText(params);

  if (!feedback) {
    return null;
  }

  return (
    <p
      role="status"
      className={
        feedback.kind === "error"
          ? "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          : "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      }
    >
      {feedback.text}
    </p>
  );
}
