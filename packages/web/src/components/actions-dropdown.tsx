import { EllipsisVerticalIcon, Loader2Icon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shadcn/components/ui/alert-dialog.tsx";
import { Button } from "@/shadcn/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu.tsx";

export interface ComponentAction {
  Component: React.ReactElement;
}

export interface Action {
  label: string;
  onAction: (() => void) | (() => Promise<void>);
  pending?: boolean;
  disabled?: boolean;
  confirm?: boolean;
  confirmMessage?: string;
  variant?: "default" | "destructive";
}

export function ActionsDropdownMenu({ actions }: { actions: (Action | ComponentAction)[] }) {
  const { t } = useTranslation();

  const [open, setOpen] = React.useState(false);

  const [selectedActionIndex, setSelectedActionIndex] = React.useState<number | null>(null);
  const selectedAction = React.useMemo(
    () => (selectedActionIndex !== null ? actions[selectedActionIndex] : null),
    [selectedActionIndex, actions],
  );

  // Handle dropdown action click, either executing the action directly or opening confirmation dialog
  const handleAction = (index: number) => {
    const action = actions[index];
    if ("Component" in action) return;

    if (action.confirm) {
      setOpen(true);
      setSelectedActionIndex(index);
    } else {
      action.onAction();
    }
  };

  // Handle action execution after confirmation in the dialog
  const handleConfirmAction = async () => {
    if (selectedActionIndex) {
      const action = actions[selectedActionIndex];
      if ("Component" in action) return;

      try {
        await action.onAction();
      } finally {
        setOpen(false);
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger className="text-muted-foreground" asChild>
          <Button variant="ghost" size="sm">
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {actions.map((action, index) =>
            "Component" in action ? (
              <DropdownMenuItem asChild>{action.Component}</DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                key={index}
                disabled={action.disabled || action.pending}
                variant={action.variant}
                onClick={() => handleAction(index)}
              >
                {action?.pending && <Loader2Icon className="animate-spin" />}
                {action.label}
              </DropdownMenuItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedAction && !("Component" in selectedAction) && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.ui.areYouSure")}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>{selectedAction?.confirmMessage}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
            <Button onClick={handleConfirmAction} disabled={selectedAction?.pending}>
              {selectedAction?.pending && <Loader2Icon className="animate-spin" />}
              {selectedAction?.label}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
