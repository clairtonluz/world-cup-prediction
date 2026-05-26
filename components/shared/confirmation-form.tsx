"use client";

import { useRef, useState, type ComponentPropsWithoutRef, type SubmitEvent } from "react";
import {
  ConfirmationDialog,
  type ConfirmationDialogProps,
} from "@/components/shared/confirmation-dialog";

type Confirmation = Pick<
  ConfirmationDialogProps,
  "title" | "description" | "confirmLabel" | "cancelLabel" | "intent"
>;

type ConfirmationFormProps = Omit<ComponentPropsWithoutRef<"form">, "onSubmit"> & {
  confirmation: Confirmation;
};

export function ConfirmationForm({
  confirmation,
  children,
  ...props
}: ConfirmationFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const submitterRef = useRef<HTMLButtonElement | HTMLInputElement | null>(null);
  const confirmedSubmissionRef = useRef(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    if (confirmedSubmissionRef.current) {
      confirmedSubmissionRef.current = false;
      return;
    }

    event.preventDefault();
    const submitter = event.nativeEvent.submitter;
    submitterRef.current =
      submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement
        ? submitter
        : null;
    setIsConfirmationOpen(true);
  }

  function confirmSubmission() {
    setIsConfirmationOpen(false);
    confirmedSubmissionRef.current = true;
    formRef.current?.requestSubmit(submitterRef.current ?? undefined);
  }

  return (
    <>
      <form ref={formRef} {...props} onSubmit={handleSubmit}>
        {children}
      </form>
      <ConfirmationDialog
        {...confirmation}
        open={isConfirmationOpen}
        onCancel={() => setIsConfirmationOpen(false)}
        onConfirm={confirmSubmission}
      />
    </>
  );
}
