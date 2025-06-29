import { Button } from "@/shadcn/components/ui/button";

import { AmrBashirIcon } from "@/components/icons/AmrBashirIcon";
import { GithubIcon } from "@/components/icons/github";

export function Footer(props: React.ComponentProps<"footer">) {
  return (
    <footer className="w-full grid place-items-center my-20" {...props}>
      <div>
        <Button variant="link" className="text-primary/50 hover:text-primary active:text-primary">
          <a href="https://amrbashir.me" target="_blank">
            <AmrBashirIcon className="size-5" />
          </a>
        </Button>
        <Button variant="link" className="text-primary/50 hover:text-primary active:text-primary">
          <a href="https://github.com/amrbashir/erp-system" target="_blank">
            <GithubIcon className="size-5" />
          </a>
        </Button>
      </div>
      <div className="text-center text-sm text-primary/50">
        erp-system © {new Date().getFullYear()}
      </div>
    </footer>
  );
}
