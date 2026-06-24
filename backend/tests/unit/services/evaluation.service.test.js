import { jest } from "@jest/globals";

const projectFindByIdMock = jest.fn();

const featureFindMock = jest.fn();
const taskFindMock = jest.fn();
const deadlineFindMock = jest.fn();
const groupFileFindMock = jest.fn();
const meetingLogFindMock = jest.fn();

const evaluationFindOneMock = jest.fn();
const completionAuditCreateMock = jest.fn();
const completionPolicyFindOneMock = jest.fn();
const userFindByIdMock = jest.fn();

await jest.unstable_mockModule("../../../src/models/project.model.js", () => ({
  default: {
    findById: projectFindByIdMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/group.model.js", () => ({
  default: {},
}));

await jest.unstable_mockModule("../../../src/models/task.model.js", () => ({
  default: {
    find: taskFindMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/feature.model.js", () => ({
  default: {
    find: featureFindMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/deadline.model.js", () => ({
  default: {
    find: deadlineFindMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/meetingLog.model.js", () => ({
  default: {
    find: meetingLogFindMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/groupFile.model.js", () => ({
  default: {
    find: groupFileFindMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/evaluation.model.js", () => ({
  default: {
    findOne: evaluationFindOneMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/completionAudit.model.js", () => ({
  default: {
    create: completionAuditCreateMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/completionPolicy.model.js", () => ({
  default: {
    findOne: completionPolicyFindOneMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/user.model.js", () => ({
  default: {
    findById: userFindByIdMock,
  },
}));

const evaluationService = await import("../../../src/services/teacher/evaluation.service.js");

const mockLeanQuery = (value) => ({ lean: jest.fn().mockResolvedValue(value) });

const setupCommonMetricsMocks = ({ features = [], tasks = [], deadlines = [], files = [], meetings = [] } = {}) => {
  featureFindMock.mockReturnValue(mockLeanQuery(features));
  taskFindMock.mockReturnValue(mockLeanQuery(tasks));
  deadlineFindMock.mockReturnValue(mockLeanQuery(deadlines));
  groupFileFindMock.mockReturnValue(mockLeanQuery(files));
  meetingLogFindMock.mockReturnValue(mockLeanQuery(meetings));
};

const setupProjectFindByIdForSupervisorFlow = (projectDoc) => {
  projectFindByIdMock
    .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(projectDoc) })
    .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(projectDoc) });
};

const setupNoPolicyInDb = () => {
  completionPolicyFindOneMock.mockReturnValue({
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    }),
  });
};

describe("teacher/evaluation.service completion policy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("markProjectCompleted denies transition and writes deny audit when readiness policy fails", async () => {
    const projectDoc = {
      _id: "p1",
      status: "approved",
      group: { _id: "g1", supervisor: { equals: () => true } },
      save: jest.fn().mockResolvedValue(undefined),
    };

    setupProjectFindByIdForSupervisorFlow(projectDoc);
    setupNoPolicyInDb();
    setupCommonMetricsMocks({
      features: [],
      tasks: [],
      deadlines: [],
      files: [],
      meetings: [],
    });

    evaluationFindOneMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      evaluationService.markProjectCompleted("p1", "t1"),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Project is not eligible for completion yet",
    });

    expect(completionAuditCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        project: "p1",
        group: "g1",
        actor: "t1",
        decision: "deny",
      }),
    );
  });

  test("markProjectCompleted allows transition and writes allow audit when policy passes", async () => {
    const projectDoc = {
      _id: "p2",
      status: "approved",
      group: { _id: "g2", supervisor: { equals: () => true } },
      save: jest.fn().mockResolvedValue(undefined),
    };

    setupProjectFindByIdForSupervisorFlow(projectDoc);
    setupNoPolicyInDb();
    setupCommonMetricsMocks({
      features: [{ status: "completed" }],
      tasks: [
        { status: "completed" },
        { status: "completed" },
        { status: "completed" },
        { status: "completed" },
        { status: "completed" },
      ],
      deadlines: [],
      files: [{ _id: "f1" }],
      meetings: [],
    });

    evaluationFindOneMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: "ev1", status: "published" }),
      }),
    });

    const result = await evaluationService.markProjectCompleted("p2", "t2");

    expect(result.status).toBe("completed");
    expect(projectDoc.save).toHaveBeenCalled();
    expect(completionAuditCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        project: "p2",
        group: "g2",
        actor: "t2",
        decision: "allow",
      }),
    );
  });

  test("saveEvaluation blocks publish when readiness requirements are not met", async () => {
    const projectDoc = {
      _id: "p3",
      status: "approved",
      group: { _id: "g3", supervisor: { equals: () => true } },
      save: jest.fn().mockResolvedValue(undefined),
    };

    projectFindByIdMock
      .mockReturnValueOnce({
        populate: jest.fn().mockResolvedValue(projectDoc),
      })
      .mockReturnValueOnce({
        populate: jest.fn().mockResolvedValue(projectDoc),
      });

    setupNoPolicyInDb();
    setupCommonMetricsMocks({
      features: [],
      tasks: [],
      deadlines: [],
      files: [],
      meetings: [],
    });

    const existingDraftEval = {
      status: "draft",
      groupGrade: null,
      memberGrades: [],
      evaluatedBy: null,
      activities: [],
      save: jest.fn().mockResolvedValue(undefined),
    };

    evaluationFindOneMock.mockResolvedValue(existingDraftEval);

    await expect(
      evaluationService.saveEvaluation("p3", "t3", {
        groupGrade: { score: 75, maxScore: 100, breakdown: {} },
        memberGrades: [],
        status: "published",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Evaluation cannot be published until readiness requirements are met",
    });
  });

  test("saveEvaluation rejects any mutation when existing evaluation is already published", async () => {
    const projectDoc = {
      _id: "p4",
      status: "approved",
      group: { _id: "g4", supervisor: { equals: () => true } },
      save: jest.fn().mockResolvedValue(undefined),
    };

    projectFindByIdMock.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(projectDoc),
    });

    evaluationFindOneMock.mockResolvedValue({
      _id: "ev4",
      status: "published",
      activities: [],
      save: jest.fn(),
    });

    await expect(
      evaluationService.saveEvaluation("p4", "t4", {
        groupGrade: { score: 82, maxScore: 100, breakdown: {} },
        memberGrades: [],
        status: "draft",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "This evaluation has already been published and cannot be modified",
    });
  });

  test("requestSecondReview moves draft evaluation to pending_second_review", async () => {
    const projectDoc = {
      _id: "p5",
      status: "approved",
      group: { _id: "g5", supervisor: { equals: () => true } },
    };

    projectFindByIdMock.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(projectDoc),
    });

    const existingDraftEval = {
      status: "draft",
      moderation: {},
      activities: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    evaluationFindOneMock.mockResolvedValue(existingDraftEval);
    userFindByIdMock.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "rv1", role: "teacher" }),
    });

    const result = await evaluationService.requestSecondReview("p5", "t5", {
      secondReviewerId: "rv1",
      note: "Please moderate before publication",
    });

    expect(result.status).toBe("pending_second_review");
    expect(result.moderation.required).toBe(true);
    expect(result.moderation.decision).toBe("pending");
    expect(existingDraftEval.save).toHaveBeenCalled();
  });

  test("submitSecondReviewDecision publishes evaluation on approved decision by assigned reviewer", async () => {
    const pendingEval = {
      status: "pending_second_review",
      moderation: {
        secondReviewer: "rv2",
        decision: "pending",
      },
      activities: [],
      save: jest.fn().mockResolvedValue(undefined),
    };

    evaluationFindOneMock.mockResolvedValue(pendingEval);

    const result = await evaluationService.submitSecondReviewDecision("p6", "rv2", {
      decision: "approved",
      note: "Looks valid",
    });

    expect(result.status).toBe("published");
    expect(result.moderation.decision).toBe("approved");
    expect(pendingEval.save).toHaveBeenCalled();
  });
});
