import { Data } from "../../components/ui/data";
import DataTable from "../../components/ui/DataTable";
import UserAvatar from "../../components/ui/UserAvatar";

const columns = [
  {
    accessorKey: "staffMember",
    header: "STAFF MEMBER",
    cell: ({ getValue }) => {
      const name = getValue();
      const parts = name.split(" ");

      return (
        <div className="flex items-center gap-4">
          <UserAvatar name={name} />

          <div>
            <p className="font-semibold text-slate-700 leading-tight">
              {parts[0]}
            </p>
            <p className="font-semibold text-slate-700 leading-tight">
              {parts.slice(1).join(" ")}
            </p>
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: "employeeId",
    header: "EMPLOYEE ID",
    cell: ({ getValue }) => (
      <span className="font-mono text-slate-500">
        {getValue()}
      </span>
    ),
  },

  {
    accessorKey: "designation",
    header: "DESIGNATION",
  },

  {
    accessorKey: "workEmail",
    header: "WORK EMAIL",
    cell: ({ getValue }) => (
      <a
        href={`mailto:${getValue()}`}
        className="text-blue-700 hover:underline"
      >
        {getValue()}
      </a>
    ),
  },

  {
    accessorKey: "personalEmail",
    header: "PERSONAL EMAIL",
    cell: ({ getValue }) => (
      <span className="text-slate-400">
        {getValue()}
      </span>
    ),
  },

  {
    accessorKey: "phone",
    header: "PHONE",
  },

  {
    accessorKey: "activeTasks",
    header: "ACTIVE TASKS",
    cell: ({ getValue }) => (
      <span className="font-semibold text-blue-700">
        {getValue()}
      </span>
    ),
  },

  {
    accessorKey: "role",
    header: "ROLE",
    cell: ({ getValue }) => (
      <span className="rounded-md bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
        {getValue()}
      </span>
    ),
  },

  {
    accessorKey: "status",
    header: "STATUS",
    cell: ({ getValue }) => (
      <span className="font-semibold text-emerald-500">
        {getValue()}
      </span>
    ),
  },
  {
    accessorKey:"action",
    header: "ACTION",
    cell:()=>(
        <>
        <button></button>
        </>
    )
  }
];

export default function EmployeesPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto mx-auto">
        {/* Toolbar */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 md:flex-row">
              <input
                type="text"
                placeholder="Search employees..."
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
              />

              <select className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <option>All Projects</option>
              </select>

              <select className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <option>All Teams</option>
              </select>
            </div>

            <button className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800">
              + Add Staff Member
            </button>
          </div>
        </div>

        {/* Table */}
        <DataTable Data={Data} columns={columns} />
      </div>
    </div>
  );
}


