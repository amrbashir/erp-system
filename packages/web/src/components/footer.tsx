import { Button } from "@/shadcn/components/ui/button";

import { AmrBashirIcon } from "@/components/icons/AmrBashirIcon";
import { GithubIcon } from "@/components/icons/github";

export function Footer(props: React.ComponentProps<"footer">) {
  return (
    <footer className="w-full grid place-items-center my-20 text-primary" {...props}>
      <div className="*:opacity-50 *:hover:opacity-100 flex items-center gap-4">
        <Button variant="link" className="hover:opacity-100 p-0">
          <a>
            <AmrBashirIcon className="size-5" />
          </a>
        </Button>
        <Button variant="link" className="hover:opacity-100 p-0">
          <a href="https://github.com/amrbashir/erp-system" target="_blank">
            <GithubIcon className="size-5" />
          </a>
        </Button>
      </div>
      <div className="text-center text-sm opacity-50">erp-system © {new Date().getFullYear()}</div>
    </footer>
  );
}
