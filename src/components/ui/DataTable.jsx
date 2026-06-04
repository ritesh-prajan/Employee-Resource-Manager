import React from 'react'
import { useState } from 'react'
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'





export default function DataTable({Data,columns}) {
  const [data, setData] = useState(Data)
  console.log("data:",data)
  console.log(columns)
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

      {table.getHeaderGroups().map((headerGroup) => (
        <div
          key={headerGroup.id}
          className="grid grid-cols-9 bg-slate-800 text-white"
        >
          {headerGroup.headers.map((header) => (
            <div
              key={header.id}
              className="px-4 py-3 text-sm font-semibold border-r border-slate-700 last:border-r-0"
            >
              {header.column.columnDef.header}
            </div>
          ))}
        </div>
      ))}

      {table.getRowModel().rows.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-9 border-t border-gray-200 hover:bg-gray-50"
        >
          {row.getVisibleCells().map((cell) => (
            <div
              key={cell.id}
              className="px-4 py-3 text-sm border-r border-gray-200 last:border-r-0"
            >
              {flexRender(
                cell.column.columnDef.cell,
                cell.getContext()
              )}
            </div>
          ))}
        </div>
      ))}

    </div>
  )
}