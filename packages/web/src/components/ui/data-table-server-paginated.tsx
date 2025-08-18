import { PaginatedOutput } from "@erp-system/server/dto/pagination.dto.ts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ColumnDef, OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
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
  const navigate = useNavigate({ from: OrgRoute.fullPath });

  const { page, pageSize, sort, search } = OrgRoute.useSearch();

  const { data: { data, totalCount } = { data: [], totalCount: 0 } } = useQuery(
    procedure.queryOptions({
      search,
      pagination: { page, pageSize },
      sort,
      ...input,
    }),
  );

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
        onPaginationChange={setPagination}
        onSortingChange={setSorting}
        manualPagination
        manualSorting
        manualFiltering
        state={{
          pagination: paginationState,
          sorting: sortingState,
        }}
      />
    </>
  );
}
