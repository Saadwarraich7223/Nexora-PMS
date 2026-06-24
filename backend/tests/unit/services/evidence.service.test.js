import { jest } from "@jest/globals";

const projectFindByIdMock = jest.fn();
const rubricCriteriaFindMock = jest.fn();
const rubricCriteriaFindOneMock = jest.fn();
const milestoneFindMock = jest.fn();
const featureFindMock = jest.fn();
const taskFindMock = jest.fn();

await jest.unstable_mockModule("../../../src/models/project.model.js", () => ({
  default: {
    findById: projectFindByIdMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/rubricCriteria.model.js", () => ({
  default: {
    find: rubricCriteriaFindMock,
    findOne: rubricCriteriaFindOneMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/milestone.model.js", () => ({
  default: {
    find: milestoneFindMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/feature.model.js", () => ({
  default: {
    find: featureFindMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/task.model.js", () => ({
  default: {
    find: taskFindMock,
  },
}));

const evidenceService = await import("../../../src/services/evidence.service.js");

describe("EvidenceService", () => {
  const projectId = "project123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProjectQualityReport", () => {
    it("should calculate correct overall quality score", async () => {
      // Mock Rubric
      const criteria = [
        { key: "crit1", label: "Crit 1", isRequired: true, evidenceType: "file" },
        { key: "crit2", label: "Crit 2", isRequired: true, evidenceType: "link" }
      ];
      rubricCriteriaFindMock.mockResolvedValue(criteria);
      
      rubricCriteriaFindOneMock.mockImplementation(({ key }) => 
        Promise.resolve(criteria.find(c => c.key === key))
      );

      // Mock Project
      const projectDoc = {
        _id: projectId,
        group: { department: "CS", semester: 8 },
        evidenceRegistry: [
          { criterionKey: "crit1", value: "file123", validationStatus: "approved" }
        ],
        analysis: { score: 85 }
      };

      projectFindByIdMock.mockReturnValue({
        populate: jest.fn().mockResolvedValue(projectDoc),
        lean: jest.fn().mockResolvedValue(projectDoc)
      });

      const report = await evidenceService.default.getProjectQualityReport(projectId);

      // crit1 is satisfied (100%), crit2 is missing (0%). Average = 50%
      expect(report.overallQualityScore).toBe(50);
      expect(report.mandatorySatisfied).toBe(false);
      expect(report.criteria.length).toBe(2);
    });

    it("should satisfy mandatory status if all required are approved", async () => {
      const criteria = [
        { key: "crit1", label: "Crit 1", isRequired: true, evidenceType: "file" }
      ];
      rubricCriteriaFindMock.mockResolvedValue(criteria);
      rubricCriteriaFindOneMock.mockResolvedValue(criteria[0]);

      const projectDoc = {
        _id: projectId,
        evidenceRegistry: [
          { criterionKey: "crit1", value: "file123", validationStatus: "approved" }
        ]
      };

      projectFindByIdMock.mockReturnValue({
        populate: jest.fn().mockResolvedValue(projectDoc),
        lean: jest.fn().mockResolvedValue(projectDoc)
      });

      const report = await evidenceService.default.getProjectQualityReport(projectId);
      expect(report.mandatorySatisfied).toBe(true);
      expect(report.overallQualityScore).toBe(100);
    });
  });
});
