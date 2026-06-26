import {api} from './api';
function maptask(task){
    return{
        id:task.id,
        taskNumber:task.taskNumber,
        name:task.title,
        title:task.title,
        description:task.description||"",
        taskType:task.taskType,
        type:maptasktype(task.taskType),
        priority:mappriority(task.priority),
        status:mapstatus(task.status),
        etaHours:task.etaHours||0,
        eta:task.etaHours||0,
        etaDate:task.etaDate||"",
        originalEtaDate:task.originalEtaDate||"",
        extendedEtaDate:task.extendedEtaDate||"",
        bugNumber:task.bugNumber||"",
        epic:task.epic||"",
        assignedTo:task.assignedTo?.id||null,
        assignedToObj:task.assignedTo||null,
        projectId:task.project?.id||null,
        projectObj:task.project||null,
        logged:0,
        comments:[],
        progress:0,
        tags:[],
        completionReviewStatus:task.completionReviewStatus||task.completetionReviewStatus||null,
        reviewComment:task.reviewComment||"",
    };

}
function maptasktag(tag){
    return{
        id:tag.id,
        name:tag.name,
        color:tag.color||"#888888",
        taskId:tag.task?.id||null,
    }
}

function maptasktransfer(transfer){
    return{
        id:transfer.id,
        taskId:transfer.task?.id||null,
        taskTitle:transfer.task?.title||"",
        fromEmployeeId:transfer.fromEmployee?.id||null,
        fromEmployee:transfer.fromEmployee||null,
        toEmployeeId:transfer.toEmployee?.id||null,
        toEmployee:transfer.toEmployee||null,
        reason:transfer.reason||null,
        status:transfer.status||"PENDING",
        createdAt:transfer.createdAt||"",
        resolvedAt:transfer.resolvedAt||"",
    }
}

function mapetaextension(eta){
    return{
        id:eta.id,
        taskId:eta.task?.id||null,
        taskTitle:eta.task?.title||"",
        requestedById:eta.requestedBy?.id||null,
        requestedBy:eta.requestedBy||null,
        originalEtaDate:eta.originalEtaDate||"",
        newEtaDate:eta.newEtaDate||"",
        reason:eta.reason||"",
        status:eta.status||"PENDING",
        createdAt:eta.createdAt||"",
        resolvedAt:eta.resolvedAt||"",
    }
}

function maptasktype(type){
    const map={
        'FEATURE': 'Feature',
    'BUG':     'Bug',
    'STORY':   'Story',
    'RND':     'R&D',
    'CRC':     'CRC',
    'COC':     'COC',
    'SUPPORT': 'Support',
    'TASK':    'Task',
    'POC':     'POC',
    }
    return map[type]||type;
}

function mappriority(priority){
    const map={
        'LOW':      'Low',
        'MEDIUM':   'Medium',
        'HIGH':     'High',
        'CRITICAL': 'Critical',
    }
    return map[priority]||priority;
}

function mapstatus(status){
    const map = {
    'OPEN':            'Open',
    'IN_PROGRESS':     'In Progress',
    'PENDING_REVIEW':  'Pending Review',
    'COMPLETED':       'Completed',
    'OVER_ETA':        'Over ETA',
    'TRANSFERRED':     'Transferred',
    'ETA_EXTENDED':    'ETA Extended',
    'REJECTED':        'Rejected',
  };
  return map[status]||status;
}

function tobackendpriority(priority){
    const map={
        'Low':      'LOW',
        'Medium':   'MEDIUM',
        'High':     'HIGH',
        'Critical': 'CRITICAL',
    
    }
    return map[priority]||(priority?priority.toUpperCase():"MEDIUM")
}

function tobackendstatus(status){
    const map = {
    'Open':           'OPEN',
    'In Progress':    'IN_PROGRESS',
    'Pending Review': 'PENDING_REVIEW',
    'Completed':      'COMPLETED',
    'Over ETA':       'OVER_ETA',
    'Transferred':    'TRANSFERRED',
    'ETA Extended':   'ETA_EXTENDED',
    'Rejected':       'REJECTED',
  };
  if (!status) return "OPEN";
  return map[status] || status.toUpperCase().replace(/\s+/g, '_');
}

