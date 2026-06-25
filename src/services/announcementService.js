
import { api } from "./api";


function mapannouncement(ann){
    let creatorName = 'Admin';
    if (ann.createdBy) {
        if (typeof ann.createdBy === 'object' && ann.createdBy.name) {
            creatorName = ann.createdBy.name;
        } else if (typeof ann.createdBy === 'string') {
            creatorName = ann.createdBy;
        }
    }

    return {
        id:ann.id,
        title:ann.title,
        content:ann.content,
        severity:ann.severity?.toLowerCase()||'info',
        createdBy:creatorName,
        createdAt:ann.createdAt||new Date().toISOString(),
        publishToInternal:ann.publishToInternal??true,
        publishToTeams:false,
        teamsId:null,
        channelId:null,
    };
}

export const  announcementService={
    getAll: async()=>{
        const data=await api.get('/feed');
        return Array.isArray(data)?data.map(mapannouncement):[];
    },
    getById: async(id)=>{
        const data=await api.get(`/feed/${id}`);
        return mapannouncement(data);
    },

    create:async (anndata)=>{
        const body={
            title:anndata.title,
            content:anndata.content,
            severity:(anndata.severity||'info').toUpperCase(),
            publishToInternal:true,
            publishToTeams:false,
        }
        const data=await api.post('/feed',body);
        return mapannouncement(data);
    },
    delete:async(id)=>{
        return api.delete(`/feed/${id}`);
    }
}