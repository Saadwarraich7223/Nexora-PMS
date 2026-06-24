import asyncHandler from "../../utils/asyncHandler.js";
import * as supervisorService from "../../services/admin/supervisor.service.js";

const assignSupervisor = asyncHandler(async (req, res) => {
  const group = await supervisorService.assignSupervisorToGroup({
    groupId: req.body.groupId,
    supervisorId: req.body.supervisorId,
  });

  res.json({ message: "Supervisor assigned to the group", group });
});

const getRecommendedSupervisors = asyncHandler(async (req, res) => {
  const list = await supervisorService.recommendSupervisors(
    req.query.department,
    req.query.groupId
  );
  res.json({ supervisors: list });
});

const getSupervisors = asyncHandler(async (_req, res) => {
  const supervisors = await supervisorService.listSupervisors();
  res.json({ supervisors });
});

const getWorkload = asyncHandler(async (req, res) => {
  const workload = await supervisorService.getSupervisorWorkload(req.params.id);
  res.json({ workload });
});

export {
  assignSupervisor,
  getRecommendedSupervisors,
  getSupervisors,
  getWorkload,
};