function tobackendtask(data){
    const body = {};

    if (data.taskNumber !== undefined) body.taskNumber = data.taskNumber;

    if (data.title !== undefined || data.name !== undefined) {
        body.title = data.title || data.name;
    }

    if (data.description !== undefined) body.description = data.description;

    const projectId = data.projectId || data.project?.id;
    if (projectId !== undefined) {
        body.project = projectId ? { id: projectId } : null;
    }

    if (data.taskType !== undefined || data.type !== undefined) {
        const tasktypestr = (data.taskType || data.type || "TASK").toUpperCase();
        const validtypes = ['FEATURE', 'BUG', 'STORY', 'RND', 'CRC', 'COC', 'SUPPORT', 'TASK', 'POC'];
        body.taskType = validtypes.includes(tasktypestr) ? tasktypestr : "TASK";
    }

    if (data.priority !== undefined) {
        body.priority = tobackendpriority(data.priority);
    }

    if (data.status !== undefined) {
        body.status = tobackendstatus(data.status);
    }

    if (data.etaHours !== undefined || data.eta !== undefined) {
        body.etaHours = parseFloat(data.etaHours || data.eta || 0);
    }

    if (data.etaDate !== undefined) body.etaDate = data.etaDate;
    if (data.epic !== undefined) body.epic = data.epic;

    if (data.assignedTo !== undefined || data.assignedToId !== undefined) {
        const assId = data.assignedTo || data.assignedToId;
        body.assignedTo = assId ? { id: assId } : null;
    }

    const taskTypeVal = body.taskType || (data.taskType || data.type || "").toUpperCase();
    if (taskTypeVal === "BUG" && data.bugNumber !== undefined) {
        body.bugNumber = data.bugNumber;
    }

    return body;
}

