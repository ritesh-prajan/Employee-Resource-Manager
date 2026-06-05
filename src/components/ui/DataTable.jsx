import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
} from "@tanstack/react-table";


export default function DataTable({ Data = [], columns = [] }) {
  const [data] = useState(Data);
  const [pagination,setpagination]=useState({
    pageSize:8,
    pageIndex:0,
  })
  const table = useReactTable({
    data,
    columns,
    
    state:{
      pagination,
    },
    onPaginationChange:setpagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel:getPaginationRowModel(),

  },
  
);

  return (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-slate-200 bg-slate-50"
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-5 py-4 text-left text-sm font-bold uppercase tracking-wide text-slate-700 border-r border-slate-200 last:border-r-0"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-5 py-4 text-sm text-slate-700 border-r border-slate-200 last:border-r-0"
                >
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
      <p className="text-sm text-slate-500">
        Showing{" "}
        {pagination.pageIndex * pagination.pageSize + 1}
        –
        {Math.min(
          (pagination.pageIndex + 1) * pagination.pageSize,
          data.length
        )}{" "}
        of {data.length} staff members
      </p>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">
            Per page:
          </span>

          <select
            value={pagination.pageSize}
            onChange={(e) =>
              table.setPageSize(Number(e.target.value))
            }
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none"
          >
            {[5, 10, 20].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500 disabled:opacity-50"
          >
            Prev
          </button>

          {Array.from(
            { length: table.getPageCount() },
            (_, index) => (
              <button
                key={index}
                onClick={() => table.setPageIndex(index)}
                className={`h-10 w-10 rounded-lg text-sm font-semibold transition-colors ${
                  pagination.pageIndex === index
                    ? "bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {index + 1}
              </button>
            )
          )}

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
);

}