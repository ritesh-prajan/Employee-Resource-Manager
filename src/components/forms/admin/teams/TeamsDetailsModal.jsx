import UserAvatar from "../../../ui/UserAvatar";

export default function TeamDetailsModal({
  isOpen,
  onClose,
  team,
}) {
  if (!isOpen || !team) return null;

  return (
    <div
      className="
        fixed inset-0 z-[999]
        flex items-center justify-center
        bg-black/20 backdrop-blur-sm
        [zoom:80%]
      "
    
      onClick={onClose}
    >
      <div
        className="
          w-[620px]
          rounded-[28px]
          bg-white
          px-10
          py-8
          shadow-[0_20px_60px_rgba(0,0,0,0.15)]
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}

        <div className="mb-8 flex justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-slate-800">
              👥 {team.teamName}
            </h2>

            <p className="text-slate-500">
              Team Directory & Members
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-xl text-slate-400"
          >
            ×
          </button>
        </div>

        <div className="mb-8 border-b-2 border-[#0010AE]" />

        {/* Team Lead */}

        <div className="mb-8">
          <h3 className="mb-3 text-sm font-semibold text-slate-500">
            TEAM LEAD
          </h3>

          <div
            className="
              flex items-center justify-between
              rounded-2xl border
              border-slate-200
              p-4
            "
          >
            <div className="flex items-center gap-4">
              <UserAvatar
                name={team.teamLead.name}
              />

              <div>
                <h4 className="font-semibold">
                  {team.teamLead.name}
                </h4>

                <p className="text-slate-500">
                  {team.teamLead.role} •{" "}
                  {team.teamLead.department}
                </p>

                <p className="text-slate-400">
                  {team.teamLead.email}
                </p>
              </div>
            </div>

            <span
              className="
                rounded-md
                bg-[#0010AE]
                px-4 py-1
                text-xs font-semibold
                text-white
              "
            >
              LEAD
            </span>
          </div>
        </div>

        {/* Members */}

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-500">
            TEAM MEMBERS ({team.members.length})
          </h3>

          <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2" >
            {team.members.map((member, index) => (
              <div
                key={index}
                className="
                  flex items-center justify-between
                  rounded-2xl border
                  border-slate-200
                  p-4
                "
              >
                <div className="flex items-center gap-4">
                  <UserAvatar
                    name={member.name}
                  />

                  <div>
                    <h4 className="font-semibold text-slate-800">
                      {member.name}
                    </h4>

                    <p className="text-slate-500">
                      {member.role} •{" "}
                      {member.department}
                    </p>

                    <p className="text-slate-400">
                      {member.email}
                    </p>
                  </div>
                </div>

                <span
                  className="
                    rounded-full
                    bg-[#E8EAFE]
                    px-3 py-1
                    text-sm
                    font-semibold
                    text-[#0010AE]
                  "
                >
                  {member.activeTasks} active tasks
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}