export const taskService={
    getAll:async()=>{
        const data=await api.get('/tasks');
        return data.map(maptask);
    },
    getById:async(id)=>{
        const data=await api.get(`/tasks/${id}`)
        return maptask(data);
    },
    create:async(taskdata)=>{
        const body=tobackendtask(taskdata);
        const data= await api.post('/tasks',body);
        return maptask(data);

    },
    update:async(id,taskdata)=>{
        const body=tobackendtask(taskdata);
        const data= await api.patch(`/tasks/${id}`,body);
        return maptask(data);
    },
    delete:async(id,reason='Deleted by admin')=>{
        return api.delete(`/tasks/${id}`, reason);
    },
    unassign:async(id)=>{
        return api.patch(`/tasks/${id}/unassign`)
    },
    assignTask:async(taskid,userid)=>{
        return taskService.update(taskid,{assignedTo:userid});
    },
    unassignTask:async(taskid)=>{
        return taskService.unassign(taskid);
    },
    getBacklog:async()=>{
        const data=await api.get('/tasks');
        return data.filter(t=>!t.assignedTo).map(maptask);
    },
    getByProject:async(projectid)=>{
        const data=await api.get(`/tasks`)
        return data.filter(t=>t.project?.id===projectid).map(maptask);
    },
    getHistory:async(taskid)=>{
        return api.get(`/tasks/${taskid}/history`);
    },
    downloadAttachement:async(taskid,attachmentid)=>{
        return api.get(`/tasks/${taskid}/attachments/${attachmentid}`)
    },
    getComments:async(taskid)=>{
        return api.get(`/tasks/${taskid}/comments`)
    },
    addComment:async(taskid,authoremployeeid,commenttext)=>{
        return api.post('/task-comments',{
            task:{id:taskid},
            author:{id:authoremployeeid},
            commentText:commenttext,
            createdAt: new Date().toISOString().slice(0, -1)
        })
    },
    deletecomment:async(commentid)=>{
        return api.delete(`/task-comments/${commentid}`);
    },
    getProgress:async(taskid)=>{
        return api.get(`/tasks/${taskid}/progress`)
    },
    addProgress:async(taskid,employeeidm,progressPercentage,progressnote)=>{
        return api.post('/task-progress',{
            task:{id:taskid},
            employee:{id:employeeidm},
            progressPercentage:parseInt(progressPercentage,10),
            notes:progressnote,
        })
    },
    deleteProgress:async(progressid)=>{
        return api.delete(`/task-progress/${progressid}`);
    },
    getAllTags:async()=>{
        const data=await api.get('/task-tags');
        return data.map(maptasktag);
    },
    getTagById:async(tagid)=>{
        const data=await api.get(`/task-tags/${tagid}`)
        return maptasktag(data);
    },
    getTagsByTask:async(taskid)=>{
        const data=await api.get(`/tasks/${taskid}/tags`);
        return data.map(maptasktag);
    },
    createTag:async(taskid,name,color)=>{
        const data=await api.post('/task-tags',{
            task:{id:taskid},
            name,
            color:color||"#888888"
        });
        return maptasktag(data);
    },
    deleteTag:async(tagid)=>{
        return api.delete(`/task-tags/${tagid}`)
    },
    getTransferByTask: async(taskid)=>{
        const data=await api.get(`/tasks/${taskid}/task-transfers`);
        return data.map(maptasktransfer)
    },
    getTransferById: async(transferid)=>{
        const data=await api.get(`/task-transfers/${transferid}`);
        return maptasktransfer(data);
    },
    createTransfer:async(taskid,fromemployeeid,toemployeeid,reason)=>{
        const data=await api.post('/task-transfers',{
            task:{id:taskid},
            fromEmployee:{id:fromemployeeid},
            toEmployee:{id:toemployeeid},
            reason:reason||'',
        });
        return maptasktransfer(data);
    },
    approveTransfer: async (transferid)=>{
        const data=await api.patch(`/task-transfers/${transferid}/approve`)
        return maptasktransfer(data);
    },

    rejectTransfer:async (transferid)=>{
        const data=await api.patch(`/task-transfers/${transferid}/reject`, 'Rejected')
        return maptasktransfer(data);
    },
    undoTransfer:async (transferid)=>{
        const data=await api.patch(`/task-transfers/${transferid}/undo`)
        return maptasktransfer(data);
    },
    getEtaExtensionByTask: async(taskid)=>{
        const data=await api.get(`/tasks/${taskid}/eta-extensions`);
        return data.map(mapetaextension);
    },
    getEtaExtensionById: async(extensionid)=>{
        const data=await api.get(`/eta-extensions/${extensionid}`);
        return mapetaextension(data);
    },
    createEtaExtension:async (taskid,requestbyid,newEtaDate,reason)=>{
        const data=await api.post('/eta-extensions',{
            task:{id:taskid},
            requestedBy:{id:requestbyid},
            newEtaDate,
            reason:reason||'',
        });
        return mapetaextension(data);
    },
    approveEtaExtension:async(extension)=>{
        const data=await api.patch(`/eta-extensions/${extension}/approve`)
        return mapetaextension(data);
    },
    rejectEtaExtension:async(extension)=>{
        const data=await api.patch(`/eta-extensions/${extension}/reject`)
        return mapetaextension(data);
    },
    undoEtaExtension:async(extension)=>{
        const data=await api.patch(`/eta-extensions/${extension}/undo`)
        return mapetaextension(data);
    },
    submitReview:async(id,justification='')=>{
        const data=await api.post(`/tasks/${id}/submit-review`,{justification})
        return maptask(data);
    },
    approveTaskReview:async(taskid,comment='')=>{
        const data=await api.post(`/tasks/${taskid}/review`,{
            status:'APPROVED',
            comment,
        })
        return maptask(data);
    },
    rejectTaskReview:async(taskid,comment='')=>{
        const data=await api.post(`/tasks/${taskid}/review`,{
            status:'REJECTED',
            comment,
        })
        return maptask(data);
    },
    unsubmitReview:async(id)=>{
        const data=await api.post(`/tasks/${id}/unsubmit-review`)
        return maptask(data);
    },
    undoReview:async(id)=>{
        const data=await api.post(`/tasks/${id}/undo-review`)
        return maptask(data);
    }
}