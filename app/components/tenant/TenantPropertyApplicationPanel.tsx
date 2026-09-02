"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { Form, Formik } from "formik";
import * as yup from "yup";
import { ValidationError } from "yup";
import { toast } from "react-toastify";
import Button from "@/app/components/shared/buttons/Button";
import FormikDateInputField from "@/app/components/shared/input-fields/FormikDateInputField";
import InputField from "@/app/components/shared/input-fields/InputFields";
import { ArrowLeft, Building } from "lucide-react";
import { startOfToday } from "date-fns";
import { applyForProperty } from "@/redux/slices/propertySlice";
import TermsAgreementCheckbox from "@/app/components/shared/TermsAgreementCheckbox";
import type { TenantPropertyApplicationView } from "@/app/lib/mapTenantRoomForApplication";

const applicationValidationSchema = yup.object({
  currentResidence: yup.string().trim().required("Current residence address is required"),
  jobTitle: yup.string().trim().required("Job title / business type is required"),
  currentEmployer: yup.string().trim().required("Current employer is required"),
  monthlyIncome: yup.string().trim().required("Monthly income is required"),
  reasonForLeaving: yup.string().trim().required("Reason for moving is required"),
  desiredMoveInDate: yup
    .date()
    .nullable()
    .typeError("Please select a valid move-in date")
    .required("Desired move-in date is required")
    .min(startOfToday(), "Move-in date must be today or later"),
});

export type TenantPropertyApplicationPanelProps = {
  variant: "page" | "modal";
  property: TenantPropertyApplicationView | null;
  propertyId: string;
  user: { _id?: string } | null;
  onBack: () => void;
  onSuccess: () => void;
};

