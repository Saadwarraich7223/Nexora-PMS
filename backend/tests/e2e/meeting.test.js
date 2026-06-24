import mongoose from "mongoose";
import { connectTestDB, clearTestDB, disconnectTestDB } from "../helpers/db.js";
import { getTestApp } from "../helpers/app.js";
import { createStudentWithAgent } from "../helpers/auth.js";
import Notification from "../../src/models/notification.model.js";

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

const setupGroupWithMember = async () => {
  const leader = await createStudentWithAgent(app, {
    registrationNumber: "REG-M-1001",
    email: "leader-m-1001@example.com",
    name: "Leader Meeting",
    department: "CS",
    semester: 8,
  });

  const member = await createStudentWithAgent(app, {
    registrationNumber: "REG-M-1002",
    email: "member-m-1002@example.com",
    name: "Member Meeting",
    department: "CS",
    semester: 8,
  });

  const createGroupRes = await leader.agent.post("/api/student/groups").send({
    name: "Meetings Group",
    department: "CS",
    semester: 8,
  });
  expect(createGroupRes.status).toBe(200);

  const inviteRes = await leader.agent
    .post("/api/student/groups/invite")
    .send({ receiverId: member.user._id });
  expect(inviteRes.status).toBe(200);

  const invitesRes = await member.agent.get("/api/student/groups/invites");
  expect(invitesRes.status).toBe(200);
  const inviteId = invitesRes.body.invites[0]._id;

  const acceptRes = await member.agent
    .post(`/api/student/groups/invites/${inviteId}`)
    .send({ accept: true });
  expect(acceptRes.status).toBe(200);

  return { leader, member };
};

describe("Student Meetings API", () => {
  test("leader can create a team meeting with task/feature updates", async () => {
    const { leader, member } = await setupGroupWithMember();

    const taskRes = await leader.agent.post("/api/student/tasks").send({
      title: "Prepare sprint board",
      description: "Prepare board before meeting",
      assignedTo: member.user._id,
      priority: "medium",
      status: "todo",
    });
    expect(taskRes.status).toBe(201);

    const featureRes = await leader.agent.post("/api/student/features").send({
      name: "Meeting Dashboard",
      description: "Track meetings and attendance",
      relatedTasks: [taskRes.body.task._id],
    });
    expect(featureRes.status).toBe(201);

    const meetingRes = await leader.agent.post("/api/student/meetings").send({
      date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      location: "Lab 2",
      agenda: "Sprint planning and assignments",
      discussionPoints: ["Finalize sprint scope", "Confirm owners"],
      attendees: [leader.user._id, member.user._id],
      taskUpdates: [{ task: taskRes.body.task._id, note: "Assigned to member" }],
      featureUpdates: [
        { feature: featureRes.body.feature._id, note: "Kickoff approved", progress: 15 },
      ],
    });

    expect(meetingRes.status).toBe(201);
    expect(meetingRes.body.meeting.type).toBe("Team Meeting");
    expect(meetingRes.body.meeting.taskUpdates.length).toBe(1);
    expect(meetingRes.body.meeting.featureUpdates.length).toBe(1);
  });

  test("member is forbidden from creating a team meeting", async () => {
    const { member } = await setupGroupWithMember();

    const meetingRes = await member.agent.post("/api/student/meetings").send({
      date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      agenda: "Trying to create as non-leader",
    });

    expect(meetingRes.status).toBe(403);
  });

  test("leader cannot set invalid attendee outside group", async () => {
    const { leader } = await setupGroupWithMember();
    const outsiderId = new mongoose.Types.ObjectId().toString();

    const meetingRes = await leader.agent.post("/api/student/meetings").send({
      date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      agenda: "Attendance validation",
      attendees: [outsiderId],
    });

    expect(meetingRes.status).toBe(400);
  });

  test("creating a meeting notifies other group members", async () => {
    const { leader, member } = await setupGroupWithMember();

    const meetingRes = await leader.agent.post("/api/student/meetings").send({
      date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      agenda: "Notification test meeting",
      attendees: [leader.user._id, member.user._id],
    });
    expect(meetingRes.status).toBe(201);

    const memberNotifications = await Notification.find({
      user: member.user._id,
      type: "meeting",
    });

    expect(memberNotifications.length).toBeGreaterThan(0);
    expect(String(memberNotifications[0].message || "").toLowerCase()).toContain(
      "team meeting",
    );
  });
});
