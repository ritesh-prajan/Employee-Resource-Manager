import { MOCK_TEAMS } from "../mock_dataset/Data_admin_alert";

export function getteambyid(teamid){
    return MOCK_TEAMS.find((t)=> t.id === teamid) ?? null;
}

export function getchannelbyid(teamid,channelid){
    const team=getteambyid(teamid);
    return team?.channels?.find((c)=>c.id===channelid)??null;
}

export function getchannelsforteam(teamid){
    return getteambyid(teamid)?.channels??[];
}

export function timeago(isostring){
    if (!isostring) return "";
    const parsed = new Date(isostring).getTime();
    if (isNaN(parsed)) return "";
    const diffms=Date.now()-parsed;
    const diffmins=Math.floor(diffms/60_000);

    if(diffmins<1) return "just now";
    if(diffmins<60) return `${diffmins}m ago`;

    const diffhours=Math.floor(diffmins/60);
    if(diffhours<24) return `${diffhours}h ago`;

    const diffdays=Math.floor(diffhours/24);
    return `${diffdays}d ago`
}
export const SEVERITY_CONFIG = {
  info: {
    label: "Info",
    // Tailwind classes for the badge
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    // Tailwind classes for the left border on the card
    borderColor: "border-l-blue-400",
    icon: "ti-info-circle",
  },
  warning: {
    label: "Warning",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    borderColor: "border-l-amber-400",
    icon: "ti-alert-triangle",
  },
  danger: {
    label: "Critical",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    borderColor: "border-l-red-400",
    icon: "ti-alert-octagon",
  },
  success: {
    label: "Success",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
    borderColor: "border-l-green-400",
    icon: "ti-circle-check",
  },
};

export const ALL_SEVERITIES=Object.keys(SEVERITY_CONFIG);