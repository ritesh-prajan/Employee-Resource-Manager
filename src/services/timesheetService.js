import { api } from "./api";

function mapentry(entry){
  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    if (isoStr.includes('T')) {
      return isoStr.split('T')[1].slice(0, 5);
    }
    return isoStr;
  };

  return {
    id: entry.id,
    employeeId: entry.employee?.id || null,
    userId:entry.employee?.id||null,
    taskId: entry.task?.id || null,
    projectId: entry.project?.id || null,
    date: entry.date || '',
    startTime: formatTime(entry.startTime),
    endTime: formatTime(entry.endTime),
    duration: entry.durationHours ? entry.durationHours.toString() : "0",
    durationHours: entry.durationHours || 0,
    workCategory: mapcategory(entry.workCategory),
    bugNumber: entry.bugNumber || '',
    description: entry.description || '',
    justification: entry.justification || '',
    status: mapstatus(entry.status),
    managerComment: entry.managerComment || '',
  };
}

function mapexit(exit){
  const dateStr = exit.date || new Date().toISOString().split('T')[0];
  const formatDateTime = (timeStr) => {
    if (!timeStr) return null;
    if (timeStr.includes('T')) return timeStr;
    return `${dateStr}T${timeStr}:00`;
  };

  let calculatedEndTime = exit.endTime;
  if (!calculatedEndTime && exit.startTime && (exit.duration || exit.durationHours)) {
    const duration = exit.duration ? Number(exit.duration) : (exit.durationHours || 0);
    const match = exit.startTime.match(/^(\d{2}):(\d{2})$/);
    if (match) {
      const startHrs = parseInt(match[1], 10);
      const startMins = parseInt(match[2], 10);
      const totalMinutes = startHrs * 60 + startMins + Math.round(duration * 60);
      const endHrs = Math.floor(totalMinutes / 60) % 24;
      const endMins = totalMinutes % 60;
      calculatedEndTime = `${String(endHrs).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
    }
  }

  return {
    employee: { id: exit.employeeId || exit.userId },
    task: (exit.taskId && exit.taskId !== 'Break' && exit.taskId !== '') ? { id: Number(exit.taskId) } : null,
    project: exit.projectId && exit.projectId !== 'Break' ? { id: Number(exit.projectId) } : null,
    date: dateStr,
    startTime: formatDateTime(exit.startTime),
    endTime: formatDateTime(calculatedEndTime),
    durationHours: exit.duration ? Number(exit.duration) : (exit.durationHours || 0),
    workCategory: tobackendcategory(exit.workCategory),
    description: exit.description || '',
    justification: exit.justification || '',
  };
}

function mapstatus (status){
  const map={
    PENDING:"Pending",
    APPROVED:'Approved',
    REJECTED :'Rejected',
  };
  return map[status]||status;
}

function mapcategory(category){
  const map={
    STORY:"Story",
    BUG:'Bug',
    FEATURE:'Feature',
    SUPPORT:'Support',
    MEETING:'Meeting',
    ADMIN:'Admin',
    BREAK:'Break',
  };
  return map[category]||(category||'Story');
}

  function tobackendcategory(cat){
  const map={
    Story:'STORY',
    Bug:'BUG',
    Feature:'FEATURE',
    Support:'SUPPORT',
    Meeting:'MEETING',
    Admin:'ADMIN',
    Break:'BREAK',
    'R&D':'R&D',
    Review:'REVIEW',
    General:'GENERAL',
  }
  return map[cat] || 'STORY';
}

export const timesheetService={
  getAll:async(params={})=>{
    const qs=new URLSearchParams(params).toString();
    const data =await api.get(`/timesheets${qs?'?'+qs:''}`)
    return data.map(mapentry)
  },
  getByEmployee:async(employeeid)=>{
    const data=await api.get(`/timesheets?employeeId=${employeeid}`);
    return data.map(mapentry)
  },
  create:async(entrydata)=>{
    const body=mapexit(entrydata);
    const data=await api.post('/timesheets',body);
    return mapentry(data);
  },
  updateStatus:async(id,status,managerComment='')=>{
    const data=await api.patch(`/timesheets/${id}/status`,{
      status:status.toUpperCase(),
      managerComment,
    }
    )
    return mapentry(data);
  },
  delete: async(id)=>{
    return api.delete(`/timesheets/${id}`);
  }
}