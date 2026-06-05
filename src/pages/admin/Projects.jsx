import React from 'react';
import { ProjectData } from '../../components/mock dataset/Data_admin_project';
import DataTable from '../../components/ui/DataTable';
export default function Project() {


const columns = [
  {
    accessorKey: "projectName",
    header: "PROJECT NAME",
    cell: ({ row, getValue }) => (
      <div className="flex items-center gap-3">
        <div
          className="h-6 w-1 rounded-full"
          style={{
            backgroundColor: row.original.color,
          }}
        />
        <span className="font-semibold text-slate-800">
          {getValue()}
        </span>
      </div>
    ),
  },

  {
    accessorKey: "status",
    header: "STATUS",
    cell: ({ getValue }) => {
      const status = getValue();

      return (
        <span
          className={`rounded-md px-3 py-1 text-xs font-bold ${
            status === "ACTIVE"
              ? "bg-slate-100 text-blue-700"
              : "bg-orange-50 text-orange-500"
          }`}
        >
          {status}
        </span>
      );
    },
  },

  {
    accessorKey: "assignedCount",
    header: "ASSIGNED COUNT",
  },

  {
    accessorKey: "projectTeamMembers",
    header: "PROJECT TEAM MEMBERS",
    cell: ({ getValue }) => {
      const members = getValue();

      return (
        <div className="flex items-center">
          {members.map((member, index) => (
            <div
              key={index}
              className="-ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-xs font-bold text-blue-700 first:ml-0"
            >
              {member}
            </div>
          ))}
        </div>
      );
    },
  },

  {
    accessorKey: "totalTasks",
    header: "TOTAL TASKS",
    cell: ({ getValue }) => (
      <span className="font-semibold text-slate-800">
        {getValue()}
      </span>
    ),
  },

  {
    accessorKey: "actions",
    header: "ACTIONS",
    cell: () => (
      <div className="flex items-center gap-3">
        <button className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50">
          ✏️
        </button>

        <button className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50">
          🗑️
        </button>
      </div>
    ),
  },
];

return(
  <>
  <DataTable Data={ProjectData} columns={columns}/>
  </>
)
  
}