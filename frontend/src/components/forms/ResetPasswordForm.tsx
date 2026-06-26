import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { useResetPassword } from "@/hooks/useAccounts";
import { ROUTES } from "@/constants/routes";
import { Alert } from "@/components/ui/Alert";

const schema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirm: z.string().min(6),
}).refine((d) => d.newPassword === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const reset = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!token || !email) {
    return (
      <Card title="Invalid reset link">
        <Alert kind="error">
          This reset link is missing required parameters. Please request a new password reset.
        </Alert>
        <Link to={ROUTES.FORGOT_PASSWORD} className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          Request a new link
        </Link>
      </Card>
    );
  }

  return (
    <Card title="Reset your password">
      <form
        className="space-y-4"
        onSubmit={handleSubmit((v) =>
          reset.mutate({ token, email, newPassword: v.newPassword }),
        )}
        noValidate
      >
        <p className="text-sm text-gray-500">Resetting password for <strong>{email}</strong>.</p>
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.newPassword}
            {...register("newPassword")}
          />
          {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.confirm}
            {...register("confirm")}
          />
          {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm.message}</p>}
        </div>
        <Button type="submit" loading={reset.isPending} className="w-full">
          Reset password
        </Button>
      </form>
    </Card>
  );
}