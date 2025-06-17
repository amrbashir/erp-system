import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="grid grid-cols-[200px_1fr] w-screen h-screen overflow-hidden *:p-4 *:overflow-auto">
      <aside className="flex flex-col gap-2 border-r *:p-2 *:hover:bg-gray-100">
        <Link to="/" activeProps={{ className: "bg-red-100" }}>
          Home
        </Link>
        <Link to="/about" activeProps={{ className: "bg-red-100" }}>
          About
        </Link>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  ),
});
