import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { useForgotPassword } from "@/hooks/useAccounts";
import { ROUTES } from "@/constants/routes";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const fp = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <Card title="Forgot password">
      <form className="space-y-4" onSubmit={handleSubmit((v) => fp.mutate(v))} noValidate>
        <p className="text-sm text-gray-500">
          Enter your email and we'll send you a link to reset your password.
        </p>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <Button type="submit" loading={fp.isPending} className="w-full">
          Send reset link
        </Button>
        <p className="text-center text-sm text-gray-600">
          <Link to={ROUTES.LOGIN} className="text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}