import { PaginatedOutput } from "@erp-system/server/dto/pagination.dto.ts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ColumnDef, OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { DecorateQueryProcedure } from "@trpc/tanstack-react-query";

import { Route as OrgRoute } from "@/routes/orgs.$orgSlug/route.tsx";

import { DataTable } from "./data-table.tsx";

export type ServerPaginationParams = {
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
}

export function DataTableServerPaginated<TInput extends ServerPaginationParams, TData>({
  columns,
  procedure,
  input,
}: DataTableProps<TInput, TData>) {
  const navigate = useNavigate({ from: OrgRoute.fullPath });

  const { page, pageSize, sorting } = OrgRoute.useSearch();

  const { data: { data, totalCount } = { data: [], totalCount: 0 } } = useQuery(
    procedure.queryOptions({
      pagination: { page, pageSize },
      sorting,
      ...input,
    }),
  );

  const paginationState = { pageIndex: page, pageSize: pageSize };
  const sortingState = sorting.map((s) => ({ id: s.orderBy, desc: s.desc }));

  const updateSearchParams = (pagination: PaginationState, sorting: SortingState) => {
    navigate({
      search: {
        page: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting: sorting.map((s) => ({ orderBy: s.id, desc: s.desc })),
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
    <DataTable
      data={data}
      columns={columns}
      rowCount={totalCount}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      manualPagination
      manualSorting
      state={{
        pagination: paginationState,
        sorting: sortingState,
      }}
    />
  );
}
