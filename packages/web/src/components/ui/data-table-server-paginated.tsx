import { PaginatedOutput } from "@erp-system/server/dto/pagination.dto.ts";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DecorateQueryProcedure } from "@trpc/tanstack-react-query";
import { Input } from "@/shadcn/components/ui/input.tsx";

import { Route as OrgRoute } from "@/routes/orgs.$orgSlug/route.tsx";

import { DataTable } from "./data-table.tsx";

export type ServerPaginationParams = {
  search?: string;
  pagination?: {
    page?: number;
    pageSize?: number;
  };
  sorting?: {
    orderBy?: string;
    desc?: boolean;
  }[];
};

interface DataTableProps<TInput extends ServerPaginationParams, TData> {
  input: TInput;
  procedure: DecorateQueryProcedure<{
    input: TInput;
    output: PaginatedOutput<TData[]>;
    transformer: true;
    // deno-lint-ignore no-explicit-any
    errorShape: any;
  }>;
  // deno-lint-ignore no-explicit-any
  columns: ColumnDef<TData, any>[];
  searchPlaceholder?: string;
}

export function DataTableServerPaginated<TInput extends ServerPaginationParams, TData>({
  columns,
  procedure,
  input,
  searchPlaceholder,
}: DataTableProps<TInput, TData>) {
  const navigate = OrgRoute.useNavigate();

  const { page, pageSize, sort, search } = OrgRoute.useSearch();

  const { data: { data, totalCount } = { data: [], totalCount: 0 } } = useQuery(
    procedure.queryOptions({
      search,
      pagination: { page, pageSize },
      sort,
      ...input,
    }),
  );

  return (
    <>
      <div className="flex justify-end">
        <Input
          placeholder={searchPlaceholder}
          value={search ?? ""}
          onChange={(event) => navigate({ search: { search: event.target.value, page: 0 } })}
          className="max-w-sm"
        />
      </div>

      <DataTable
        data={data}
        columns={columns}
        rowCount={totalCount}
        manualPagination
        manualSorting
        manualFiltering
      />
    </>
  );
}
