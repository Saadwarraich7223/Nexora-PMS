import request from "supertest";
import { connectTestDB, clearTestDB, disconnectTestDB } from "../helpers/db.js";
import { getTestApp } from "../helpers/app.js";
import { createStudentWithAgent } from "../helpers/auth.js";
import User from "../../src/models/user.model.js";
import Group from "../../src/models/group.model.js";

let app;

beforeAll(async () => {
  await connectTestDB();
  app = await getTestApp();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("Student Group API", () => {
  test("leader can create group and invite a student", async () => {
    const leader = await createStudentWithAgent(app, {
      registrationNumber: "REG-4001",
      email: "leader@example.com",
      name: "Leader",
      department: "CS",
      semester: 8,
    });

    const member = await createStudentWithAgent(app, {
      registrationNumber: "REG-4002",
      email: "member@example.com",
      name: "Member",
      department: "CS",
      semester: 8,
    });

    const createRes = await leader.agent.post("/api/student/groups").send({
      name: "Alpha Group",
      department: "CS",
      semester: 8,
    });

    expect(createRes.status).toBe(200);
    expect(createRes.body.group).toBeDefined();

    const inviteRes = await leader.agent
      .post("/api/student/groups/invite")
      .send({ receiverId: member.user._id });

    expect(inviteRes.status).toBe(200);
    expect(inviteRes.body.invite).toBeDefined();

    const pendingRes = await member.agent.get("/api/student/groups/invites");
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.invites.length).toBe(1);

    const inviteId = pendingRes.body.invites[0]._id;
    const acceptRes = await member.agent
      .post(`/api/student/groups/invites/${inviteId}`)
      .send({ accept: true });

    expect(acceptRes.status).toBe(200);
  });

  test("student can fetch related groups and related students", async () => {
    const student = await createStudentWithAgent(app, {
      registrationNumber: "REG-5001",
      email: "student@example.com",
      name: "Student",
      department: "CS",
      semester: 8,
    });

    await createStudentWithAgent(app, {
      registrationNumber: "REG-5002",
      email: "peer@example.com",
      name: "Peer Student",
      department: "CS",
      semester: 8,
    });

    const groupsRes = await student.agent.get("/api/student/groups");
    expect(groupsRes.status).toBe(200);
    expect(Array.isArray(groupsRes.body.groups)).toBe(true);

    const studentsRes = await student.agent.get("/api/student/groups/students");
    expect(studentsRes.status).toBe(200);
    expect(Array.isArray(studentsRes.body.students)).toBe(true);
    expect(studentsRes.body.students.length).toBeGreaterThanOrEqual(2);
  });

  test("approved group leader can request a supervisor and admin can review it", async () => {
    const leader = await createStudentWithAgent(app, {
      registrationNumber: "REG-6001",
      email: "leader6001@example.com",
      name: "Leader 6001",
      department: "CS",
      semester: 8,
    });

    const member = await createStudentWithAgent(app, {
      registrationNumber: "REG-6002",
      email: "member6002@example.com",
      name: "Member 6002",
      department: "CS",
      semester: 8,
    });

    const teacher = await User.create({
      name: "Teacher 6001",
      email: "teacher6001@example.com",
      password: "secret123",
      role: "teacher",
      department: "CS",
      supervisorCapacity: 2,
    });

    await User.create({
      name: "Admin 6001",
      email: "admin6001@example.com",
      password: "secret123",
      role: "admin",
    });

    const adminAgent = request.agent(app);
    const adminLoginRes = await adminAgent.post("/api/auth/login").send({
      email: "admin6001@example.com",
      password: "secret123",
      role: "admin",
    });
    expect(adminLoginRes.status).toBe(200);

    const createGroupRes = await leader.agent.post("/api/student/groups").send({
      name: "Group 6001",
      department: "CS",
      semester: 8,
    });
    expect(createGroupRes.status).toBe(200);

    const inviteRes = await leader.agent
      .post("/api/student/groups/invite")
      .send({ receiverId: member.user._id });
    expect(inviteRes.status).toBe(200);

    const pendingInvitesRes = await member.agent.get("/api/student/groups/invites");
    const inviteId = pendingInvitesRes.body.invites[0]._id;
    const acceptRes = await member.agent
      .post(`/api/student/groups/invites/${inviteId}`)
      .send({ accept: true });
    expect(acceptRes.status).toBe(200);

    const submitRes = await leader.agent.post("/api/student/groups/submit");
    expect(submitRes.status).toBe(200);

    const groupId = createGroupRes.body.group._id;
    const adminApproveGroupRes = await adminAgent.patch(
      `/api/admin/groups/${groupId}/approve`,
    );
    expect(adminApproveGroupRes.status).toBe(200);

    const availableRes = await leader.agent.get(
      "/api/student/groups/supervisors/available",
    );
    expect(availableRes.status).toBe(200);
    expect(Array.isArray(availableRes.body.supervisors)).toBe(true);
    expect(availableRes.body.supervisors.length).toBeGreaterThan(0);

    const createRequestRes = await leader.agent
      .post("/api/student/groups/supervisor-request")
      .send({ supervisorId: teacher._id, note: "Need AI domain guidance" });
    expect(createRequestRes.status).toBe(201);
    expect(createRequestRes.body.request.status).toBe("pending");

    const listRequestsRes = await adminAgent.get(
      "/api/admin/groups/supervisor-requests/list?status=pending",
    );
    expect(listRequestsRes.status).toBe(200);
    expect(Array.isArray(listRequestsRes.body.requests)).toBe(true);
    expect(listRequestsRes.body.requests.length).toBeGreaterThan(0);

    const requestId = createRequestRes.body.request._id;
    const reviewRes = await adminAgent
      .patch(`/api/admin/groups/supervisor-requests/${requestId}/review`)
      .send({ approve: true, reviewNote: "Approved" });
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.request.status).toBe("approved");

    const groupAfter = await Group.findById(groupId);
    expect(String(groupAfter.supervisor)).toBe(String(teacher._id));
  });
});
