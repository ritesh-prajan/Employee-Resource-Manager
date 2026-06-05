import { useState } from "react";
import MultiSearchSelect from "../../../ui/MultiSelectDropdown";

export default function CreateTeamModal({
  isOpen,
  onClose,
  onSubmit,
  employeeOptions = [],
}) {
  const [teamName, setTeamName] = useState("");
  const [teamLead, setTeamLead] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit?.({
      teamName,
      teamLead,
      teamMembers,
    });

    setTeamName("");
    setTeamLead([]);
    setTeamMembers([]);
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/20 backdrop-blur-sm [zoom:80%]"
      onClick={onClose}
    >
      <div
        className="
          w-[580px]
          rounded-[28px]
          bg-white
          px-10
          py-9
          shadow-[0_20px_60px_rgba(0,0,0,0.15)]
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <h2 className="text-[20px] font-bold text-[#243447]">
            Create New Team
          </h2>

          <button
            onClick={onClose}
            className="
              text-[24px]
              leading-none
              text-slate-400
              transition
              hover:text-slate-600
            "
          >
            ×
          </button>
        </div>

        {/* Team Name */}
        <div className="mb-8">
          <label className="mb-3 block text-[14px] font-semibold text-[#475569]">
            TEAM NAME
          </label>

          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="E.g. Engineering Core, Design Team"
            className="
              h-[52px]
              w-full
              rounded-[14px]
              border
              border-[#D8DDE8]
              px-5
              text-[16px]
              text-slate-700
              outline-none
              transition
              focus:border-[#0010AE]
            "
          />
        </div>

        {/* Team Lead */}
        <div className="mb-8">
          <label className="mb-3 block text-[14px] font-semibold text-[#475569]">
            TEAM LEAD
          </label>

          <MultiSearchSelect
            width="w-full"
            height="h-[52px]"
            placeholder="Search and select team lead..."
            selectedValues={teamLead}
            onChange={setTeamLead}
            singleSelect={true}
            options={employeeOptions}
          />
        </div>

        {/* Team Members */}
        <div className="mb-8">
          <label className="mb-2 block text-[14px] font-semibold text-[#475569]">
            TEAM MEMBERS
          </label>

          <p className="mb-4 text-[15px] italic text-slate-400">
            {teamMembers.length === 0
              ? "None selected"
              : `${teamMembers.length} selected`}
          </p>

          <MultiSearchSelect
            placeholder="Search and select team members..."
            selectedValues={teamMembers}
            onChange={setTeamMembers}
            options={employeeOptions}
          />
        </div>

        {/* Divider */}
        <div className="mb-6 border-t border-[#E5E7EB]" />

        {/* Footer */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="
              h-[52px]
              min-w-[125px]
              rounded-full
              bg-[#EEF2F6]
              px-8
              text-[15px]
              font-semibold
              text-[#334155]
              transition
              hover:bg-[#E2E8F0]
            "
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="
              h-[52px]
              min-w-[175px]
              rounded-full
              bg-[#0010AE]
              px-8
              text-[15px]
              font-semibold
              text-white
              transition
              hover:bg-[#000D8F]
            "
          >
            Create Team
          </button>
        </div>
      </div>
    </div>
  );
}