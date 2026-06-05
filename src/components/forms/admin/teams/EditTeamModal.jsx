import { useState } from "react";

export default function EditTeamModal({
  isOpen,
  onClose,
  team,
  onSave,
}) {
  const [teamName, setTeamName] = useState(
    team?.teamName || ""
  );

  const [teamLead] = useState(
    team?.teamLead?.name || ""
  );

  const [members, setMembers] = useState(
    team?.members || []
  );

  if (!isOpen) return null;

  const removeMember = (id) => {
    setMembers((prev) =>
      prev.filter((member) => member.id !== id)
    );
  };

  const handleSave = () => {
    onSave?.({
      ...team,
      teamName,
      members,
    });
  };

  return (
    <div
      className="
        fixed inset-0 z-[999]
        flex items-center justify-center
        bg-black/20 backdrop-blur-sm
      "
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
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[#243447]">
            Edit Team
          </h2>

          <button
            onClick={onClose}
            className="text-xl text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        </div>

        {/* Team Name */}
        <div className="mb-7">
          <label className="mb-3 block text-[14px] font-semibold text-[#5C6778]">
            TEAM NAME
          </label>

          <input
            value={teamName}
            onChange={(e) =>
              setTeamName(e.target.value)
            }
            className="
              h-[52px]
              w-full
              rounded-[16px]
              border
              border-[#D8DDE8]
              px-5
              text-[16px]
              outline-none
              focus:border-[#0010AE]
            "
          />
        </div>

        {/* Team Lead */}
        <div className="mb-7">
          <label className="mb-3 block text-[14px] font-semibold text-[#5C6778]">
            TEAM LEAD
          </label>

          <input
            value={`${teamLead} (Team Lead)`}
            readOnly
            className="
              h-[52px]
              w-full
              rounded-[16px]
              border
              border-[#D8DDE8]
              bg-white
              px-5
              text-[16px]
              text-slate-500
            "
          />
        </div>

        {/* Members */}
        <div className="mb-8">
          <label className="mb-4 block text-[14px] font-semibold text-[#5C6778]">
            TEAM MEMBERS
          </label>

          <div className="mb-4 flex flex-wrap gap-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="
                  flex items-center gap-2
                  rounded-md
                  bg-[#E8EAFE]
                  px-3 py-1
                  text-[13px]
                  font-medium
                  text-[#0010AE]
                "
              >
                <span>
                  {member.name} ({member.role})
                </span>

                <button
                  onClick={() =>
                    removeMember(member.id)
                  }
                  className="font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <input
            placeholder="Search and select team members..."
            className="
              h-[52px]
              w-full
              rounded-[16px]
              border
              border-[#D8DDE8]
              px-5
              text-[16px]
              outline-none
              focus:border-[#0010AE]
            "
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
            "
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="
              h-[52px]
              min-w-[190px]
              rounded-full
              bg-[#0010AE]
              px-8
              text-[15px]
              font-semibold
              text-white
            "
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}