export function TenantPropertyApplicationPanel({
  variant,
  property,
  propertyId,
  user,
  onBack,
  onSuccess,
}: TenantPropertyApplicationPanelProps) {
  const dispatch = useDispatch();
  const [subStep, setSubStep] = useState<"form" | "review">("form");
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedFiles] = useState<any>(null);

  const outer =
    variant === "page"
      ? "min-h-screen bg-gradient-to-br from-[#F4FAF3] via-white to-[#E9F4E7] py-6 px-4"
      : "py-1";

  const handleSubmit = async (value: any) => {
    if (!termsAccepted) {
      toast.error("Please agree to the terms and conditions before submitting.");
      return;
    }
    try {
      await applicationValidationSchema.validate(value, { abortEarly: false });
    } catch (e) {
      if (e instanceof ValidationError) {
        toast.error(e.errors[0] ?? "Please complete all required fields.");
        return;
      }
      toast.error("Please complete all required fields.");
      return;
    }
    const fd: any = new FormData();
    fd.append("propertyId", propertyId);
    fd.append("applicant", user?._id ?? "");
    fd.append("status", "New");
    fd.append("ownerId", property?.owner?.id ?? "");
    fd.append("jobTitle", value.jobTitle);
    fd.append("currentEmployer", value.currentEmployer);
    fd.append("monthlyIncome", value.monthlyIncome);
    fd.append("currentResidence", value.currentResidence);
    // Backend field is reasonForLiving; keep alias for older API clients
    fd.append("reasonForLiving", value.reasonForLeaving);
    fd.append("reasonForLeaving", value.reasonForLeaving);
    fd.append("file", selectedFiles);
    try {
      setLoading(true);
      await dispatch(applyForProperty(fd) as any).unwrap();
      toast.success("Your property application has been sent to the landlord");
      onSuccess();
    } catch (error: any) {
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const apt =
    property?.apartmentType ?? property?.apartmentName ?? "";

  if (!property) {
    return (
      <div
        className={
          variant === "modal"
            ? "py-6 text-center text-gray-600"
            : "rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600"
        }
      >
        Loading application…
      </div>
    );
  }

  if (property.hasApplied) {
    return (
      <div
        className={
          variant === "page"
            ? "min-h-screen bg-gradient-to-br from-[#F4FAF3] via-white to-[#E9F4E7] py-10 px-4 flex items-center justify-center"
            : "py-4 text-center"
        }
      >
        <div
          className={
            variant === "page"
              ? "max-w-md rounded-xl border border-[#2B892B]/20 bg-white p-4 shadow-sm sm:p-6"
              : "max-w-md mx-auto"
          }
        >
          <p className="text-lg font-semibold text-nrvPrimaryGreen">
            You have already applied to this unit
          </p>
          <p className="mt-2 text-sm text-gray-600">
            The landlord will review your application. You can track status from your tenant
            dashboard.
          </p>
          {variant === "modal" ? (
            <button
              type="button"
              onClick={onBack}
              className="mt-6 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={outer}>
      <div className="max-w-2xl mx-auto">
        {subStep === "form" ? (
          <>
            <div className="mb-6 overflow-x-auto pb-4 hide-scrollbar">
              <div className="flex items-center justify-start sm:justify-center min-w-max px-2">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="flex items-center shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#E9F4E7] rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-nrvPrimaryGreen"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-1.5 sm:ml-2">
                      <p className="text-[10px] sm:text-xs font-medium text-nrvPrimaryGreen whitespace-nowrap">
                        Property Selected
                      </p>
                    </div>
                  </div>
                  <div className="w-6 sm:w-12 h-0.5 bg-[#D4EBCF] shrink-0" />
                  <div className="flex items-center shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#2B892B] rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="ml-1.5 sm:ml-2">
                      <p className="text-[10px] sm:text-xs font-medium text-nrvPrimaryGreen whitespace-nowrap">
                        Application Form
                      </p>
                    </div>
                  </div>
                  <div className="w-6 sm:w-12 h-0.5 bg-gray-200 shrink-0" />
                  <div className="flex items-center shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-1.5 sm:ml-2">
                      <p className="text-[10px] sm:text-xs font-medium text-gray-400 whitespace-nowrap">
                        Review & Submit
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={variant === "modal" ? "" : "bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"}>
              <div className="bg-nrvPrimaryGreen px-4 py-3 text-white">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={onBack}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105 shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold truncate">
                      Tenant Application Form 🏘️
                    </h2>
                    <p className="text-white/80 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">
                      Complete your application for {apt} • {property.apartmentStyle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <Formik
                  initialValues={{
                    currentResidence: "",
                    monthlyIncome: "",
                    desiredMoveInDate: null as Date | null,
                    currentEmployer: "",
                    reasonForLeaving: "",
                    jobTitle: "",
                    ownerId: user?._id,
                  }}
                  validationSchema={applicationValidationSchema}
                  validateOnBlur
                  validateOnChange={false}
                  onSubmit={(values) => handleSubmit(values)}
                >
                  {({ resetForm, values, setFieldValue, setFieldTouched, validateForm, setTouched }) => (
                    <Form className="w-full">
                      <div className="mb-4 p-3 bg-[#E9F4E7] rounded-lg border border-[#2B892B]/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 bg-[#D4EBCF] rounded-lg flex items-center justify-center shrink-0">
                              <Building className="w-5 h-5 text-nrvPrimaryGreen" />
                            </div>
                            <div>
                              <h3 className="text-base font-semibold text-gray-800 line-clamp-1">
                                {apt} • {property.apartmentStyle}
                              </h3>
                              <p className="text-gray-600 text-xs line-clamp-1">{property.address}</p>
                              <p className="text-lg font-bold text-nrvPrimaryGreen mt-0.5">
                                ₦{property.price?.toLocaleString()}/year
                              </p>
                            </div>
                          </div>
                          <div className="sm:text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end border-t sm:border-t-0 pt-3 sm:pt-0">
                            <div className="text-xs text-gray-500">Unit Number</div>
                            <div className="text-xl font-bold text-gray-800">{property.flatNumber}</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-800 mb-2.5 flex items-center">
                            <div className="w-2 h-2 bg-[#2B892B] rounded-full mr-2" />
                            Personal Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-start">
                            <InputField
                              label="Current Residence Address"
                              name="currentResidence"
                              variant="nested"
                              required
                              placeholder="Enter your current address"
                              value={values.currentResidence}
                              onChange={(e) => setFieldValue("currentResidence", e.target.value)}
                            />
                            <InputField
                              label="Job Title / Business Type"
                              name="jobTitle"
                              variant="nested"
                              required
                              placeholder="e.g., Software Engineer, Business Owner"
                              value={values.jobTitle}
                              onChange={(e) => setFieldValue("jobTitle", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-800 mb-2.5 flex items-center">
                            <div className="w-2 h-2 bg-[#2B892B] rounded-full mr-2" />
                            Employment & Income
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-start">
                            <InputField
                              label="Current Employer"
                              name="currentEmployer"
                              variant="nested"
                              required
                              placeholder="Company or organization name"
                              value={values.currentEmployer}
                              onChange={(e) => setFieldValue("currentEmployer", e.target.value)}
                            />
                            <InputField
                              label="Monthly Income"
                              name="monthlyIncome"
                              variant="nested"
                              required
                              placeholder="₦0.00"
                              value={values.monthlyIncome}
                              onChange={(e) => setFieldValue("monthlyIncome", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-800 mb-2.5 flex items-center">
                            <div className="w-2 h-2 bg-[#2B892B] rounded-full mr-2" />
                            Move-in Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-start">
                            <FormikDateInputField
                              name="desiredMoveInDate"
                              label="Desired Move-in Date"
                              placeholder="Select move-in date"
                              required
                              disablePast
                            />
                            <InputField
                              label="Reason for Moving"
                              name="reasonForLeaving"
                              variant="nested"
                              required
                              placeholder="e.g., Job relocation, lease ending"
                              value={values.reasonForLeaving}
                              onChange={(e) => setFieldValue("reasonForLeaving", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-200">
                        <Button
                          type="button"
                          size="large"
                          className="w-full sm:flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 h-11 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm"
                          variant="lightGrey"
                          showIcon={false}
                          onClick={() => {
                            resetForm();
                            onBack();
                          }}
                        >
                          Back to Property
                        </Button>
                        <Button
                          type="button"
                          size="large"
                          className="w-full sm:flex-1 bg-nrvPrimaryGreen hover:bg-[#023524] text-white h-11 rounded-lg font-medium transition-all text-sm"
                          variant="darkPrimary"
                          showIcon={false}
                          onClick={async () => {
                            const fieldKeys = [
                              "currentResidence",
                              "jobTitle",
                              "currentEmployer",
                              "monthlyIncome",
                              "reasonForLeaving",
                              "desiredMoveInDate",
                            ] as const;
                            await setTouched(
                              fieldKeys.reduce(
                                (acc, k) => {
                                  acc[k] = true;
                                  return acc;
                                },
                                {} as Record<string, boolean>,
                              ),
                            );
                            const errs = await validateForm();
                            if (errs && Object.keys(errs).length > 0) {
                              toast.error("Please fill in all required fields before continuing.");
                              return;
                            }
                            setFormData(values);
                            setSubStep("review");
                          }}
                        >
                          <div className="flex items-center justify-center w-full">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Continue to Review
                          </div>
                        </Button>
                      </div>

                      <div className="mt-6 p-4 bg-[#E9F4E7] rounded-lg border border-[#2B892B]/20">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-[#D4EBCF] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg
                              className="w-4 h-4 text-nrvPrimaryGreen"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h5 className="font-medium text-nrvPrimaryGreen mb-2 text-sm">Application Tips</h5>
                            <ul className="text-xs text-[#2B892B] space-y-1">
                              <li>• Ensure all information is accurate and up-to-date</li>
                              <li>• Provide complete contact details for verification</li>
                              <li>• Be honest about your income and employment status</li>
                              <li>• The landlord will review your application within 24-48 hours</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 overflow-x-auto pb-4 hide-scrollbar">
              <div className="flex items-center justify-start sm:justify-center min-w-max px-2">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="flex items-center shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#E9F4E7] rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-nrvPrimaryGreen"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-1.5 sm:ml-2">
                      <p className="text-[10px] sm:text-xs font-medium text-nrvPrimaryGreen whitespace-nowrap">
                        Property Selected
                      </p>
                    </div>
                  </div>
                  <div className="w-6 sm:w-12 h-0.5 bg-[#D4EBCF] shrink-0" />
                  <div className="flex items-center shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#2B892B] rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="ml-1.5 sm:ml-2">
                      <p className="text-[10px] sm:text-xs font-medium text-nrvPrimaryGreen whitespace-nowrap">
                        Application Form
                      </p>
                    </div>
                  </div>
                  <div className="w-6 sm:w-12 h-0.5 bg-gray-200 shrink-0" />
                  <div className="flex items-center shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-1.5 sm:ml-2">
                      <p className="text-[10px] sm:text-xs font-medium text-gray-400 whitespace-nowrap">
                        Review & Submit
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={variant === "modal" ? "" : "bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"}>
              <div className="bg-nrvPrimaryGreen px-4 py-3 text-white">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setSubStep("form")}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105 shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold truncate">
                      Review & Submit Application 📋
                    </h2>
                    <p className="text-white/80 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">
                      Review your application details before final submission
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="mb-6 p-4 bg-[#E9F4E7] rounded-lg border border-[#2B892B]/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#D4EBCF] rounded-lg flex items-center justify-center shrink-0">
                        <Building className="w-6 h-6 text-nrvPrimaryGreen" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 line-clamp-1">
                          {apt} • {property.apartmentStyle}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-1">{property.address}</p>
                        <p className="text-xl font-bold text-nrvPrimaryGreen mt-1">
                          ₦{property.price?.toLocaleString()}/year
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div className="text-xs text-gray-500">Unit Number</div>
                      <div className="text-xl font-bold text-gray-800">{property.flatNumber}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-[#2B892B] rounded-full mr-2" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Current Residence Address</p>
                        <p className="text-gray-800 font-semibold">
                          {formData?.currentResidence || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Job Title / Business Type</p>
                        <p className="text-gray-800 font-semibold">
                          {formData?.jobTitle || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-[#2B892B] rounded-full mr-2" />
                      Employment & Income
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Current Employer</p>
                        <p className="text-gray-800 font-semibold">
                          {formData?.currentEmployer || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Monthly Income</p>
                        <p className="text-gray-800 font-semibold">
                          ₦{formData?.monthlyIncome || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                      Move-in Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Desired Move-in Date</p>
                        <p className="text-gray-800 font-semibold">
                          {formData?.desiredMoveInDate
                            ? new Date(formData.desiredMoveInDate).toLocaleDateString()
                            : "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Reason for Moving</p>
                        <p className="text-gray-800 font-semibold">
                          {formData?.reasonForLeaving || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <TermsAgreementCheckbox
                    checked={termsAccepted}
                    onChange={setTermsAccepted}
                    id="property-application-terms"
                    label="I agree to the platform terms before submitting this application"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    size="large"
                    className="w-full sm:flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 h-11 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm"
                    variant="lightGrey"
                    showIcon={false}
                    onClick={() => setSubStep("form")}
                  >
                    Back to Edit
                  </Button>
                  <Button
                    type="button"
                    size="large"
                    className="w-full sm:flex-1 bg-nrvPrimaryGreen hover:bg-[#023524] text-white h-11 rounded-lg font-medium transition-all text-sm"
                    variant="darkPrimary"
                    showIcon={false}
                    onClick={() => handleSubmit(formData)}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center w-full">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Submit Application
                      </div>
                    )}
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-[#E9F4E7] rounded-lg border border-[#2B892B]/20">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#D4EBCF] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-4 h-4 text-nrvPrimaryGreen"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-medium text-nrvPrimaryGreen mb-2 text-sm">Final Review Checklist</h5>
                      <ul className="text-xs text-[#2B892B] space-y-1">
                        <li>• All personal information is accurate and complete</li>
                        <li>• Employment details are up-to-date</li>
                        <li>• Move-in date is realistic and works for you</li>
                        <li>• You&apos;re ready to proceed with the application</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
