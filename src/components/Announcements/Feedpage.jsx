import { useState } from "react";
import Card from "./Card";
import { SEVERITY_CONFIG,ALL_SEVERITIES } from "./healpers";

export default function Feedpage({announcement}){
    const [activefilter,setactivefilter]=useState("all");

    const filtered=
    activefilter==="all"?
    announcement:
    announcement.filter((a)=>a.severity===activefilter);

    return(
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
                <button
                onClick={()=>setactivefilter("all")}
                className={`
                    px-3 py-1 rounded-full text-sm border transition-colors
                    ${
                        activefilter==="all"
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }
                    `}
                >
                    All
                </button>
                {ALL_SEVERITIES.map((sev)=>{
                    const config=SEVERITY_CONFIG[sev];
                    const isactive=activefilter===sev;
                    return(
                        <button
                        key={sev}
                        onClick={()=>setactivefilter(sev)}
                        className={`
                            px-3 py-1 rounded-full text-sm border transition-colors
                            ${
                                isactive
                                ?`${config.badgeBg} ${config.badgeText} border-transparent`
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                            }
                            `}
                        >
                            {config.label}
                        </button>
                    )
                })}
            </div>
            {filtered.length===0?(
                <div className="text-center py-16 text-gray-400">
                    <i className="ti ti-speakerphone text-4xl block mb-3" aria-hidden="true"></i>
                    <p className="text-sm">No annoucements yet</p>
                </div>
            ):(
                <div className="flex flex-col gap-3">
                    {filtered.map((ann)=>(
                        <Card key={ann.id} announcement={ann}/>
                    ))}
                </div>
            )}

        </div>
    )
}