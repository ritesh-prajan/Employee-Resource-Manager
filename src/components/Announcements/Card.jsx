
import { getteambyid,getchannelbyid,timeago,SEVERITY_CONFIG } from "./healpers";
export default function Card ({ announcement }){
    const { title, content, severity, createdBy, createdAt, teamId, channelId } = announcement;
    const sev=SEVERITY_CONFIG[severity]??SEVERITY_CONFIG.info

    const team =teamId?getteambyid(teamId):null;
    const channel= channelId?getchannelbyid(teamId,channelId):null;

    return(
        <div
        className={`
            bg-white rounded-xl border border-gray-200
            border-l-4 ${sev.borderColor}
            p-5 flex flex-col gap-3
            `}

            
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <span
                    className={`
                        inline-flex items-center gap-1.5
                        text-xs font-medium px-2.5 py-0.5 rounded-full w-fit
                        ${sev.badgeBg} ${sev.badgeText}
                        `}
                    >
                        <i className={`ti ${sev.icon} text-sm`} aria-hidden="true"/>
                            {sev.label}
                       
                        
                    </span>
                    <h3 className="text-[15px] font-medium text-gray-900 leading-snug">
                        {title}
                    </h3>

                </div>
                {team&&channel&&(
                    <div className="shrink-0 text-right">
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 justify-end">
                            <i className="ti ti-brand-teams text-[13px]" aria-hidden="true"></i>
                            Teams
                        </p>
                        <p className="text-xs font-medium text-gray-700">{team.name}</p>
                        <p className="text-xs text-gray-400">#{channel.name}</p>
                    </div>
                )}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{createdBy}</span>
                <span>.</span>
                <span>{timeago(createdAt)}</span>
            </div>
        </div>
    )
}