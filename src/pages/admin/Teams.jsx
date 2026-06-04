import DataTable from "../../components/ui/DataTable";
import { TeamData } from "../../components/mock dataset/Data_admin_team";
import UserAvatar from "../../components/ui/UserAvatar";

const columns = [
  {
    accessorKey: "teamName",
    header: "TEAM NAME",
    cell: ({ getValue }) => (
      <span className="font-semibold text-blue-700 hover:underline cursor-pointer">
        {getValue()}
      </span>
    ),
  },

  {
    accessorKey: "teamLead",
    header: "TEAM LEAD",
    cell: ({ getValue }) => {
      const name = getValue();

      return (
        <div className="flex items-center gap-3">
          <UserAvatar name={name} />

          <span className="font-medium text-slate-700 whitespace-nowrap">
            {name}
          </span>
        </div>
      );
    },
  },

  {
    accessorKey: "membersCount",
    header: "MEMBERS COUNT",
    cell: ({ getValue }) => (
      <span className="text-slate-700">{getValue()}</span>
    ),
  },

  {
    accessorKey: "teamMembers",
    header: "TEAM MEMBERS",
    cell: ({ row }) => {
      const members = row.original.teamMembers;
      const extra = row.original.extraMembers;

      return (
        <div className="flex items-center">
          {members.map((member, index) => (
            <div
              key={index}
              className="-ml-1 first:ml-0 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-indigo-100 text-[11px] font-bold text-indigo-700"
            >
              {member}
            </div>
          ))}

          {extra > 0 && (
            <div className="-ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-[11px] font-bold text-slate-600">
              +{extra}
            </div>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "createdDate",
    header: "CREATED DATE",
    cell: ({ getValue }) => (
      <span className="text-slate-500">{getValue()}</span>
    ),
  },

  {
    id: "actions",
    header: "ACTIONS",
    cell: () => (
      <div className="flex items-center gap-2">
        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition">
          ✏️
        </button>

        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition">
          🗑️
        </button>
      </div>
    ),
  },
];

export default function Teams() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Organizational Teams
          </h1>

          <p className="mt-1 text-slate-500">
            Manage and view all department teams, assigned leads, and Team
            members.
          </p>
        </div>

        <button className="rounded-xl bg-blue-700 px-5 py-3 font-medium text-white transition hover:bg-blue-800">
          + Create Team
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex justify-end gap-3">
        <select className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600">
          <option>All Projects</option>
        </select>

        <select className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600">
          <option>All Employees</option>
        </select>
      </div>

      {/* Table */}
      <DataTable Data={TeamData} columns={columns} />
    </div>
  );
}