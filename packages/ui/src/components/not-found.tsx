import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";

export function NotFound() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
			<h2 className="text-xl font-semibold">Page not found</h2>
			<p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
			<Button render={<Link to="/" />}>Go home</Button>
		</div>
	);
}
