import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
} from "@tanstack/react-table";

export default function DataTable({ Data = [], columns = [], onRowClick }) {
  const [pagination, setPagination] = useState({
    pageSize: 8,
    pageIndex: 0,
  });

  const table = useReactTable({
    data: Data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b-2 border-slate-200">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-500 ${
                      header.id === 'actions' ? 'sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]' : ''
                    }`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            <tr className="h-2" />
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-slate-400">
                  No results found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-6 py-4 text-sm text-slate-600 align-middle ${
                        cell.column.id === 'actions' ? 'sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]' : ''
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <span className="text-sm text-slate-500">
            Showing{" "}
            <strong>{pagination.pageIndex * pagination.pageSize + 1}–{Math.min((pagination.pageIndex + 1) * pagination.pageSize, Data.length)}</strong>{" "}
            of <strong>{Data.length}</strong>
          </span>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 mr-1">Per page:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-600 bg-white focus:outline-none"
            >
              {[5, 10, 20].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>

            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed ml-2"
            >
              Prev
            </button>

            {Array.from({ length: table.getPageCount() }, (_, index) => (
              <button
                key={index}
                onClick={() => table.setPageIndex(index)}
                className={`w-8 h-8 text-sm rounded-lg font-medium ${
                  pagination.pageIndex === index
                    ? "bg-blue-700 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}