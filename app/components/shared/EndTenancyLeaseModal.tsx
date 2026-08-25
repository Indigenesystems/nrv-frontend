"use client";

import { Form, Formik } from "formik";
import * as yup from "yup";
import Button from "@/app/components/shared/buttons/Button";
import Modal from "@/app/components/shared/modals/Modal";

export const END_TENANCY_REASONS = [
  "Lease term completed",
  "Mutual agreement",
  "Non-payment of rent",
  "Tenant violation of lease",
  "Property sale or renovation",
  "Other",
] as const;

type EndTenancyLeaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  recordId?: string;
  onSubmit: (values: {
    id?: string;
    reason: string;
    comment?: string;
  }) => Promise<void>;
};

const validationSchema = yup.object({
  reason: yup.string().required("Select a reason for ending the tenancy lease"),
  comment: yup
    .string()
    .trim()
    .max(500, "Comment must be 500 characters or less")
    .when("reason", {
      is: "Other",
      then: (schema) =>
        schema.required("Add a comment when selecting Other"),
      otherwise: (schema) => schema.optional(),
    }),
});

const EndTenancyLeaseModal = ({
  isOpen,
  onClose,
  recordId,
  onSubmit,
}: EndTenancyLeaseModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="mx-auto h-full w-full p-3 sm:p-8 md:p-16">
        <h2 className="text-red-500 font-semibold text-2xl">
          End tenancy lease
        </h2>
        <p className="text-nrvLightGrey text-sm mb-4 mt-4">
          This will end the active tenancy lease for this tenant. Select a reason
          and add any notes — you can review them later under Past Leases.
        </p>
        <Formik
          enableReinitialize
          initialValues={{
            id: recordId,
            reason: "",
            comment: "",
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, { resetForm, setSubmitting }) => {
            try {
              await onSubmit({
                id: values.id,
                reason: values.reason,
                comment: values.comment?.trim() || "",
              });
              resetForm();
              onClose();
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, values, errors, touched, setFieldValue }) => (
            <Form>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-gray-800">
                  Reason for ending lease
                </legend>
                {END_TENANCY_REASONS.map((option) => (
                  <label
                    key={option}
                    className="flex items-start gap-2 rounded-lg border border-gray-200 p-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={option}
                      checked={values.reason === option}
                      onChange={() => setFieldValue("reason", option)}
                      className="mt-0.5"
                    />
                    <span>{option}</span>
                  </label>
                ))}
                {touched.reason && errors.reason ? (
                  <p className="text-xs text-red-600">{errors.reason}</p>
                ) : null}
              </fieldset>

              <div className="mt-4">
                <label
                  htmlFor="end-tenancy-comment"
                  className="block text-sm font-medium text-gray-800 mb-1"
                >
                  Additional comments
                  {values.reason === "Other" ? (
                    <span className="text-red-600"> *</span>
                  ) : (
                    <span className="font-normal text-gray-500"> (optional)</span>
                  )}
                </label>
                <textarea
                  id="end-tenancy-comment"
                  rows={4}
                  value={values.comment}
                  onChange={(e) => setFieldValue("comment", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#03442C] focus:outline-none focus:ring-1 focus:ring-[#03442C]"
                  placeholder="Add any details about ending this tenancy lease"
                  aria-label="Additional comments about ending the tenancy"
                />
                {touched.comment && errors.comment ? (
                  <p className="mt-1 text-xs text-red-600">{errors.comment}</p>
                ) : null}
              </div>

              <div className="mt-8 flex gap-4 justify-between w-full">
                <Button
                  type="button"
                  className="block w-full"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="block w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Ending lease…" : "End tenancy lease"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  );
};

export default EndTenancyLeaseModal;
