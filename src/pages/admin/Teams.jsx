import DataTable from "../../components/ui/DataTable";
import { TeamData } from "../../components/mock dataset/Data_admin_team";
import UserAvatar from "../../components/ui/UserAvatar";
import MultiSearchSelect from "../../components/ui/MultiSelectDropdown";
import { useState } from "react";
import CreateTeamModal from "../../components/forms/admin/teams/CreateTeamModal";
import TeamDetailsModal from "../../components/forms/admin/teams/TeamsDetailsModal";
import EditTeamModal from "../../components/forms/admin/teams/EditTeamModal";

export default function Teams() {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const handleRowClick = (team) => {
    setSelectedTeam(team);
    setIsDetailsModalOpen(true);
  };

  const handleEditClick = (team) => {
    setSelectedTeam(team);
    setIsEditModalOpen(true);
  };

  const columns = [
    {
      accessorKey: "teamName",
      header: "TEAM NAME",
      cell: ({ getValue }) => (
        <span className="cursor-pointer text-[15px] font-semibold text-[#0010AE] hover:underline">
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: "teamLead",
      header: "TEAM LEAD",
      cell: ({ getValue }) => {
        const lead = getValue();
        return (
          <div className="flex items-center gap-3">
            <UserAvatar name={lead.name} />
            <span className="whitespace-nowrap font-medium text-slate-700">
              {lead.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "membersCount",
      header: "MEMBERS COUNT",
      cell: ({ row }) => (
        <span className="text-slate-700">{row.original.members.length} members</span>
      ),
    },
    {
      id: "teamMembers",
      header: "TEAM MEMBERS",
      cell: ({ row }) => {
        const members = row.original.members.slice(0, 6);
        const extra = Math.max(row.original.members.length - 6, 0);
        return (
          <div className="flex items-center p-8 [zoom:80%]">
            {members.map((member, index) => (
              <div
                key={index}
                className="
                  -ml-1 first:ml-0 flex h-8 w-8 items-center justify-center
                  rounded-full border border-[#C9D0F3] bg-[#E4E7F7]
                  text-[11px] font-bold text-[#0010AE]
                "
              >
                {member.name.split(" ").map((word) => word[0]).join("")}
              </div>
            ))}
            {extra > 0 && (
              <div
                className="
                  -ml-1 flex h-8 w-8 items-center justify-center
                  rounded-full border border-slate-300 bg-slate-200
                  text-[11px] font-bold text-slate-600
                "
              >
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
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <button
            className="
              flex h-9 w-9 items-center justify-center rounded-lg
              border border-slate-200 bg-slate-50 text-[#0010AE]
              transition hover:bg-slate-100
            "
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(row.original);
            }}
          >
            ✏️
          </button>
          <button
            className="
              flex h-9 w-9 items-center justify-center rounded-lg
              border border-red-200 bg-red-50 text-red-500
              transition hover:bg-red-100
            "
            onClick={(e) => {
              e.stopPropagation();
              console.log("Delete", row.original);
            }}
          >
            🗑️
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="min-h-screen bg-[#F3F4F6] p-8">
        {/* Header */}
        <div className="mb-8 border-b border-slate-200 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-left text-slate-800">
                Organizational Teams
              </h1>
              <p className="mt-1 text-[14px] text-slate-500">
                Manage and view all department teams, assigned leads, and Team members.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <MultiSearchSelect
                width="w-[320px]"
                height="h-[42px]"
                placeholder="All Projects"
                selectedValues={projects}
                onChange={setProjects}
                options={[
                  { value: "all", label: "All Projects" },
                  { value: "alpha", label: "Project Alpha" },
                  { value: "beta", label: "Project Beta" },
                  { value: "gamma", label: "Project Gamma" },
                  { value: "rnd", label: "Internal R&D / Ops" },
                ]}
              />
              <MultiSearchSelect
                width="w-[320px]"
                height="h-[42px]"
                placeholder="All Employees"
                selectedValues={employees}
                onChange={setEmployees}
                options={[
                  { value: "all", label: "All Employees" },
                  { value: "alex", label: "Alex" },
                  { value: "david", label: "David" },
                  { value: "emma", label: "Emma" },
                  { value: "john", label: "John Doe" },
                ]}
              />
              <button
                className="
                  flex h-10 items-center gap-2 rounded-full bg-[#0010AE]
                  px-6 text-sm font-semibold text-white transition hover:bg-[#000D8F]
                "
                onClick={() => setIsCreateModalOpen(true)}
              >
                <span className="text-lg">+</span>
                Create Team
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <DataTable Data={TeamData} columns={columns} onRowClick={handleRowClick} />
      </div>

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        employeeOptions={[
          { value: "alex", label: "Alex" },
          { value: "david", label: "David" },
          { value: "emma", label: "Emma" },
          { value: "john", label: "John Doe" },
        ]}
        onSubmit={(data) => {
          console.log(data);
          setIsCreateModalOpen(false);
        }}
      />

      <TeamDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        team={selectedTeam}
      />

      <EditTeamModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        team={selectedTeam}
        onSave={(updatedTeam) => {
          console.log(updatedTeam);
          setIsEditModalOpen(false);
        }}
      />
    </div>
  );
}