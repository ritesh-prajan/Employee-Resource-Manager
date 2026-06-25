import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import { taskService } from "../services/taskService.js";
import { useToast } from "../context/ToastContext";

export const TASK_KEY=["tasks"];
export const TASK_TAGS_KEY=['task-tags'];
export const TASK_TRANSFERES_KEY=["task-transfers"];
export const ETA_EXTENSIONS_KEY=["eta-extensions"];

let globalToast = null;

function describemutationerror(err,fallback){
  let detail=err?.message||'';
  try{
    const parsed=JSON.parse(detail);

  }catch{

  }
  return detail?`${fallback}: ${detail}` : fallback;
}

function alertonerror(fallback, err){
  console.error(fallback, err);
  if (globalToast) {
    globalToast.error(describemutationerror(err, fallback));
  }
}

export function useTasks(options={}){
  const queryclient=useQueryClient();
  const toast = useToast();
  globalToast = toast;
  const query=useQuery({
    queryKey:TASK_KEY,
    queryFn:async()=>{
      const taskdata=await taskService.getAll();
      const enrichedTasks=await Promise.all(
        taskdata.map(async(task)=>{
          try{
            const [comments,progresslogs,tags]=await Promise.all([
              taskService.getComments(task.id),
              taskService.getProgress(task.id),
              taskService.getAllTags(),
            ]);

            let latestprogress=0;
            if(progresslogs&&progresslogs.length>0){
              const sorted=[...progresslogs].sort(
                (a,b)=>new Date(b.createdAt)-new Date(a.createdAt)
              );
              latestprogress=sorted[0]?.progressPercentage??0;
            }
            const tasktags=(tags||[]).filter(tag=>tag.taskId===task.id);

            return{
              ...task,
              progress:latestprogress,
              comments:comments||[],
              tags:tasktags,
            };
          }catch(err){
            console.error(`failed to enrich task ${task.id}:`,err);
            return {...task,progress:0,comments:[],tags:[]};
          }
        })
      );
      return enrichedTasks;
    },
    ...options,
  })

  const createTask=useMutation({
    mutationFn:(data)=>taskService.create(data),
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:TASK_KEY});

    },
    onError:(err)=>alertonerror('failed to create task',err),
  })

  const updateTask=useMutation({
    mutationFn:({id,data})=>taskService.update(id,data),
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:TASK_KEY});
    },
    onError:(err)=>alertonerror('Failed to update task',err),
  });

  const removeTask=useMutation({
    mutationFn:({id,reason})=>taskService.delete(id,reason),
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:TASK_KEY});
    },
    onError:(err)=>alertonerror("failed to delete task",err),
  });
  const assignTask=useMutation({
    mutationFn:({taskId, userId, taskid, userid})=>{
      const tId = taskId || taskid;
      const uId = userId || userid;
      return taskService.assignTask(tId, uId);
    },
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:TASK_KEY});
    },
    onError:(err)=>alertonerror("failed to assign task",err),
  });
  const unassignTask=useMutation({
    mutationFn:(taskid)=>taskService.unassignTask(taskid),
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:TASK_KEY});
    },
    onError:(err)=>alertonerror("failed to unassign task",err),
  });
  const addTaskComment = useMutation({
    mutationFn: ({ taskId, authorEmployeeId, commentText }) =>
      taskService.addComment(taskId, authorEmployeeId, commentText),
    onSuccess: () => {
    
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
    },
    onError: (err) => alertonerror('Failed to add comment:', err),
  });


  const deleteTaskComment = useMutation({
    mutationFn: (commentId) => taskService.deleteComment(commentId),
    onSuccess: () => {
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
    },
    onError: (err) => alertonerror('Failed to delete comment:', err),
  });
  const updateTaskProgress = useMutation({
    mutationFn: ({ taskId, employeeId, progressPercentage, remarks }) =>
      taskService.addProgress(taskId, employeeId, progressPercentage, remarks),
    onSuccess: () => {
    
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
    },
    onError: (err) => alertonerror('Failed to update progress:', err),
  });

  
  const deleteTaskProgress = useMutation({
    mutationFn: (progressId) => taskService.deleteProgress(progressId),
    onSuccess: () => {
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
    },
    onError: (err) => alertonerror('Failed to delete progress log:', err),
  });

    const createTag = useMutation({
    mutationFn: ({ taskId, name, color }) =>
      taskService.createTag(taskId, name, color),
    onSuccess: () => {
     
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
      
      queryclient.invalidateQueries({ queryKey: TASK_TAGS_KEY });
    },
    onError: (err) => alertonerror('Failed to create tag:', err),
  });

  
  const deleteTag = useMutation({
    mutationFn: (tagId) => taskService.deleteTag(tagId),
    onSuccess: () => {
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
      queryclient.invalidateQueries({ queryKey: TASK_TAGS_KEY });
    },
    onError: (err) => alertonerror('Failed to delete tag:', err),
  });
  const createTransfer = useMutation({
    mutationFn: ({ taskId, fromEmployeeId, toEmployeeId, reason }) =>
      taskService.createTransfer(taskId, fromEmployeeId, toEmployeeId, reason),
    onSuccess: () => {
      
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
      queryclient.invalidateQueries({ queryKey: TASK_TRANSFERES_KEY });
    },
    onError: (err) => alertonerror('Failed to create transfer:', err),
  });

  const approveTransfer = useMutation({
    mutationFn: (transferId) => taskService.approveTransfer(transferId),
    onSuccess: () => {
     
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
      queryclient.invalidateQueries({ queryKey: TASK_TRANSFERES_KEY });
    },
    onError: (err) => alertonerror('Failed to approve transfer:', err),
  });

  
  const rejectTransfer = useMutation({
    mutationFn: (transferId) => taskService.rejectTransfer(transferId),
    onSuccess: () => {
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
      queryclient.invalidateQueries({ queryKey: TASK_TRANSFERES_KEY });
    },
    onError: (err) => alertonerror('Failed to reject transfer:', err),
  });

  
  const undoTransfer = useMutation({
    mutationFn: (transferId) => taskService.undoTransfer(transferId),
    onSuccess: () => {
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
      queryclient.invalidateQueries({ queryKey: TASK_TRANSFERES_KEY });
    },
    onError: (err) => alertonerror('Failed to undo transfer:', err),
  });
  const createEtaExtension = useMutation({
    mutationFn: ({ taskId, requestedById, newEtaDate, reason }) =>
      taskService.createEtaExtension(taskId, requestedById, newEtaDate, reason),
    onSuccess: () => {
      
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
      queryclient.invalidateQueries({ queryKey: ETA_EXTENSIONS_KEY });
    },
    onError: (err) => alertonerror('Failed to create ETA extension:', err),
  });

  
  const approveEtaExtension = useMutation({
    mutationFn: (extensionId) => taskService.approveEtaExtension(extensionId),
    onSuccess: () => {
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
      queryclient.invalidateQueries({ queryKey: ETA_EXTENSIONS_KEY });
    },
    onError: (err) => alertonerror('Failed to approve ETA extension:', err),
  });


  const rejectEtaExtension = useMutation({
    mutationFn: (extensionId) => taskService.rejectEtaExtension(extensionId),
    onSuccess: () => {
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
      queryclient.invalidateQueries({ queryKey: ETA_EXTENSIONS_KEY });
    },
    onError: (err) => alertonerror('Failed to reject ETA extension:', err),
  });

  
  const undoEtaExtension = useMutation({
    mutationFn: (extensionId) => taskService.undoEtaExtension(extensionId),
    onSuccess: () => {
      queryclient.invalidateQueries({ queryKey: TASK_KEY });
      queryclient.invalidateQueries({ queryKey: ETA_EXTENSIONS_KEY });
    },
    onError: (err) => alertonerror('Failed to undo ETA extension:', err),
  });

  const submitTaskReview=useMutation({
    mutationKey: ['submitTaskReview'],
    mutationFn:({taskId,justification})=> taskService.submitReview(taskId,justification),
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:TASK_KEY});
    },
    onError:(err)=>alertonerror("failed to submit task for review",err),
  });

  const approveTaskReview=useMutation({
     mutationKey: ['approveTaskReview'],
    mutationFn:({taskid,comment})=> taskService.approveTaskReview(taskid,comment),
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:TASK_KEY});
    },
    onError:(err)=>alertonerror("failed to approve task",err),
  });
  const rejectTaskReview=useMutation({
     mutationKey: ['rejectTaskReview'],
    mutationFn:({taskid,comment})=> taskService.rejectTaskReview(taskid,comment),
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:TASK_KEY});
    },
    onError:(err)=>alertonerror("failed to reject task",err),
  })
  
  const unsubmitTaskReview=useMutation({
    mutationFn:(taskid)=>taskService.unsubmitReview(taskid),
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:TASK_KEY});
    },
    onError:(err)=> alertonerror("Failed to unsubmit review",err),
  })

  const undoTaskReview=useMutation({
    mutationFn:(taskid)=>taskService.undoReview(taskid),
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:TASK_KEY})
    },
    onError:(err)=>alertonerror('Failed to undo task review',err),
  })
  return{
    tasks:query.data??[],
    isLoading:query.isLoading,
    isFetching:query.isFetching,
    error:query.error,
    createTask,
    updateTask,
    removeTask,
    assignTask,
    unassignTask,
    addTaskComment,
    deleteTaskComment,
    updateTaskProgress,
    deleteTaskProgress,
    createTag,
    deleteTag,
    createTransfer,
    approveTransfer,
    rejectTransfer,
    undoTransfer,
    createEtaExtension,
    approveEtaExtension,
    rejectEtaExtension,
    undoEtaExtension,
    submitTaskReview,
    approveTaskReview,
    rejectTaskReview,
    unsubmitTaskReview,
    undoTaskReview,
    invalidate:()=>queryclient.invalidateQueries({queryKey:TASK_KEY}),
  }
}