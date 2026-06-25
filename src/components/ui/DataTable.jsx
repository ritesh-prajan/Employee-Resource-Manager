import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
} from "@tanstack/react-table";
import Pagination from "./Pagination";

export default function DataTable({ Data = [], columns = [], onRowClick, getRowClassName }) {
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
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-20 py-12 text-center text-sm text-slate-400">
                  No results found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-task-id={row.original.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                    getRowClassName ? getRowClassName(row.original) : ''
                  }`}
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      data-label={typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : cell.column.id}
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
      </div>
      {/* Pagination */}
      <Pagination table={table} pagination={pagination} totalRows={Data.length} />
    </div>
  );
}