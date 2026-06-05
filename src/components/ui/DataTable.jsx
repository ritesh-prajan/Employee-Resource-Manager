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
                    className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide text-slate-700"
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
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 text-sm text-slate-700 align-middle"
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
        <div className="flex items-center gap-4 mt-3">
          <button
          onClick={()=>table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          >
            Prev
          </button>
          <span>
            Page {pagination.pageIndex+1} of {table.getPageCount()}
          </span>

          <button
          onClick={()=>table.nextPage()}
          disabled={!table.getCanNextPage()}
          >
            Next
          </button>

          <select value={pagination.pageIndex}
          onChange={(e)=>table.setPageIndex(Number(e.target.value))}
          >
            {Array.from(
              {length:table.getPageCount()},
              (_, index) => (
                <option key={index} value={index}>
                  Page {index+1}
                </option>
              )
            )}
          </select>
          <select value={pagination.pageSize}
          onChange={(e)=>table.setPageSize(Number(e.target.value))}
          >
            {[5,10,20].map((size)=>(
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}