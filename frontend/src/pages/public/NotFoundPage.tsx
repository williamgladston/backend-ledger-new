import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";

export function NotFoundPage() {
  return (
    <Card title="Page not found">
      <p className="text-sm text-gray-600">
        The page you were looking for doesn't exist.
      </p>
      <div className="mt-4">
        <Link to={ROUTES.DASHBOARD}>
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </Card>
  );
}