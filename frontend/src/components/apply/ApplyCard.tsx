'use client';

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { jobPostingsApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ApplyMethodTabs } from "./ApplyMethodTabs";
import { UploadDropzone } from "./UploadDropzone";
import { SubmitBar } from "./SubmitBar";
import SuccessModal from "@/components/modals/ApplicationSuccessModal";
import { useApplyStore } from "@/stores/useApplyStore";

type FormValues = { fullName: string; email: string };

type Props = {
  token: string;
  jobTitle: string;
};

export function ApplyCard({ token, jobTitle }: Props) {
  const { method, file, setFile, setMethod, reset } = useApplyStore();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset: resetForm,
  } = useForm<FormValues>({
    defaultValues: { fullName: "", email: "" },
    mode: "onTouched",
  });

  const canSubmit = useMemo(() => {
    if (method === "resume") return !!file;
    return true;
  }, [method, file]);

  const onSubmit = async (values: FormValues) => {
    try {
      const formData = new FormData();
      formData.append('name', values.fullName);
      formData.append('email', values.email);
      formData.append('source', method === 'resume' ? 'file' : 'linkedin');
      if (file) formData.append('file', file);

      await jobPostingsApi.submitApplication(token, formData);
      setShowSuccess(true);
      resetForm();
      reset();
    } catch {
      toast.error("Failed to submit application.");
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-secondary-700">
        Apply to {jobTitle}
      </h3>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-secondary-600">Full Name</label>
          <Input placeholder="Jane Doe" {...register("fullName", { required: true })} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-secondary-600">Email</label>
          <Input
            type="email"
            placeholder="jane@domain.com"
            {...register("email", { required: true })}
          />
        </div>

        <div className="pt-2">
          <p className="text-sm font-medium text-secondary-600">
            How would you like to apply?
          </p>

          <div className="mt-3">
            <ApplyMethodTabs method={method} setMethod={setMethod} />
          </div>
        </div>

        {method === "resume" && (
          <UploadDropzone file={file} onFile={setFile} />
        )}

        {method === "linkedin" && (
          <UploadDropzone file={file} onFile={setFile} />
        )}

        <SubmitBar disabled={!canSubmit || isSubmitting} />
      </form>

      <SuccessModal open={showSuccess} onClose={handleCloseSuccess} />
    </Card>
  );
}
