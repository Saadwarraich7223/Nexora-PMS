import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FiActivity } from "react-icons/fi";

const COLUMN_ORDER = ["todo", "in-progress", "review", "completed"];

const COLUMN_META = {
  todo: {
    label: "To Do",
    hint: "Planned tasks",
    className: "student-kanban-todo",
  },
  "in-progress": {
    label: "In Progress",
    hint: "Currently being worked",
    className: "student-kanban-progress",
  },
  review: {
    label: "Review",
    hint: "Awaiting validation",
    className: "student-kanban-review",
  },
  completed: {
    label: "Completed",
    hint: "Done tasks",
    className: "student-kanban-completed",
  },
};

const priorityBadgeClass = {
  high: "student-priority-high",
  medium: "student-priority-medium",
  low: "student-priority-low",
};

const normalizePriority = (priority) => {
  const value = String(priority || "medium").toLowerCase();
  if (["high", "medium", "low"].includes(value)) return value;
  return "medium";
};

const TaskKanbanBoard = ({
  tasksByColumn,
  canDragTask,
  isTaskOwnedByCurrentUser,
  handleDropTask,
  openTaskDrawer,
}) => {
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;
    handleDropTask(draggableId, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid gap-4 xl:grid-cols-4 select-none">
        {COLUMN_ORDER.map((columnKey) => (
          <Droppable droppableId={columnKey} key={columnKey}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ 
                  zIndex: snapshot.draggingFromThisWith ? 50 : 1,
                  position: "relative"
                }}
                className={`student-kanban-col rounded-xl p-4 bg-slate-50/30 border border-slate-200/50 shadow-xs transition-colors min-h-[500px] ${
                  snapshot.isDraggingOver
                    ? "ring-2 ring-indigo-400/20 bg-indigo-50/40 border-indigo-200"
                    : ""
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">
                      {COLUMN_META[columnKey].label}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {COLUMN_META[columnKey].hint}
                    </p>
                  </div>
                  <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-lg bg-slate-900 text-[9px] font-black text-white shadow-md">
                    {tasksByColumn[columnKey]?.length || 0}
                  </span>
                </div>

                <div className="space-y-3">
                  {(tasksByColumn[columnKey] || []).map((task, index) => {
                    const taskPriority = normalizePriority(task.priority);
                    const assignedName = task.assignedTo?.name || "Unassigned";
                    const dueDate = task.deadline
                      ? new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      : "Open";
                    const isMine = isTaskOwnedByCurrentUser(task);
                    const canDrag = canDragTask(task);
                    
                    const isBlocked = (task.dependencies || []).some((dep) => {
                      const status = String(dep.status || "todo").toLowerCase();
                      return status !== "completed" && status !== "done";
                    });

                    const draggable = canDrag && !isBlocked;

                    return (
                      <Draggable
                        key={task._id}
                        draggableId={String(task._id)}
                        index={index}
                        isDragDisabled={!draggable}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              zIndex: snapshot.isDragging ? 9999 : 1,
                            }}
                            onClick={() => openTaskDrawer(task)}
                            className={`student-kanban-card relative group overflow-hidden rounded-xl border p-4 shadow-xs transition-all active:scale-95 ${
                              snapshot.isDragging
                                ? "border-indigo-500 ring-4 ring-indigo-500/10 shadow-2xl scale-[1.02] bg-white"
                                : isMine && !isBlocked
                                  ? "border-indigo-200 bg-white hover:border-indigo-400 hover:shadow-md"
                                  : "border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm"
                            } ${!draggable ? "opacity-60 cursor-default" : "cursor-grab"}`}
                          >
                            {/* Accent Bar */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                               taskPriority === 'high' ? 'bg-rose-500' :
                               taskPriority === 'medium' ? 'bg-indigo-500' :
                               'bg-slate-300'
                            }`} />

                            {task.status === 'completed' && (
                               <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100 animate-pulse">
                                  <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Synthesized</span>
                               </div>
                            )}

                            <div className="flex flex-col gap-1 pr-8">
                               <div className="flex items-center gap-2">
                                 {isMine && (
                                   <div className="flex h-4 items-center gap-1 rounded-md bg-indigo-600 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest text-white shadow-sm ring-1 ring-indigo-400">
                                     Operator
                                   </div>
                                 )}
                                 <p className="flex-1 truncate text-[13px] font-black text-slate-900 uppercase tracking-tight leading-tight transition-colors group-hover:text-indigo-600">
                                   {task.title}
                                 </p>
                               </div>
                               <p className="line-clamp-2 text-[10px] font-medium leading-relaxed text-slate-500">
                                 {task.description}
                               </p>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-lg px-2 py-1 text-[8px] font-black uppercase tracking-widest border border-slate-100 ${
                                   taskPriority === 'high' ? 'bg-rose-50 text-rose-600' :
                                   taskPriority === 'medium' ? 'bg-indigo-50 text-indigo-600' :
                                   'bg-slate-50 text-slate-600'
                                }`}
                              >
                                {taskPriority}
                              </span>
                              
                              {isBlocked && (
                                <span className="flex items-center gap-1 rounded-lg border border-amber-100 bg-amber-50 px-2 py-1 text-[8px] font-black text-amber-700 uppercase tracking-widest">
                                  LOCKED
                                </span>
                              )}

                              {(task.linkedResources || []).length > 0 && (
                                <span className="rounded-lg border border-cyan-100 bg-cyan-50 px-2 py-1 text-[8px] font-black text-cyan-700 uppercase tracking-widest">
                                  INTEL x{(task.linkedResources || []).length}
                                </span>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">
                                  {assignedName.charAt(0).toUpperCase()}
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  {assignedName.split(" ")[0]}
                                </p>
                              </div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-50 rounded-lg">
                                {dueDate}
                              </p>
                            </div>

                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                  {(tasksByColumn[columnKey] || []).length === 0 &&
                    !snapshot.isDraggingOver && (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/20 px-3 py-10 text-center flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-300 mb-2">
                           <FiActivity size={14} />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Null Segment</p>
                      </div>
                    )}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

export default TaskKanbanBoard;
