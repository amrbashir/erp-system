import {
  Column,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  OnChangeFn,
  PaginationState,
  SortingState,
  TableOptions,
  Table as TanstackReactTable,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/components/ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table.tsx";
import { cn } from "@/shadcn/lib/utils.ts";

import { Route as OrgRoute } from "@/routes/orgs.$orgSlug/route.tsx";

type DataTableProps<TData> = Pick<
  TableOptions<TData>,
  "data" | "columns" | "rowCount" | "manualFiltering" | "manualPagination" | "manualSorting"
>;
export function DataTable<TData>({ columns, ...props }: DataTableProps<TData>) {
  const { t, i18n } = useTranslation();

  const navigate = OrgRoute.useNavigate();
  const { page, pageSize, sort, search } = OrgRoute.useSearch();

  const paginationState = { pageIndex: page, pageSize: pageSize };
  const sortingState = sort.map((s) => ({ id: s.orderBy, desc: s.desc }));

  const updateSearchParams = (pagination: PaginationState, sorting: SortingState) => {
    navigate({
      search: {
        search,
        page: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sort: sorting.map((s) => ({ orderBy: s.id, desc: s.desc })),
      },
    });
  };

  const setPagination: OnChangeFn<PaginationState> = (state) => {
    const newState = typeof state === "function" ? state(paginationState) : state;
    updateSearchParams(newState, sortingState);
  };

  const setSorting: OnChangeFn<SortingState> = (state) => {
    const newState = typeof state === "function" ? state(sortingState) : state;
    updateSearchParams(paginationState, newState);
  };

  const table = useReactTable({
    ...props,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columns,
    columnResizeMode: "onChange",
    columnResizeDirection: i18n.dir(),
    state: {
      pagination: paginationState,
      sorting: sortingState,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    autoResetAll: false,
  });

  /**
   * Instead of calling `column.getSize()` on every render for every header
   * and especially every data cell (very expensive),
   * we will calculate all column sizes at once at the root table level in a useMemo
   * and pass the column sizes down as CSS variables to the <table> element.
   */
  const columnSizeVars = React.useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: number } = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!;
      colSizes[`--header-${header.id}-size`] = header.getSize();
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return colSizes;
  }, [table.getState().columnSizingInfo, table.getState().columnSizing]);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-md border">
        <Table
          style={{
            ...columnSizeVars, //Define column sizes on the <table> element
            minWidth: table.getTotalSize(),
          }}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="*:font-bold">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="group/table-head relative"
                      style={{
                        width: `calc(var(--header-${header?.id}-size) * 1px)`,
                      }}
                    >
                      <DataTableColumnHeader column={header.column}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </DataTableColumnHeader>
                      <div
                        onDoubleClick={() => header.column.resetSize()}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          "z-10 absolute cursor-col-resize select-none w-0.5 h-full top-0 group-hover/table-head:bg-border",
                          header.column.getIsResizing() && "bg-border",
                          i18n.dir() === "rtl" ? "left-0" : "right-0",
                        )}
                      />
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn(cell.column.columnDef.meta?.className)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("common.ui.noData")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  children,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  const toggleSorting = column.getToggleSortingHandler();

  if (!column.getCanSort()) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <Button variant="ghost" size="sm" className="-ml-3" onClick={toggleSorting}>
        <span>{children}</span>
        {column.getIsSorted() === "desc" ? (
          <ChevronDownIcon />
        ) : column.getIsSorted() === "asc" ? (
          <ChevronUpIcon />
        ) : (
          <ChevronsUpDownIcon className="opacity-50" />
        )}
      </Button>
    </div>
  );
}

interface DataTablePaginationProps<TData> {
  table: TanstackReactTable<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  const { t, i18n } = useTranslation();

  const FirstPageIcon = i18n.dir() === "rtl" ? ChevronsRightIcon : ChevronsLeftIcon;
  const LastPageIcon = i18n.dir() === "rtl" ? ChevronsLeftIcon : ChevronsRightIcon;
  const PreviousPageIcon = i18n.dir() === "rtl" ? ChevronRightIcon : ChevronLeftIcon;
  const NextPageIcon = i18n.dir() === "rtl" ? ChevronLeftIcon : ChevronRightIcon;

  if (table.getState().pagination === undefined) return null;

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-2 items-center justify-between px-2">
      <div className="flex items-center space-x-2">
        <p className="text-sm font-medium">{t("common.pagination.rowsPerPage")}</p>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 25, 30, 40, 50, 100].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-[100px] items-center justify-center text-sm font-medium">
        {t("common.pagination.page")} {table.getState().pagination.pageIndex + 1}{" "}
        {t("common.pagination.of")} {Math.max(table.getPageCount(), 1)}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="flex size-8"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">{t("common.pagination.firstPage")}</span>
          <FirstPageIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">{t("common.pagination.previousPage")}</span>
          <PreviousPageIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">{t("common.pagination.nextPage")}</span>
          <NextPageIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="flex size-8"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">{t("common.pagination.lastPage")}</span>
          <LastPageIcon />
        </Button>
      </div>
    </div>
  );
}
