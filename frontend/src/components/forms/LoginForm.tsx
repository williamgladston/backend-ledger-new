import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { useLogin } from "@/hooks/useAccounts";
import { ROUTES } from "@/constants/routes";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <Card title="Sign in">
      <form className="space-y-4" onSubmit={handleSubmit((v) => login.mutate(v))} noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>
        <Button type="submit" loading={login.isPending} className="w-full">
          Sign in
        </Button>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <Link to={ROUTES.REGISTER} className="text-brand-600 hover:underline">
            Create an account
          </Link>
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-gray-500 hover:underline">
            Forgot password?
          </Link>
        </div>
      </form>
    </Card>
  );
}